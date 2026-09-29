import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.js',
      '*.config.js',
      '*.config.cjs',
      '*.config.mjs',
      '*.config.ts',
      'scripts/**'
    ]
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true }
      },
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx}']
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // The existing codebase uses explicit `any` at several browser/API
      // boundaries. Keep those accepted while enabling the other recommended
      // TypeScript checks, including unused-variable and unsafe syntax checks.
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
