import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    outDir: '.vite/build',
    sourcemap: true,
    rollupOptions: {
      input: 'src/main/main.ts',
    },
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@common': path.resolve(__dirname, 'src/common'),
    },
  },
});
