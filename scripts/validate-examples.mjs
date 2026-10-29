import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const templateDir = path.join(root, 'templates', 'threejs-basic');
const examplesDir = path.join(root, 'examples');
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const requiredFiles = ['.gitignore', 'index.html', 'package.json', 'example.json', 'README.md', 'docs/PROJECT.md'];
const alternativeFiles = [
  ['src/main.js', 'src/main.ts'],
  ['src/style.css', 'src/styles/main.css'],
  ['vite.config.js', 'vite.config.ts'],
];

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function readJson(file, errors) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    errors.push(`${path.basename(file)} 无法读取或不是合法 JSON：${error.message}`);
    return null;
  }
}

function withinDirectory(directory, target) {
  const relative = path.relative(directory, target);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function validateExample(directory) {
  const errors = [];
  const slug = path.basename(directory);

  for (const file of requiredFiles) {
    if (!(await exists(path.join(directory, file)))) errors.push(`缺少 ${file}`);
  }

  if (!slugPattern.test(slug)) errors.push(`目录名称不符合英文 slug 规范：${slug}`);

  for (const alternatives of alternativeFiles) {
    if (!(await Promise.all(alternatives.map((file) => exists(path.join(directory, file))))).some(Boolean)) {
      errors.push('缺少 ' + alternatives.join(' 或 '));
    }
  }

  const metadata = await readJson(path.join(directory, 'example.json'), errors);
  const packageData = await readJson(path.join(directory, 'package.json'), errors);

  if (metadata) {
    if (metadata.slug !== slug) errors.push('example.json 的 slug 必须和目录名称一致');
    for (const key of ['name', 'description', 'category']) {
      if (typeof metadata[key] !== 'string' || !metadata[key].trim()) errors.push(`example.json 的 ${key} 必须为非空字符串`);
    }
    if (!Array.isArray(metadata.tags) || !metadata.tags.length || metadata.tags.some((tag) => typeof tag !== 'string' || !tag.trim())) {
      errors.push('example.json 的 tags 必须为非空字符串数组');
    }
    if (typeof metadata.visible !== 'boolean') errors.push('example.json 的 visible 必须为布尔值');

    const cover = metadata.cover;
    if (typeof cover !== 'string' || !/^public\/[\w./-]+\.(svg|webp|png|jpg|jpeg)$/i.test(cover)) {
      errors.push('example.json 的 cover 必须指向 public/ 内的 SVG、WebP、PNG 或 JPEG 图片');
    } else {
      const coverPath = path.resolve(directory, cover);
      if (!withinDirectory(path.join(directory, 'public'), coverPath)) {
        errors.push('cover 不允许引用案例 public/ 目录之外的文件');
      } else if (!(await exists(coverPath)) || !(await stat(coverPath)).isFile()) {
        errors.push(`封面文件不存在：${cover}`);
      }
    }
  }

  if (packageData) {
    if (packageData.name !== slug) errors.push('package.json 的 name 必须和 slug 一致');
    for (const script of ['dev', 'build', 'preview']) {
      if (typeof packageData.scripts?.[script] !== 'string' || !packageData.scripts[script].trim()) errors.push(`缺少 npm run ${script} 脚本`);
    }
    if (typeof packageData.dependencies?.three !== 'string') errors.push('必须在 dependencies 声明 Three.js');
    if (typeof (packageData.devDependencies?.vite || packageData.dependencies?.vite) !== 'string') errors.push('必须声明 Vite 依赖');
    for (const [name, version] of Object.entries({ ...packageData.dependencies, ...packageData.devDependencies })) {
      if (typeof version !== 'string' || /^(?:workspace:|file:|link:|\.\.?[\\/])/i.test(version)) {
        errors.push(`依赖 ${name} 必须可独立安装，不能使用 workspace/file/link/相对路径：${version}`);
      }
    }
  }

  return { slug, errors };
}

async function main() {
  const paths = process.argv.slice(2);
  let targets;
  if (paths.length) {
    targets = paths.map((item) => path.resolve(item));
  } else {
    const names = (await readdir(examplesDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(examplesDir, entry.name));
    targets = [templateDir, ...names];
  }

  let failures = 0;
  const names = new Set();
  for (const directory of targets) {
    const { slug, errors } = await validateExample(directory);
    if (names.has(slug)) errors.push(`重复 slug：${slug}`);
    names.add(slug);
    if (errors.length) {
      failures++;
      console.error(`FAIL ${directory}`);
      for (const error of errors) console.error(`  - ${error}`);
    } else {
      console.log(`PASS ${directory}`);
    }
  }

  console.log(`检查完成：${targets.length} 个目录，${failures} 个不符合规范。`);
  if (failures) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`校验失败：${error.message}`);
    process.exitCode = 1;
  });
}
