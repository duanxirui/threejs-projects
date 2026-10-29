import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const distRoot = path.join(projectRoot, 'site-dist');
const indexFile = path.join(projectRoot, 'apps', 'gallery', 'src', 'data', 'examples.generated.json');
const base = process.env.SITE_BASE_PATH ?? '/threejs-projects/';

function assertBase(value) {
  if (value === './') return;
  if (!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(value) || value.split('/').includes('..')) {
    throw new Error(`无效 SITE_BASE_PATH：${value}`);
  }
}

function assertPathInsideRoot(relative) {
  const absolute = path.resolve(distRoot, relative);
  const rel = path.relative(distRoot, absolute);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`静态资源指向构建目录之外：${relative}`);
  }
  return absolute;
}

async function requireFile(relative) {
  const filename = assertPathInsideRoot(relative);
  await access(filename);
  if (!(await stat(filename)).isFile()) throw new Error(`预期是文件：${relative}`);
  return filename;
}

async function checkHtml(relative) {
  const filename = await requireFile(relative);
  const html = await readFile(filename, 'utf8');
  const referencePattern = /\b(?:src|href)=["']([^"']+)["']/g;
  let checked = 0;

  for (const [, reference] of html.matchAll(referencePattern)) {
    if (/^(?:https?:|data:|mailto:|tel:|#)/i.test(reference)) continue;
    const plain = reference.split(/[?#]/, 1)[0];
    if (!plain || plain === './') continue;

    let target;
    if (plain.startsWith('/')) {
      if (base === './' || !plain.startsWith(base)) {
        throw new Error(`${relative} 的资源路径不符合 SITE_BASE_PATH：${reference}`);
      }
      target = plain.slice(base.length);
    } else {
      target = path.posix.normalize(path.posix.join(path.posix.dirname(relative), plain));
    }

    await requireFile(target);
    checked++;
  }
  return checked;
}

async function main() {
  assertBase(base);
  const entries = JSON.parse(await readFile(indexFile, 'utf8'));
  if (!Array.isArray(entries)) throw new Error('案例索引不是数组');

  let checked = await checkHtml('index.html');
  for (const entry of entries) {
    if (entry.ready !== true) throw new Error(`案例 ${entry.slug} 尚未标记为构建成功`);
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.slug)) throw new Error(`无效案例名称：${entry.slug}`);
    if (entry.page !== `examples/${entry.slug}/`) throw new Error(`案例 ${entry.slug} 入口路径错误`);
    if (!entry.cover.startsWith(`covers/${entry.slug}/`)) throw new Error(`案例 ${entry.slug} 封面路径错误`);
    await requireFile(entry.cover);
    checked += await checkHtml(`${entry.page}index.html`);
  }

  console.log(`Pages 产物校验通过：首页 1 个，案例 ${entries.length} 个，静态资源引用 ${checked} 个，base=${base}`);
}

main().catch((error) => {
  console.error(`Pages 产物校验失败：${error.message}`);
  process.exitCode = 1;
});
