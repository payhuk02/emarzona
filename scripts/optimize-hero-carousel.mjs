/**
 * Optimise les visuels du carrousel hero (format paysage uniforme, sans recadrage).
 * Usage: node scripts/optimize-hero-carousel.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/assets/landing');

const SLIDE_WIDTH = 640;
const SLIDE_HEIGHT = Math.round((SLIDE_WIDTH * 561) / 1024);
const SLIDE_WIDTH_SM = 480;
const SLIDE_HEIGHT_SM = Math.round((SLIDE_WIDTH_SM * 561) / 1024);
const CARD_BG = { r: 250, g: 250, b: 249 };
const bannerSlides = ['physical', 'digital', 'service', 'courses', 'artist'];

async function cropEntrepreneur(sourcePath) {
  const { data, info } = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 24) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const pad = 10;
  return sharp(sourcePath).extract({
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX - minX + 1 + pad * 2),
    height: Math.min(height, maxY - minY + 1 + pad * 2),
  });
}

function sharpen(image) {
  return image
    .sharpen({ sigma: 0.65, m1: 0.62, m2: 0.36 })
    .modulate({ brightness: 1.02, saturation: 1.05 });
}

async function exportEntrepreneur(width, height, quality, filename) {
  const sourcePath = path.join(outDir, 'hero-entrepreneur-source.png');
  const cropped = await cropEntrepreneur(sourcePath);
  const outPath = path.join(outDir, filename);

  await sharpen(
    cropped.resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    })
  )
    .webp({ quality, effort: 6, alphaQuality: 100, smartSubsample: true })
    .toFile(outPath);

  const { size } = await import('fs/promises').then(fs => fs.stat(outPath));
  const meta = await sharp(outPath).metadata();
  console.log(`  ${filename}: ${Math.round(size / 1024)} KB (${meta.width}x${meta.height})`);
}

async function exportBanner(key, width, height, quality, filename) {
  const sourcePath = path.join(outDir, `hero-carousel-${key}-source.png`);
  const outPath = path.join(outDir, filename);

  await sharpen(
    sharp(sourcePath).resize(width, height, {
      fit: 'contain',
      background: CARD_BG,
      kernel: 'lanczos3',
    })
  )
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(outPath);

  const { size } = await import('fs/promises').then(fs => fs.stat(outPath));
  console.log(`  ${filename}: ${Math.round(size / 1024)} KB (${width}x${height})`);
}

console.log(`Format uniforme: ${SLIDE_WIDTH}x${SLIDE_HEIGHT}\nEntrepreneur:`);
await exportEntrepreneur(SLIDE_WIDTH, SLIDE_HEIGHT, 92, 'hero-carousel-entrepreneur.webp');
await exportEntrepreneur(SLIDE_WIDTH_SM, SLIDE_HEIGHT_SM, 88, 'hero-carousel-entrepreneur-480.webp');

console.log('\nBannières:');
for (const key of bannerSlides) {
  await exportBanner(key, SLIDE_WIDTH, SLIDE_HEIGHT, 90, `hero-carousel-${key}.webp`);
  await exportBanner(key, SLIDE_WIDTH_SM, SLIDE_HEIGHT_SM, 86, `hero-carousel-${key}-480.webp`);
}

console.log('\nDone.');
