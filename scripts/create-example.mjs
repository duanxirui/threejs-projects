import { access, cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const template = path.join(root, 'templates', 'threejs-basic');
const examples = path.join(root, 'examples');
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function usage() {
  console.log('用法：npm run example:create -- <slug> "案例名称"');
  console.log('示例：npm run example:create -- orbit-lab "轨道实验室"');
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function main() {
  const [slug, ...titleParts] = process.argv.slice(2);

  if (!slug || slug === '--help' || slug === '-h') {
    usage();
    if (!slug) process.exitCode = 1;
    return;
  }

  const title = titleParts.join(' ').trim();
  if (!slugPattern.test(slug) || !title) {
    throw new Error('案例 slug 需为小写英文短横线格式，且必须提供案例名称。');
  }

  const destination = path.join(examples, slug);
  if (await exists(destination)) {
    throw new Error(`案例目录已存在，未修改任何文件：${destination}`);
  }

  await cp(template, destination, {
    recursive: true,
    force: false,
    errorOnExist: true,
    filter(source) {
      return !['node_modules', 'dist', '.vite'].includes(path.basename(source));
    },
  });

  const metadataFile = path.join(destination, 'example.json');
  const metadata = JSON.parse(await readFile(metadataFile, 'utf8'));
  metadata.slug = slug;
  metadata.name = title;
  metadata.description = `${title}：请完善案例介绍。`;
  metadata.category = '待分类';
  metadata.tags = ['Three.js'];
  metadata.visible = false;
  await writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

  const packageFile = path.join(destination, 'package.json');
  const packageData = JSON.parse(await readFile(packageFile, 'utf8'));
  packageData.name = slug;
  packageData.description = title;
  await writeFile(packageFile, `${JSON.stringify(packageData, null, 2)}\n`, 'utf8');

  // When a template lockfile exists, keep its project name consistent in the copy.
  const lockFile = path.join(destination, 'package-lock.json');
  if (await exists(lockFile)) {
    const lock = JSON.parse(await readFile(lockFile, 'utf8'));
    lock.name = slug;
    if (lock.packages?.['']) lock.packages[''].name = slug;
    await writeFile(lockFile, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  }

  const readmeFile = path.join(destination, 'README.md');
  const readme = await readFile(readmeFile, 'utf8');
  await writeFile(readmeFile, readme.replace(/^# .+$/m, `# ${title}`), 'utf8');

  const indexFile = path.join(destination, 'index.html');
  const index = await readFile(indexFile, 'utf8');
  await writeFile(indexFile, index.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`), 'utf8');

  console.log(`案例已创建：${destination}`);
  console.log('接下来：修改场景与 example.json，再在案例目录执行 npm install 和 npm run dev。');
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

main().catch((error) => {
  console.error(`创建案例失败：${error.message}`);
  process.exitCode = 1;
});
