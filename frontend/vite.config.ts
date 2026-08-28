import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  plugins: [svelte()],
  resolve: {
    conditions: ['browser']
  },
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true,
    target: 'es2022'
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:8080', '/health': 'http://localhost:8080' }
  },
  test: {
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, 'src/test-setup.ts')],
    include: [resolve(__dirname, 'src/**/*.test.ts')]
  }
});
