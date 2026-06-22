/**
 * Optimise le visuel hero (recadrage alpha + netteté + WebP responsive).
 * Usage: node scripts/optimize-hero-entrepreneur.mjs [chemin-source.png]
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const defaultSource = path.join(root, 'src/assets/landing/hero-entrepreneur-source.png');
const source = process.argv[2] ? path.resolve(process.argv[2]) : defaultSource;
const outDir = path.join(root, 'src/assets/landing');

async function cropToSubject(input) {
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });
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
  return sharp(source).extract({
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX - minX + 1 + pad * 2),
    height: Math.min(height, maxY - minY + 1 + pad * 2),
  });
}

function premiumPipeline(image, targetHeight) {
  return image
    .clone()
    .resize(null, targetHeight, { fit: 'inside', kernel: 'lanczos3', withoutEnlargement: false })
    .sharpen({ sigma: 0.65, m1: 0.6, m2: 0.35 })
    .modulate({ brightness: 1.03, saturation: 1.05 });
}

const cropped = await cropToSubject(sharp(source));

const variants = [
  { name: 'hero-entrepreneur.webp', height: 720, quality: 90 },
  { name: 'hero-entrepreneur-960.webp', height: 960, quality: 88 },
  { name: 'hero-entrepreneur-480.webp', height: 480, quality: 86 },
];

for (const { name, height, quality } of variants) {
  const outPath = path.join(outDir, name);
  await premiumPipeline(cropped, height)
    .webp({ quality, effort: 6, alphaQuality: 100, smartSubsample: true })
    .toFile(outPath);
  const { size } = await import('fs/promises').then(fs => fs.stat(outPath));
  console.log(`  ${name}: ${Math.round(size / 1024)} KB`);
}

const meta = await sharp(path.join(outDir, 'hero-entrepreneur.webp')).metadata();
console.log(`\nSource: ${source}`);
console.log(`Output: ${meta.width}x${meta.height}, alpha=${meta.hasAlpha}`);
