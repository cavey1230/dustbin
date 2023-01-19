import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslintPlugin from 'vite-plugin-eslint';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      components: path.resolve(__dirname, 'src/components'),
      config: path.resolve(__dirname, 'src/config'),
      styles: path.resolve(__dirname, 'src/styles'),
      public: path.resolve(__dirname, 'public'),
      pages: path.resolve(__dirname, 'src/pages'),
      utils: path.resolve(__dirname, 'src/utils'),
      apis: path.resolve(__dirname, 'src/apis'),
    },
  },
  plugins: [
    react(),
    eslintPlugin({
      include: [
        'src/**/*.js',
        'src/**/*.ts',
        'src/**/*.tsx',
        'src/*.js',
        'src/*.ts',
        'src/*.tsx',
      ],
    }),
  ],
  server: {
    port: 8801,
  },
  preview: {
    port: 8801,
  },
});
