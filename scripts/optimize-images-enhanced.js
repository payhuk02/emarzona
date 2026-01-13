#!/usr/bin/env node

/**
 * Script d'optimisation d'images amélioré
 * Convertit les images en WebP/AVIF et optimise leur taille
 * 
 * Usage: node scripts/optimize-images-enhanced.js [options]
 * 
 * Options:
 *   --format=webp|avif|both  Format de sortie (défaut: both)
 *   --quality=0-100          Qualité de compression (défaut: 80)
 *   --input=path             Dossier d'entrée (défaut: public/)
 *   --output=path            Dossier de sortie (défaut: public/optimized/)
 *   --lazy                   Générer aussi les versions lazy loading
 */

import { readdir, stat, mkdir, copyFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

const DEFAULT_OPTIONS = {
  format: 'both', // 'webp', 'avif', 'both'
  quality: 80,
  input: 'public',
  output: 'public/optimized',
  lazy: true,
};

// Formats d'images supportés
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const OUTPUT_FORMATS = {
  webp: { ext: '.webp', mime: 'image/webp' },
  avif: { ext: '.avif', mime: 'image/avif' },
};

/**
 * Parser les arguments de ligne de commande
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

  args.forEach(arg => {
    if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg.startsWith('--quality=')) {
      options.quality = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--input=')) {
      options.input = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg === '--lazy') {
      options.lazy = true;
    }
  });

  return options;
}

/**
 * Vérifier si sharp est installé
 */
async function checkSharp() {
  try {
    await import('sharp');
    return true;
  } catch (error) {
    console.error('❌ Erreur: sharp n\'est pas installé.');
    console.error('   Installez-le avec: npm install -D sharp');
    return false;
  }
}

/**
 * Obtenir toutes les images dans un dossier (récursif)
 */
async function getImages(dir, images = []) {
  if (!existsSync(dir)) {
    return images;
  }

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await getImages(fullPath, images);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        images.push(fullPath);
      }
    }
  }

  return images;
}

/**
 * Optimiser une image
 */
async function optimizeImage(inputPath, outputPath, format, quality) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let output;

    if (format === 'webp') {
      output = image.webp({ quality, effort: 6 });
    } else if (format === 'avif') {
      output = image.avif({ quality, effort: 4 });
    } else {
      throw new Error(`Format non supporté: ${format}`);
    }

    await output.toFile(outputPath);

    const stats = await stat(outputPath);
    const originalStats = await stat(inputPath);
    const reduction = ((1 - stats.size / originalStats.size) * 100).toFixed(1);

    return {
      success: true,
      originalSize: originalStats.size,
      optimizedSize: stats.size,
      reduction: `${reduction}%`,
      format,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Générer le code pour lazy loading
 */
function generateLazyLoadingCode(originalPath, optimizedPaths) {
  const relativePath = originalPath.replace(/^public\//, '/');
  
  const code = `
// Image optimisée: ${basename(originalPath)}
// Formats disponibles: ${Object.keys(optimizedPaths).join(', ')}
<img
  src="${relativePath}"
  srcset="${Object.entries(optimizedPaths)
    .map(([format, path]) => `${path.replace(/^public\//, '/')} ${format === 'avif' ? 'type="image/avif"' : 'type="image/webp"'}`)
    .join(', ')}"
  loading="lazy"
  decoding="async"
  alt=""
/>
`;

  return code;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Démarrage de l\'optimisation d\'images...\n');

  // Vérifier sharp
  if (!(await checkSharp())) {
    process.exit(1);
  }

  const options = parseArgs();
  console.log('📋 Options:', options);
  console.log('');

  // Créer le dossier de sortie
  if (!existsSync(options.output)) {
    await mkdir(options.output, { recursive: true });
  }

  // Obtenir toutes les images
  console.log(`📂 Recherche d'images dans ${options.input}...`);
  const images = await getImages(options.input);
  console.log(`✅ ${images.length} image(s) trouvée(s)\n`);

  if (images.length === 0) {
    console.log('⚠️  Aucune image à optimiser.');
    return;
  }

  // Statistiques
  const stats = {
    total: images.length,
    success: 0,
    failed: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
  };

  // Optimiser chaque image
  for (const imagePath of images) {
    const relativePath = imagePath.replace(options.input + '/', '');
    const baseName = basename(imagePath, extname(imagePath));
    const outputDir = join(options.output, dirname(relativePath));

    // Créer le dossier de sortie si nécessaire
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    console.log(`🖼️  Optimisation: ${relativePath}`);

    const formats = options.format === 'both' ? ['webp', 'avif'] : [options.format];
    const optimizedPaths = {};

    for (const format of formats) {
      const outputPath = join(outputDir, `${baseName}${OUTPUT_FORMATS[format].ext}`);
      
      const result = await optimizeImage(imagePath, outputPath, format, options.quality);

      if (result.success) {
        optimizedPaths[format] = outputPath;
        stats.success++;
        stats.totalOriginalSize += result.originalSize;
        stats.totalOptimizedSize += result.optimizedSize;
        
        console.log(`   ✅ ${format.toUpperCase()}: ${(result.optimizedSize / 1024).toFixed(1)}KB (réduction: ${result.reduction})`);
      } else {
        stats.failed++;
        console.log(`   ❌ ${format.toUpperCase()}: ${result.error}`);
      }
    }

    // Générer le code lazy loading si demandé
    if (options.lazy && Object.keys(optimizedPaths).length > 0) {
      const lazyCode = generateLazyLoadingCode(imagePath, optimizedPaths);
      const lazyCodePath = join(outputDir, `${baseName}.lazy.txt`);
      const fs = await import('fs');
      await fs.promises.writeFile(lazyCodePath, lazyCode);
    }

    console.log('');
  }

  // Afficher les statistiques finales
  console.log('📊 Statistiques finales:');
  console.log(`   Total: ${stats.total} image(s)`);
  console.log(`   Réussies: ${stats.success}`);
  console.log(`   Échouées: ${stats.failed}`);
  
  if (stats.totalOriginalSize > 0) {
    const totalReduction = ((1 - stats.totalOptimizedSize / stats.totalOriginalSize) * 100).toFixed(1);
    console.log(`   Taille originale: ${(stats.totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Taille optimisée: ${(stats.totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   Réduction totale: ${totalReduction}%`);
  }

  console.log('\n✅ Optimisation terminée!');
  console.log(`📁 Images optimisées dans: ${options.output}`);
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
