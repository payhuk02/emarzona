/**
 * Script d'optimisation automatique des images
 * Analyse, compresse et convertit les images aux formats optimaux
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Formats d'images supportés
 */
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

/**
 * Configuration d'optimisation par format
 */
const OPTIMIZATION_CONFIG = {
  jpg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  },
  png: {
    quality: 90,
    compressionLevel: 8,
    palette: true
  },
  webp: {
    quality: 85,
    effort: 6
  },
  avif: {
    quality: 80,
    effort: 6
  }
};

/**
 * Tailles cibles pour les images responsives
 */
const RESPONSIVE_SIZES = [320, 640, 768, 1024, 1280, 1920];

/**
 * Analyse une image et retourne ses métadonnées
 */
async function analyzeImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = fs.statSync(filePath);

    return {
      path: filePath,
      name: path.basename(filePath),
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024 * 100) / 100,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha || false,
      // Calcul du ratio de compression potentiel
      potentialSavings: calculatePotentialSavings(metadata, stats.size)
    };
  } catch (error) {
    console.warn(`⚠️ Impossible d'analyser ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Calcule les économies potentielles d'une image
 */
function calculatePotentialSavings(metadata, currentSize) {
  let potentialSize = currentSize;

  // Pour JPEG: réduction de qualité à 85%
  if (metadata.format === 'jpeg') {
    potentialSize = Math.round(currentSize * 0.75); // ~25% de réduction
  }
  // Pour PNG: compression et palette si applicable
  else if (metadata.format === 'png') {
    potentialSize = Math.round(currentSize * 0.7); // ~30% de réduction
  }
  // Pour les autres formats, économie moindre
  else {
    potentialSize = Math.round(currentSize * 0.9); // ~10% de réduction
  }

  return {
    size: potentialSize,
    savings: currentSize - potentialSize,
    savingsPercent: Math.round((1 - potentialSize / currentSize) * 100)
  };
}

/**
 * Optimise une image selon son format
 */
async function optimizeImage(imageInfo, outputDir) {
  const { path: inputPath, name, format } = imageInfo;
  const baseName = path.parse(name).name;
  const outputPath = path.join(outputDir, `${baseName}.webp`);

  try {
    let pipeline = sharp(inputPath);

    // Configuration selon le format source
    if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({
        quality: OPTIMIZATION_CONFIG.jpg.quality,
        progressive: OPTIMIZATION_CONFIG.jpg.progressive,
        mozjpeg: OPTIMIZATION_CONFIG.jpg.mozjpeg
      });
    } else if (format === 'png') {
      pipeline = pipeline.png({
        quality: OPTIMIZATION_CONFIG.png.quality,
        compressionLevel: OPTIMIZATION_CONFIG.png.compressionLevel,
        palette: OPTIMIZATION_CONFIG.png.palette
      });
    }

    // Convertir en WebP pour une meilleure compression
    pipeline = pipeline.webp({
      quality: OPTIMIZATION_CONFIG.webp.quality,
      effort: OPTIMIZATION_CONFIG.webp.effort
    });

    await pipeline.toFile(outputPath);

    // Calculer la nouvelle taille
    const newStats = fs.statSync(outputPath);
    const savings = imageInfo.size - newStats.size;
    const savingsPercent = Math.round((savings / imageInfo.size) * 100);

    return {
      originalSize: imageInfo.size,
      newSize: newStats.size,
      savings,
      savingsPercent,
      outputPath
    };

  } catch (error) {
    console.error(`❌ Erreur lors de l'optimisation de ${name}:`, error.message);
    return null;
  }
}

/**
 * Génère des versions responsives d'une image
 */
async function generateResponsiveVersions(imageInfo, outputDir) {
  const { path: inputPath, name, width } = imageInfo;
  const baseName = path.parse(name).name;
  const versions = [];

  if (!width || width < 400) return versions; // Pas besoin de versions responsives pour les petites images

  for (const size of RESPONSIVE_SIZES) {
    if (size >= width) continue; // Ne pas agrandir l'image

    const outputPath = path.join(outputDir, `${baseName}-${size}w.webp`);

    try {
      await sharp(inputPath)
        .resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({
          quality: OPTIMIZATION_CONFIG.webp.quality,
          effort: OPTIMIZATION_CONFIG.webp.effort
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      versions.push({
        size,
        path: outputPath,
        fileSize: stats.size
      });

    } catch (error) {
      console.warn(`⚠️ Impossible de générer la version ${size}w pour ${name}:`, error.message);
    }
  }

  return versions;
}

/**
 * Trouve toutes les images dans un répertoire
 */
function findImages(dirPath) {
  const images = [];

  function scanDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(itemPath);
      } else if (stats.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (SUPPORTED_FORMATS.includes(ext)) {
          images.push(itemPath);
        }
      }
    }
  }

  scanDirectory(dirPath);
  return images;
}

/**
 * Script principal d'optimisation
 */
