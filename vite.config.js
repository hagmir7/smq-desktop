import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Electron loads dist/index.html directly from disk in production,
// so asset paths must be relative ('./') rather than root-absolute ('/').
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
