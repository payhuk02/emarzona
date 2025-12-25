/**
 * Script d'optimisation des images
 * Convertit les images JPG/PNG en WebP/AVIF et génère des versions responsives
 * 
 * Usage: node scripts/optimize-images.js
 * Prérequis: sharp doit être installé (npm install sharp --save-dev)
 */

import { readdir, stat, mkdir } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { existsSync } from 'fs';

// Vérifier si sharp est disponible
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (error) {
  console.error('❌ Erreur: sharp n\'est pas installé.');
  console.error('   Installez-le avec: npm install sharp --save-dev');
  process.exit(1);
}

const ASSETS_DIR = join(process.cwd(), 'src/assets');
const PUBLIC_DIR = join(process.cwd(), 'public');
const OUTPUT_DIR = join(process.cwd(), 'src/assets/optimized');

// Tailles responsives à générer
const RESPONSIVE_SIZES = [320, 640, 768, 1024, 1280, 1920];

/**
 * Formate la taille en bytes vers un format lisible
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Optimise une image en WebP
 */
async function optimizeToWebP(inputPath, outputPath, width, quality = 85) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Calculer la largeur si nécessaire
  const targetWidth = width || metadata.width;
  const targetHeight = width 
    ? Math.round((metadata.height / metadata.width) * width)
    : metadata.height;

  await image
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toFile(outputPath);

  const stats = await stat(outputPath);
  return stats.size;
}

/**
 * Optimise une image en AVIF (meilleure compression mais moins supporté)
 */
async function optimizeToAVIF(inputPath, outputPath, width, quality = 80) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  const targetWidth = width || metadata.width;
  const targetHeight = width 
    ? Math.round((metadata.height / metadata.width) * width)
    : metadata.height;

  await image
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .avif({ quality })
    .toFile(outputPath);

  const stats = await stat(outputPath);
  return stats.size;
}

/**
 * Optimise une image et génère toutes les versions
 */
async function optimizeImage(inputPath) {
  const ext = extname(inputPath).toLowerCase();
  const baseName = basename(inputPath, ext);
  const dir = dirname(inputPath);
  
  // Normaliser le chemin pour Windows et Unix
  const normalizedPath = inputPath.replace(/\\/g, '/');
  const normalizedDir = dir.replace(/\\/g, '/');

  // Ignorer les fichiers déjà optimisés
  if (inputPath.includes('/optimized/')) {
    return;
  }

  // Ignorer les fichiers non-images
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    return;
  }

  console.log(`\n📸 Optimisation de: ${basename(inputPath)}`);

  // Créer le répertoire de sortie
  // Pour src/assets/, créer directement dans OUTPUT_DIR sans sous-répertoire
  let outputBaseDir = OUTPUT_DIR;
  if (normalizedDir.includes('/assets/')) {
    // Si dans src/assets/, garder OUTPUT_DIR directement
    outputBaseDir = OUTPUT_DIR;
  } else if (normalizedDir.includes('public')) {
    // Si dans public/, créer un sous-répertoire public
    outputBaseDir = join(OUTPUT_DIR, 'public');
  }
  
  if (!existsSync(outputBaseDir)) {
    await mkdir(outputBaseDir, { recursive: true });
  }

  const originalStats = await stat(inputPath);
  const originalSize = originalStats.size;
  console.log(`   Taille originale: ${formatSize(originalSize)}`);

  const results = {
    original: originalSize,
    webp: {},
    avif: {},
    responsive: {},
  };

  // Générer la version WebP originale
  const webpPath = join(outputBaseDir, `${baseName}.webp`);
  const webpSize = await optimizeToWebP(inputPath, webpPath);
  results.webp.original = webpSize;
  console.log(`   ✅ WebP: ${formatSize(webpSize)} (${((1 - webpSize / originalSize) * 100).toFixed(1)}% de réduction)`);

  // Générer la version AVIF originale
  const avifPath = join(outputBaseDir, `${baseName}.avif`);
  const avifSize = await optimizeToAVIF(inputPath, avifPath);
  results.avif.original = avifSize;
  console.log(`   ✅ AVIF: ${formatSize(avifSize)} (${((1 - avifSize / originalSize) * 100).toFixed(1)}% de réduction)`);

  // Générer les versions responsives WebP
  console.log(`   📱 Génération des versions responsives WebP...`);
  for (const width of RESPONSIVE_SIZES) {
    const responsivePath = join(outputBaseDir, `${baseName}-${width}w.webp`);
    const responsiveSize = await optimizeToWebP(inputPath, responsivePath, width, 85);
    results.webp[width] = responsiveSize;
    results.responsive[`${width}w`] = responsiveSize;
  }

  // Générer les versions responsives AVIF
  console.log(`   📱 Génération des versions responsives AVIF...`);
  for (const width of RESPONSIVE_SIZES) {
    const responsivePath = join(outputBaseDir, `${baseName}-${width}w.avif`);
    const responsiveSize = await optimizeToAVIF(inputPath, responsivePath, width, 80);
    results.avif[width] = responsiveSize;
  }

  // Calculer les économies totales
  const totalOptimized = webpSize + avifSize;
  const totalResponsive = Object.values(results.responsive).reduce((sum, size) => sum + size, 0);
  const totalSavings = originalSize - webpSize;

  console.log(`   💾 Économie totale: ${formatSize(totalSavings)} (${((totalSavings / originalSize) * 100).toFixed(1)}%)`);

  return results;
}

