import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'src/assets/auth/auth-hero-source.png');
const outDir = path.join(root, 'src/assets/auth');
const widths = [640, 819, 1024, 1280];

const meta = await sharp(src).metadata();
console.log('source', meta.width, 'x', meta.height);

const processImage = (w) =>
  sharp(src)
    .resize(w, null, {
      fit: 'inside',
      withoutEnlargement: w <= (meta.width ?? w),
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 1, m1: 0.55, m2: 0.32 })
    .webp({ quality: 92, effort: 6, smartSubsample: true });

for (const w of widths) {
  const out = path.join(outDir, `auth-hero-${w}w.webp`);
  await processImage(w).toFile(out);
  const stat = fs.statSync(out);
  console.log('wrote', path.basename(out), `${Math.round(stat.size / 1024)}kb`);
}

await processImage(1024).toFile(path.join(outDir, 'auth-hero.webp'));
console.log('default auth-hero.webp (1024w upscale)');