async function optimizeAllImages() {
  const projectRoot = path.join(__dirname, '..');
  const outputDir = path.join(projectRoot, 'src', 'assets', 'optimized');

  console.log('🖼️ ANALYSE ET OPTIMISATION DES IMAGES\n');

  // Créer le dossier de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Trouver toutes les images
  console.log('🔍 Recherche des images...');
  const imagePaths = [
    ...findImages(path.join(projectRoot, 'src', 'assets')),
    ...findImages(path.join(projectRoot, 'public'))
  ];

  console.log(`📊 ${imagePaths.length} images trouvées\n`);

  // Analyser toutes les images
  console.log('📈 Analyse des images...');
  const imageAnalyses = [];
  for (const imagePath of imagePaths) {
    const analysis = await analyzeImage(imagePath);
    if (analysis) {
      imageAnalyses.push(analysis);
    }
  }

  // Trier par potentiel d'économie
  imageAnalyses.sort((a, b) => b.potentialSavings.savings - a.potentialSavings.savings);

  console.log('📋 IMAGES ANALYSÉES:');
  console.log('┌─────────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ Image                          │ Taille │ Largeur │ Économie potentielle │');
  console.log('├─────────────────────────────────┼────────┼─────────┼─────────────────────┤');

  let totalCurrentSize = 0;
  let totalPotentialSavings = 0;

  for (const img of imageAnalyses.slice(0, 20)) { // Top 20
    const name = img.name.padEnd(30).substring(0, 30);
    const size = `${img.sizeKB}KB`.padStart(6);
    const width = `${img.width || '?'}px`.padStart(7);
    const savings = `${img.potentialSavings.savingsPercent}%`.padStart(19);

    console.log(`│ ${name} │ ${size} │ ${width} │ ${savings} │`);
    totalCurrentSize += img.size;
    totalPotentialSavings += img.potentialSavings.savings;
  }

  console.log('└─────────────────────────────────────────────────────────────────────────────────┘\n');

  // Statistiques globales
  const totalPotentialSize = totalCurrentSize - totalPotentialSavings;
  const overallSavingsPercent = Math.round((totalPotentialSavings / totalCurrentSize) * 100);

  console.log('📊 STATISTIQUES GLOBALES:');
  console.log(`  • Nombre d'images: ${imageAnalyses.length}`);
  console.log(`  • Taille totale actuelle: ${Math.round(totalCurrentSize / 1024 / 1024 * 100) / 100} MB`);
  console.log(`  • Économies potentielles: ${Math.round(totalPotentialSavings / 1024 / 1024 * 100) / 100} MB (${overallSavingsPercent}%)`);
  console.log(`  • Taille après optimisation: ${Math.round(totalPotentialSize / 1024 / 1024 * 100) / 100} MB\n`);

  // Optimisation des images
  console.log('🔧 OPTIMISATION EN COURS...\n');

  let totalOptimized = 0;
  let totalActualSavings = 0;

  for (const imageInfo of imageAnalyses) {
    if (imageInfo.potentialSavings.savingsPercent < 5) continue; // Skip if less than 5% savings

    console.log(`⚙️  Optimisation de ${imageInfo.name}...`);

    const result = await optimizeImage(imageInfo, outputDir);
        if (result) {
      const actualSavingsPercent = Math.round((result.savings / result.originalSize) * 100);
      console.log(`  ✅ Optimisée: ${Math.round(result.originalSize / 1024)}KB → ${Math.round(result.newSize / 1024)}KB (${actualSavingsPercent}% d'économie)`);

      totalOptimized++;
      totalActualSavings += result.savings;

      // Générer les versions responsives pour les grandes images
      if (imageInfo.width && imageInfo.width > 800) {
        const responsiveVersions = await generateResponsiveVersions(imageInfo, outputDir);
        if (responsiveVersions.length > 0) {
          console.log(`  📱 ${responsiveVersions.length} versions responsives générées`);
        }
      }
    }
  }

  // Résumé final
  console.log('\n🎉 OPTIMISATION TERMINÉE !');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│ Résumé de l\'optimisation                      │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log(`│ Images optimisées: ${totalOptimized.toString().padStart(28)} │`);
  console.log(`│ Économies réalisées: ${(Math.round(totalActualSavings / 1024)).toString()} KB${' '.repeat(14)} │`);
  console.log(`│ Images responsives générées: Auto-calculé${' '.repeat(4)} │`);
  console.log('└─────────────────────────────────────────────────┘\n');

  console.log('💡 RECOMMANDATIONS:');
  console.log('  • Utilisez les images du dossier src/assets/optimized/');
  console.log('  • Implémentez le lazy loading pour les images hors écran');
  console.log('  • Utilisez les versions responsives pour les écrans mobiles');
  console.log('  • Servez les images via CDN pour de meilleures performances');
  console.log('\n✅ Optimisation automatique des images terminée !');
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  optimizeAllImages().catch(console.error);
}

export { optimizeAllImages, analyzeImage, optimizeImage, generateResponsiveVersions };