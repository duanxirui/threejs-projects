import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateGallery } from '../../scripts/generate-gallery.mjs';

const galleryDirectory = fileURLToPath(new URL('.', import.meta.url));
const examplesDirectory = path.resolve(galleryDirectory, '../../examples');

const base = process.env.VITE_BASE_PATH || './';
if (base !== './' && (!base.startsWith('/') || !base.endsWith('/'))) {
  throw new Error('VITE_BASE_PATH must be "./" or an absolute path ending in "/".');
}

function watchExampleMetadata() {
  let updating = Promise.resolve();
  return {
    name: 'watch-gallery-metadata',
    configureServer(server) {
      server.watcher.add(examplesDirectory);
      server.watcher.on('all', (_event, changedPath) => {
        if (!changedPath.startsWith(examplesDirectory + path.sep)) return;
        if (!/example\.json$|[\\/]public[\\/]/i.test(changedPath)) return;
        updating = updating
          .catch(() => {})
          .then(() => generateGallery())
          .catch((error) => server.config.logger.error(error.message));
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), watchExampleMetadata()],
  base,
  publicDir: path.join(galleryDirectory, '.generated', 'public'),
  server: { strictPort: true },
});
