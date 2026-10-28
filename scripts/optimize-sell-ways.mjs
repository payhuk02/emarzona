/**
 * Script d'optimisation et d'intégration des visuels des 5 verticales pour SellWaysSection.
 * Convertit les images sources générées vers les formats WebP 1600x1200 et 960x720.
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/assets/landing');
const backupDir = path.join(outDir, 'backup-sell-ways');

const artifactsDir = 'C:/Users/pc/.gemini/antigravity/brain/aec4ff83-a352-4f9e-bc58-4de5a9c49f09';

const sources = {
  physical: path.join(artifactsDir, 'sell_way_physical_clean_1793184819572.jpg'),
  digital: path.join(artifactsDir, 'sell_way_digital_1793184677760.jpg'),
  service: path.join(artifactsDir, 'sell_way_service_1793184709311.jpg'),
  courses: path.join(artifactsDir, 'sell_way_courses_1793184742656.jpg'),
  artist: path.join(artifactsDir, 'sell_way_artist_1793184781772.jpg'),
};

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log('--- Début de l\'optimisation des visuels des 5 verticales ---');

for (const [key, srcPath] of Object.entries(sources)) {
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Fichier source introuvable: ${srcPath}`);
  }

  const outFull = path.join(outDir, `sell-way-${key}.webp`);
  const outSm = path.join(outDir, `sell-way-${key}-480.webp`);

  // Backup existant si présent
  if (fs.existsSync(outFull)) {
    fs.copyFileSync(outFull, path.join(backupDir, `sell-way-${key}.webp`));
  }
  if (fs.existsSync(outSm)) {
    fs.copyFileSync(outSm, path.join(backupDir, `sell-way-${key}-480.webp`));
  }

  // 1. Version haute définition 1600x1200 (1600w)
  await sharp(srcPath)
    .resize(1600, 1200, {
      fit: 'cover',
      position: 'center',
      kernel: 'lanczos3',
    })
    .sharpen({ sigma: 0.5, m1: 0.5, m2: 0.25 })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(outFull);

  const statFull = fs.statSync(outFull);
  console.log(`[OK] sell-way-${key}.webp (1600x1200) -> ${Math.round(statFull.size / 1024)} KB`);

  // 2. Version responsive 960x720 (960w / 480 sm)
  await sharp(srcPath)
    .resize(960, 720, {
      fit: 'cover',
      position: 'center',
      kernel: 'lanczos3',
    })
    .sharpen({ sigma: 0.4, m1: 0.4, m2: 0.2 })
    .webp({ quality: 85, effort: 6, smartSubsample: true })
    .toFile(outSm);

  const statSm = fs.statSync(outSm);
  console.log(`[OK] sell-way-${key}-480.webp (960x720) -> ${Math.round(statSm.size / 1024)} KB`);
}

console.log('--- Optimisation terminée avec succès ! ---');
