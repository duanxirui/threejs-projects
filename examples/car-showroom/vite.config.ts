import { defineConfig } from 'vite';

export default defineConfig({
  // Standalone builds use relative resources; collection builds supply the
  // GitHub Pages case prefix via VITE_BASE_PATH.
  base: process.env.VITE_BASE_PATH || './',
  build: {
    rollupOptions: {
      output: {
        // Keep the heavy Three.js engine separate from the small application
        // UI, and allow the browser to cache core code across future updates.
        manualChunks(id) {
          const path = id.replaceAll('\\', '/');
          if (path.includes('/node_modules/three/examples/jsm/loaders/GLTFLoader.js')) {
            return 'three-gltf';
          }
          if (path.includes('/node_modules/three/examples/jsm/')) {
            return 'three-addons';
          }
          if (path.includes('/node_modules/three/')) {
            return 'three-core';
          }
          return undefined;
        },
      },
    },
  },
});
