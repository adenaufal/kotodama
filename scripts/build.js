import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Copy manifest and icons to dist
const filesToCopy = [
  { from: 'public/manifest.json', to: 'dist/manifest.json' },
  { from: 'public/icons/icon16.png', to: 'dist/icons/icon16.png' },
  { from: 'public/icons/icon32.png', to: 'dist/icons/icon32.png' },
  { from: 'public/icons/icon48.png', to: 'dist/icons/icon48.png' },
  { from: 'public/icons/icon128.png', to: 'dist/icons/icon128.png' },
];

console.log('Copying static files to dist...');

filesToCopy.forEach(({ from, to }) => {
  const fromPath = join(root, from);
  const toPath = join(root, to);

  // Create directory if it doesn't exist
  const toDir = dirname(toPath);
  if (!existsSync(toDir)) {
    mkdirSync(toDir, { recursive: true });
  }

  copyFileSync(fromPath, toPath);
  console.log(`  ${from} -> ${to}`);
});

console.log('Build preparation complete!');
