import { createServer } from 'vite';
import { createServer as createNetServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateGallery } from '../../scripts/generate-gallery.mjs';

const galleryRoot = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = path.resolve(galleryRoot, '../..');
const runningServers = [];

function galleryPort() {
  const args = process.argv.slice(2);
  const index = args.findIndex((arg) => arg === '--port' || arg.startsWith('--port='));
  if (index === -1) return 5173;
  const value = args[index] === '--port' ? args[index + 1] : args[index].split('=')[1];
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('本地展示首页端口必须为 1～65535 的整数');
  }
  return port;
}

async function closeServers() {
  const results = await Promise.allSettled(runningServers.reverse().map((server) => server.close()));
  for (const result of results) {
    if (result.status === 'rejected') console.error('关闭本地开发服务失败：', result.reason);
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      probe.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

async function listenCase(slug) {
  const directory = path.join(projectRoot, 'examples', slug);
  // A free loopback port per case, preserving each case's source and config.
  const port = await freePort();
  const server = await createServer({
    root: directory,
    configFile: path.join(directory, 'vite.config.js'),
    base: '/',
    clearScreen: false,
    server: { host: '127.0.0.1', port, strictPort: true, open: false },
  });
  runningServers.push(server);
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('案例 ' + slug + ' 未获取到本地端口');
  return 'http://127.0.0.1:' + address.port + '/';
}

async function main() {
  delete process.env.GALLERY_BUILDABLE_SLUGS;
  delete process.env.GALLERY_DEV_PREVIEW_URLS;

  const cases = await generateGallery({ previewUrls: {} });
  const previewUrls = {};
  for (const item of cases) {
    previewUrls[item.slug] = await listenCase(item.slug);
  }

  // Metadata watcher reads this mapping during development regeneration.
  process.env.GALLERY_DEV_PREVIEW_URLS = JSON.stringify(previewUrls);
  await generateGallery({ previewUrls });

  const port = galleryPort();
  const server = await createServer({
    root: galleryRoot,
    configFile: path.join(galleryRoot, 'vite.config.js'),
    base: '/',
    clearScreen: false,
    server: { host: '127.0.0.1', port, strictPort: false, open: false },
  });
  runningServers.push(server);
  await server.listen();

  const urls = server.resolvedUrls?.local || [];
  console.log('\nThree.js 案例集合本地开发服务已启动');
  console.log('展示首页：' + (urls[0] || 'http://127.0.0.1:' + port + '/'));
  for (const [slug, url] of Object.entries(previewUrls)) {
    console.log('  ' + slug + '：' + url);
  }
  console.log('点击首页案例卡片的“进入场景”即可直接打开本机 Three.js 场景。');
  console.log('新增或重新公开案例后，重启 gallery:dev 以启动对应服务。\n');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    closeServers().finally(() => process.exit(0));
  });
}

main().catch(async (error) => {
  console.error('本地案例集合启动失败：' + error.message);
  await closeServers();
  process.exitCode = 1;
});
