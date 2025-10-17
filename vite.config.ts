import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const stripLeadingUnderscore = (value?: string) => {
  if (!value) {
    return '';
  }

  return value.startsWith('_') ? value.slice(1) : value;
};

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'src/panel/index.html'),
        background: resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/content-script.ts'),
        onboarding: resolve(__dirname, 'src/onboarding/index.html'),
      },
      output: {
        entryFileNames: ({ name }) => {
          const sanitizedName = stripLeadingUnderscore(name) || 'entry';
          return `${sanitizedName}.js`;
        },
        chunkFileNames: ({ name }) => {
          const sanitizedName = stripLeadingUnderscore(name) || 'chunk';
          return `${sanitizedName}.js`;
        },
        assetFileNames: ({ name }) => {
          const sanitizedName = stripLeadingUnderscore(name) || '[name]';
          return `${sanitizedName}.[ext]`;
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    restoreMocks: true,
  },
});
