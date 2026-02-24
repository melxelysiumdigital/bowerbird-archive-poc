import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    outDir: resolve(__dirname, 'theme/assets'),
    emptyOutDir: false,
    watch: process.argv.includes('--watch')
      ? { exclude: resolve(__dirname, 'theme/assets/**') }
      : null,
    rollupOptions: {
      input: {
        theme: resolve(__dirname, 'src/entries/theme.ts'),
        react: resolve(__dirname, 'src/entries/react.tsx'),
      },
      output: {
        entryFileNames: '[name].bundle.js',
        chunkFileNames: '[name].chunk.js',
        assetFileNames: '[name].min[extname]',
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
  },
});
