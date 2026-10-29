import { spawn } from 'node:child_process';
import { cp, lstat, mkdir, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateExample } from './validate-examples.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const examplesRoot = path.join(projectRoot, 'examples');
const galleryRoot = path.join(projectRoot, 'apps', 'gallery');
const output = path.join(projectRoot, 'site-dist');
const staging = path.join(projectRoot, 'site-dist.__next');
const backup = path.join(projectRoot, 'site-dist.__previous');
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function resolveBase() {
  const base = process.env.SITE_BASE_PATH ?? '/threejs-projects/';
  if (base === './') return base;
  if (!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(base) || base.split('/').includes('..')) {
    throw new Error('SITE_BASE_PATH 必须为 ./ 或以 / 开头、以 / 结尾的安全站点路径，例如 /threejs-projects/。');
  }
  return base;
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// All recursive removals in this script target only these named generated folders.
async function assertGeneratedDirectory(directory, name) {
  if (path.resolve(directory) !== path.join(path.resolve(projectRoot), name)) {
    throw new Error(`拒绝操作不属于项目生成目录的路径：${directory}`);
  }
  if (await exists(directory)) {
    const entry = await lstat(directory);
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`生成目录已被文件或链接占用：${directory}`);
    }
  }
}

function npmBuild(cwd, env) {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'cmd.exe' : 'npm';
    const args = isWindows ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build'];
    const child = spawn(command, args, { cwd, env, stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.relative(projectRoot, cwd)} 构建失败（退出码 ${code ?? '未知'}，信号 ${signal ?? '无'}）`));
    });
  });
}

async function collectPublicExamples() {
  const names = (await readdir(examplesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
  const published = [];

  for (const slug of names) {
    if (!slugPattern.test(slug)) throw new Error(`案例目录名不符合规范：${slug}`);
    const directory = path.join(examplesRoot, slug);
    let metadata;
    try {
      metadata = JSON.parse(await readFile(path.join(directory, 'example.json'), 'utf8'));
    } catch (error) {
      throw new Error(`无法读取案例 ${slug} 的元数据：${error.message}`);
    }
    if (typeof metadata.visible !== 'boolean') throw new Error(`案例 ${slug} 的 visible 必须为布尔值`);
    if (!metadata.visible) {
      console.log(`跳过未公开案例：${slug}`);
      continue;
    }
    const { errors } = await validateExample(directory);
    if (errors.length) throw new Error(`案例 ${slug} 校验失败：\n${errors.map((error) => `  - ${error}`).join('\n')}`);
    published.push(slug);
  }
  return published;
}

async function assertBuiltHtml(directory, label) {
  const index = path.join(directory, 'index.html');
  if (!(await exists(index)) || !(await stat(index)).isFile()) {
    throw new Error(`${label} 缺少构建产物 index.html`);
  }
}

async function commitOutput() {
  await assertGeneratedDirectory(output, 'site-dist');
  await assertGeneratedDirectory(staging, 'site-dist.__next');
  await assertGeneratedDirectory(backup, 'site-dist.__previous');
  if (await exists(backup)) {
    throw new Error(`发现上次发布留下的备份目录，请人工检查后处理：${backup}`);
  }

  const hadPrevious = await exists(output);
  if (hadPrevious) await rename(output, backup);

  try {
    await rename(staging, output);
  } catch (error) {
    if (hadPrevious) await rename(backup, output);
    throw error;
  }

  if (hadPrevious) await rm(backup, { recursive: true });
}

async function buildSite() {
  const base = resolveBase();
  await assertGeneratedDirectory(output, 'site-dist');
  await assertGeneratedDirectory(staging, 'site-dist.__next');
  await assertGeneratedDirectory(backup, 'site-dist.__previous');
  if (await exists(staging) || await exists(backup)) {
    throw new Error('检测到遗留的 site-dist.__next 或 site-dist.__previous；请先检查它们再运行构建。');
  }

  const published = await collectPublicExamples();
  console.log(`准备构建：${published.length} 个公开案例；站点基础路径 ${base}`);

  await mkdir(staging, { recursive: false });
  try {
    for (const slug of published) {
      const caseDirectory = path.join(examplesRoot, slug);
      const caseBase = base === './' ? './' : `${base}examples/${slug}/`;
      console.log(`\n构建案例：${slug}（base=${caseBase}）`);
      await npmBuild(caseDirectory, { ...process.env, VITE_BASE_PATH: caseBase });
      const caseDist = path.join(caseDirectory, 'dist');
      await assertBuiltHtml(caseDist, `案例 ${slug}`);
      await cp(caseDist, path.join(staging, 'examples', slug), { recursive: true });
    }

    // The gallery prebuild hook regenerates the index and copies only the covers
    // of examples that have successfully built in the current run.
    console.log('\n构建展示首页...');
    await npmBuild(galleryRoot, {
      ...process.env,
      VITE_BASE_PATH: base,
      GALLERY_BUILDABLE_SLUGS: published.join(','),
    });
    const galleryDist = path.join(galleryRoot, 'dist');
    await assertBuiltHtml(galleryDist, '展示首页');
    await cp(galleryDist, staging, { recursive: true, force: true });

    const indexPath = path.join(galleryRoot, 'src', 'data', 'examples.generated.json');
    const index = JSON.parse(await readFile(indexPath, 'utf8'));
    if (index.length !== published.length || index.some((entry) => !published.includes(entry.slug) || entry.ready !== true)) {
      throw new Error('展示首页索引与本轮成功构建案例清单不一致');
    }
    for (const entry of index) {
      await assertBuiltHtml(path.join(staging, 'examples', entry.slug), `页面 ${entry.slug}`);
      const cover = path.join(staging, ...entry.cover.split('/'));
      if (!(await exists(cover)) || !(await stat(cover)).isFile()) {
        throw new Error(`案例 ${entry.slug} 的封面未装配到站点：${entry.cover}`);
      }
    }

    await commitOutput();
    console.log(`\n统一构建完成：${output}`);
    console.log(`首页 1 个；公开案例 ${published.length} 个；基础路径 ${base}`);
  } finally {
    if (await exists(staging)) {
      await assertGeneratedDirectory(staging, 'site-dist.__next');
      await rm(staging, { recursive: true });
    }
  }
}

buildSite().catch((error) => {
  console.error(`统一构建失败：${error.message}`);
  process.exitCode = 1;
});
