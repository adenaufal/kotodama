import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Copy manifest and icons to dist
const filesToCopy = [
  { from: 'public/manifest.json', to: 'dist/manifest.json' },
  { from: 'public/browserconfig.xml', to: 'dist/browserconfig.xml' },
  { from: 'public/site.webmanifest', to: 'dist/site.webmanifest' },
  { from: 'public/icons/icon16.png', to: 'dist/icons/icon16.png' },
  { from: 'public/icons/icon32.png', to: 'dist/icons/icon32.png' },
  { from: 'public/icons/icon48.png', to: 'dist/icons/icon48.png' },
  { from: 'public/icons/icon72.png', to: 'dist/icons/icon72.png' },
  { from: 'public/icons/icon96.png', to: 'dist/icons/icon96.png' },
  { from: 'public/icons/icon128.png', to: 'dist/icons/icon128.png' },
  { from: 'public/icons/icon144.png', to: 'dist/icons/icon144.png' },
  { from: 'public/icons/icon192.png', to: 'dist/icons/icon192.png' },
  { from: 'public/icons/android-icon-36x36.png', to: 'dist/icons/android-icon-36x36.png' },
  { from: 'public/icons/ms-icon-70x70.png', to: 'dist/icons/ms-icon-70x70.png' },
  { from: 'public/icons/ms-icon-150x150.png', to: 'dist/icons/ms-icon-150x150.png' },
  { from: 'public/icons/ms-icon-310x310.png', to: 'dist/icons/ms-icon-310x310.png' },
];

console.log('Copying static files to dist...');

filesToCopy.forEach(({ from, to }) => {
  const fromPath = join(root, from);
  const toPath = join(root, to);

  if (!existsSync(fromPath)) {
    console.warn(`  Warning: ${from} does not exist, skipping...`);
    return;
  }

  // Create directory if it doesn't exist
  const toDir = dirname(toPath);
  if (!existsSync(toDir)) {
    mkdirSync(toDir, { recursive: true });
  }

  copyFileSync(fromPath, toPath);
  console.log(`  ${from} -> ${to}`);
});

console.log('Build preparation complete!');
