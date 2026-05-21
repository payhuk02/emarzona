/**
 * Optimise l'image premium complète pour la section Adapt (sans recadrage).
 * Usage: node scripts/optimize-adapt-entrepreneur.mjs [chemin-source.png]
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const defaultSource = path.join(root, 'src/assets/landing/adapt-premium-source.png');
const source = process.argv[2] ? path.resolve(process.argv[2]) : defaultSource;
const outDir = path.join(root, 'src/assets/landing');
const outWebp = path.join(outDir, 'adapt-entrepreneur.webp');
const outPng = path.join(outDir, 'adapt-entrepreneur.png');
const maxWidth = 1200;

const pipeline = sharp(source).resize(maxWidth, null, {
  withoutEnlargement: true,
  fit: 'inside',
});

await pipeline.clone().webp({ quality: 82, effort: 6 }).toFile(outWebp);

await pipeline
  .clone()
  .png({ compressionLevel: 9, quality: 80, palette: true, effort: 10 })
  .toFile(outPng);

const meta = await sharp(outWebp).metadata();
console.log(`Source: ${source}`);
console.log(`WebP: ${outWebp} (${meta.width}x${meta.height})`);
console.log(`PNG:  ${outPng}`);
