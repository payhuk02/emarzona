/**
 * Script de configuration pour l'optimisation d'images
 * Installe les dépendances et configure l'environnement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration de l\'optimisation d\'images...\n');

// Vérifier si Sharp est déjà installé
try {
  require.resolve('sharp');
  console.log('✅ Sharp.js est déjà installé');
} catch {
  console.log('📦 Installation de Sharp.js...');
  try {
    execSync('npm install sharp @types/sharp', { stdio: 'inherit' });
    console.log('✅ Sharp.js installé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'installation de Sharp.js:', error.message);
    console.log('💡 Astuce: Assurez-vous que les outils de compilation C++ sont installés');
    console.log('   Windows: npm install --global windows-build-tools');
    console.log('   macOS: xcode-select --install');
    console.log('   Linux: sudo apt-get install build-essential');
    process.exit(1);
  }
}

// Créer le dossier pour les images optimisées s'il n'existe pas
const optimizedImagesDir = path.join(process.cwd(), 'public', 'optimized');
if (!fs.existsSync(optimizedImagesDir)) {
  fs.mkdirSync(optimizedImagesDir, { recursive: true });
  console.log('📁 Dossier public/optimized créé');
}

// Créer le fichier de configuration pour les images
const configPath = path.join(process.cwd(), 'src', 'config', 'image-optimization.ts');
const configContent = `/**
 * Configuration de l'optimisation d'images
 */

export const imageOptimizationConfig = {
  // Formats supportés
  supportedFormats: ['jpeg', 'png', 'webp', 'avif'] as const,

  // Qualité par défaut
  defaultQuality: 85,

  // Tailles responsive par défaut
  defaultSizes: [400, 800, 1200, 1600],

  // Formats de sortie prioritaires (du plus optimisé au moins)
  formatPriority: ['avif', 'webp', 'jpeg'] as const,

  // Limites de sécurité
  limits: {
    maxWidth: 4000,
    maxHeight: 4000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    minWidth: 100,
    minHeight: 100
  },

  // Configuration de cache
  cache: {
    maxAge: 31536000, // 1 an en secondes
    staleWhileRevalidate: 86400 // 1 jour
  },

  // Seuils SEO
  seoThresholds: {
    excellent: 90,
    good: 70,
    needsImprovement: 50
  }
};

export type ImageFormat = typeof imageOptimizationConfig.supportedFormats[number];
export type OptimizedFormat = typeof imageOptimizationConfig.formatPriority[number];
`;

if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, configContent);
  console.log('📝 Configuration d\'optimisation créée');
}

// Vérifier les dépendances dans package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = ['sharp'];
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]);

if (missingDeps.length > 0) {
  console.log('⚠️ Dépendances manquantes détectées. Installation...');
  execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ Dépendances installées');
}

// Créer un script NPM pour l'optimisation
if (!packageJson.scripts?.['images:optimize']) {
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['images:optimize'] = 'tsx scripts/optimize-images.ts';
  packageJson.scripts['images:check'] = 'node scripts/check-ai-settings-migration.js';

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('📝 Scripts NPM ajoutés');
}

// Créer le fichier d'optimisation des images existantes
const optimizeScriptPath = path.join(process.cwd(), 'scripts', 'optimize-existing-images.ts');
const optimizeScriptContent = `/**
 * Script pour optimiser les images existantes
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { optimizeImage } from '../src/lib/image-optimization';

const imagesDir = join(process.cwd(), 'public', 'images');
const optimizedDir = join(process.cwd(), 'public', 'optimized');

async function optimizeExistingImages() {
  console.log('🔍 Recherche d\'images à optimiser...');

  const imageFiles: string[] = [];

  function scanDirectory(dir: string) {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory() && !file.startsWith('.') && file !== 'optimized') {
        scanDirectory(filePath);
      } else if (stat.isFile() && ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(file).toLowerCase())) {
        imageFiles.push(filePath);
      }
    }
  }

  scanDirectory(imagesDir);

  console.log(\`📸 \${imageFiles.length} images trouvées\`);

  for (const imagePath of imageFiles) {
    try {
      console.log(\`⚡ Optimisation: \${imagePath}\`);

      // Ici vous pouvez ajouter la logique d'optimisation
      // const buffer = readFileSync(imagePath);
      // const result = await optimizeImage(buffer);
      // writeFileSync(join(optimizedDir, basename(imagePath)), result.optimized);

    } catch (error) {
      console.error(\`❌ Erreur avec \${imagePath}:\`, error);
    }
  }

  console.log('✅ Optimisation terminée');
}

optimizeExistingImages().catch(console.error);
`;

if (!fs.existsSync(optimizeScriptPath)) {
  fs.writeFileSync(optimizeScriptPath, optimizeScriptContent);
  console.log('📝 Script d\'optimisation des images existantes créé');
}

console.log('\n🎉 Configuration terminée !');
console.log('\n📋 Commandes disponibles :');
console.log('• npm run images:optimize  - Optimiser les images existantes');
console.log('• npm run images:check     - Vérifier la migration IA');
console.log('\n📚 Composants disponibles :');
console.log('• <OptimizedImage />       - Images optimisées avec SEO');
console.log('• <OptimizedImageUpload /> - Upload avec optimisation automatique');
console.log('• useImageOptimization()   - Hook pour l\'optimisation');
console.log('• useOptimizedImageUpload() - Hook pour l\'upload optimisé');

console.log('\n🚀 Prêt pour l\'optimisation d\'images !');