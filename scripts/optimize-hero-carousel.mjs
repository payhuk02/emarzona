/**
 * Optimise les visuels du carrousel hero (WebP responsive).
 * Usage: node scripts/optimize-hero-carousel.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/assets/landing');

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

function buildAlphaMask(width, height) {
  const buf = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    const fyTop = Math.min(1, Math.max(0, y / height / 0.1));
    const fyBottom = Math.min(1, Math.max(0, (1 - y / height) / 0.18));
    for (let x = 0; x < width; x++) {
      const fxLeft = Math.min(1, Math.max(0, x / width / 0.2));
      const fxRight = Math.min(1, Math.max(0, (1 - x / width) / 0.12));
      buf[y * width + x] = Math.round(Math.min(fxLeft, fyBottom, fyTop, fxRight) * 255);
    }
  }
  return buf;
}

async function exportEntrepreneur(height, quality, filename) {
  const sourcePath = path.join(outDir, 'hero-entrepreneur-source.png');
  const cropped = await cropEntrepreneur(sourcePath);
  const { data: rgb, info } = await cropped
    .resize(null, height, { fit: 'inside', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6, m1: 0.55, m2: 0.32 })
    .modulate({ brightness: 1.03, saturation: 1.05 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height: h } = info;
  const alpha = buildAlphaMask(width, h);
  const outPath = path.join(outDir, filename);

  await sharp(rgb, { raw: { width, height: h, channels: 3 } })
    .joinChannel(alpha, { raw: { width, height: h, channels: 1 } })
    .webp({ quality, effort: 6, alphaQuality: 100 })
    .toFile(outPath);

  const { size } = await import('fs/promises').then(fs => fs.stat(outPath));
  console.log(`  ${filename}: ${Math.round(size / 1024)} KB`);
}

async function exportBanner(key, width, quality, filename) {
  const sourcePath = path.join(outDir, `hero-carousel-${key}-source.png`);
  const outPath = path.join(outDir, filename);

  await sharp(sourcePath)
    .resize(width, null, { withoutEnlargement: true, fit: 'inside', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.45, m1: 0.5, m2: 0.28 })
    .modulate({ brightness: 1.02, saturation: 1.04 })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(outPath);

  const { size } = await import('fs/promises').then(fs => fs.stat(outPath));
  console.log(`  ${filename}: ${Math.round(size / 1024)} KB`);
}

console.log('Entrepreneur:');
await exportEntrepreneur(720, 90, 'hero-carousel-entrepreneur.webp');
await exportEntrepreneur(480, 86, 'hero-carousel-entrepreneur-480.webp');

console.log('\nBannières:');
for (const key of bannerSlides) {
  await exportBanner(key, 800, 84, `hero-carousel-${key}.webp`);
  await exportBanner(key, 520, 82, `hero-carousel-${key}-480.webp`);
}

console.log('\nDone.');
