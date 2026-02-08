import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    build: {
        outDir: 'dist',
        emptyOutDir: false, // Keep existing files from main build
        rollupOptions: {
            input: resolve(__dirname, 'src/content/content-script.tsx'),
            output: {
                entryFileNames: 'content.js',
                format: 'iife',
                name: 'KotodamaContent',
                extend: true,
                inlineDynamicImports: true, // Force everything into one file
            },
        },
    },
});