/**
 * Traite tous les fichiers d'un répertoire
 */
async function processDirectory(dir) {
  if (!existsSync(dir)) {
    console.warn(`⚠️  Répertoire non trouvé: ${dir}`);
    return;
  }

  const files = await readdir(dir);
  const imageFiles = files.filter(file => {
    const ext = extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log(`\n📁 Aucune image trouvée dans: ${dir}`);
    return;
  }

  console.log(`\n📁 Traitement de ${imageFiles.length} image(s) dans: ${dir}`);

  const results = [];
  for (const file of imageFiles) {
    const filePath = join(dir, file);
    try {
      const result = await optimizeImage(filePath);
      if (result) {
        results.push({ file, ...result });
      }
    } catch (error) {
      console.error(`   ❌ Erreur lors du traitement de ${file}:`, error.message);
    }
  }

  return results;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 OPTIMISATION DES IMAGES\n');
  console.log('═'.repeat(60));

  // Créer le répertoire de sortie
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Répertoire de sortie créé: ${OUTPUT_DIR}`);
  }

  const allResults = [];

  // Traiter les assets dans src/assets
  const assetsResults = await processDirectory(ASSETS_DIR);
  if (assetsResults) {
    allResults.push(...assetsResults);
  }

  // Traiter les assets dans public (sauf le logo qui sera converti manuellement en SVG)
  const publicImageFiles = (await readdir(PUBLIC_DIR)).filter(file => {
    const ext = extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext) && !file.includes('logo');
  });

  if (publicImageFiles.length > 0) {
    console.log(`\n📁 Traitement de ${publicImageFiles.length} image(s) dans: public`);
    for (const file of publicImageFiles) {
      const filePath = join(PUBLIC_DIR, file);
      try {
        const result = await optimizeImage(filePath);
        if (result) {
          allResults.push({ file, ...result });
        }
      } catch (error) {
        console.error(`   ❌ Erreur lors du traitement de ${file}:`, error.message);
      }
    }
  }

  // Résumé
  if (allResults.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ\n');

    let totalOriginal = 0;
    let totalWebP = 0;
    let totalSavings = 0;

    allResults.forEach(({ file, original, webp }) => {
      totalOriginal += original;
      totalWebP += webp.original;
      totalSavings += (original - webp.original);
    });

    console.log(`Total images traitées: ${allResults.length}`);
    console.log(`Taille originale totale: ${formatSize(totalOriginal)}`);
    console.log(`Taille WebP totale: ${formatSize(totalWebP)}`);
    console.log(`Économie totale: ${formatSize(totalSavings)} (${((totalSavings / totalOriginal) * 100).toFixed(1)}%)`);

    console.log('\n✅ Optimisation terminée!');
    console.log(`\n📝 Les images optimisées sont dans: ${OUTPUT_DIR}`);
    console.log('   Utilisez ces images dans vos composants pour améliorer les performances.');
  } else {
    console.log('\n⚠️  Aucune image à optimiser trouvée.');
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});

