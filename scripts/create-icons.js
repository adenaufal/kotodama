// Simple script to create placeholder icon files
// In production, these would be proper PNG images

import { writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [16, 32, 48, 128];

const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1d9bf0" rx="${size * 0.2}"/>
  <path d="M${size * 0.5} ${size * 0.2}L${size * 0.6} ${size * 0.4}L${size * 0.8} ${size * 0.5}L${size * 0.6} ${size * 0.6}L${size * 0.5} ${size * 0.8}L${size * 0.4} ${size * 0.6}L${size * 0.2} ${size * 0.5}L${size * 0.4} ${size * 0.4}L${size * 0.5} ${size * 0.2}Z" fill="white"/>
</svg>
`.trim();

sizes.forEach((size) => {
  const svg = createSVGIcon(size);
  writeFileSync(
    join(process.cwd(), 'public', 'icons', `icon${size}.svg`),
    svg
  );
  console.log(`Created icon${size}.svg`);
});

console.log('\nPlaceholder icons created! Convert these SVG files to PNG for production.');
console.log('You can use: https://www.pngtosvg.com/ or ImageMagick');
