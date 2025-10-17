import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { parse, resolve } from 'path';

const stripLeadingUnderscore = (value?: string) => {
  if (!value) {
    return '';
  }

  return value.startsWith('_') ? value.slice(1) : value;
};

const parseNameAndExtension = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const { name, ext } = parse(value);
  const sanitizedName = stripLeadingUnderscore(name);

  if (!sanitizedName && !ext) {
    return undefined;
  }

  return { name: sanitizedName || undefined, ext };
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
        settings: resolve(__dirname, 'src/settings/index.html'),
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
        assetFileNames: (assetInfo) => {
          const fromName = parseNameAndExtension(assetInfo.name);
          const fromFileName = parseNameAndExtension(assetInfo.fileName);

          const name = fromName?.name ?? fromFileName?.name ?? 'asset';
          const ext = fromName?.ext ?? fromFileName?.ext ?? '';

          return `${name}${ext}`;
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
