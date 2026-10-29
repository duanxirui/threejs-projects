import { defineConfig } from 'vite';

// Relative URLs allow this folder's dist/ to run at the domain root or any subpath.
// Set VITE_BASE_PATH=/threejs-projects/examples/<slug>/ during Pages builds if needed.
const base = process.env.VITE_BASE_PATH || './';

if (base !== './' && (!base.startsWith('/') || !base.endsWith('/'))) {
  throw new Error('VITE_BASE_PATH must be "./" or an absolute path ending in "/".');
}

export default defineConfig({ base });
