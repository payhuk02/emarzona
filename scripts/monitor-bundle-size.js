/**
 * Script de monitoring du bundle size
 * Analyse la taille des chunks et alerte si dépassement des limites
 */

const fs = require('fs');
const path = require('path');

const BUNDLE_LIMITS = {
  index: 300, // KB - Chunk principal
  charts: 200, // KB - Recharts
  pdf: 250, // KB - jsPDF
  admin: 150, // KB - Pages admin
  marketplace: 150, // KB - Marketplace
  dashboard: 150, // KB - Dashboard
  default: 200, // KB - Autres chunks
};

const WARNING_THRESHOLD = 0.8; // 80% du maximum = avertissement

/**
 * Convertit bytes en KB
 */
function bytesToKB(bytes) {
  return (bytes / 1024).toFixed(2);
}

/**
 * Analyse les fichiers du build
 */
function analyzeBundleSize() {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Le dossier dist/ n\'existe pas. Exécutez "npm run build" d\'abord.');
    process.exit(1);
  }
  
  const jsPath = path.join(distPath, 'js');
  
  if (!fs.existsSync(jsPath)) {
    console.error('❌ Le dossier dist/js/ n\'existe pas.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));
  
  if (files.length === 0) {
    console.error('❌ Aucun fichier JS trouvé dans dist/js/');
    process.exit(1);
  }
  
  console.log('📦 Analyse du bundle size...\n');
  
  const chunks = [];
  let totalSize = 0;
  let hasWarnings = false;
  let hasErrors = false;
  
  files.forEach(file => {
    const filePath = path.join(jsPath, file);
    const stats = fs.statSync(filePath);
    const sizeKB = parseFloat(bytesToKB(stats.size));
    totalSize += sizeKB;
    
    // Identifier le type de chunk
    let chunkType = 'default';
    let chunkName = file;
    
    if (file.includes('index-')) {
      chunkType = 'index';
      chunkName = 'index (principal)';
    } else if (file.includes('charts-')) {
      chunkType = 'charts';
      chunkName = 'charts';
    } else if (file.includes('pdf-')) {
      chunkType = 'pdf';
      chunkName = 'pdf';
    } else if (file.includes('admin-')) {
      chunkType = 'admin';
      chunkName = 'admin';
    } else if (file.includes('marketplace-')) {
      chunkType = 'marketplace';
      chunkName = 'marketplace';
    } else if (file.includes('dashboard-')) {
      chunkType = 'dashboard';
      chunkName = 'dashboard';
    } else {
      // Extraire le nom du chunk du nom de fichier
      const match = file.match(/([^-]+)-[a-f0-9]+\.js$/);
      if (match) {
        chunkName = match[1];
      }
    }
    
    const limit = BUNDLE_LIMITS[chunkType] || BUNDLE_LIMITS.default;
    const warningThreshold = limit * WARNING_THRESHOLD;
    
    chunks.push({
      name: chunkName,
      file: file,
      size: sizeKB,
      limit: limit,
      type: chunkType,
      status: sizeKB > limit ? 'error' : sizeKB > warningThreshold ? 'warning' : 'ok'
    });
    
    if (sizeKB > limit) {
      hasErrors = true;
    } else if (sizeKB > warningThreshold) {
      hasWarnings = true;
    }
  });
  
  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);
  
  // Afficher les résultats
  console.log('📊 Résultats par chunk:\n');
  
  chunks.forEach(chunk => {
    const percentage = ((chunk.size / chunk.limit) * 100).toFixed(1);
    const statusIcon = chunk.status === 'error' ? '❌' : chunk.status === 'warning' ? '⚠️' : '✅';
    
    console.log(`${statusIcon} ${chunk.name.padEnd(25)} ${chunk.size.toFixed(2).padStart(8)} KB / ${chunk.limit} KB (${percentage}%)`);
  });
  
  console.log(`\n📈 Taille totale: ${totalSize.toFixed(2)} KB`);
  console.log(`📦 Nombre de chunks: ${chunks.length}\n`);
  
  // Résumé
  const okCount = chunks.filter(c => c.status === 'ok').length;
  const warningCount = chunks.filter(c => c.status === 'warning').length;
  const errorCount = chunks.filter(c => c.status === 'error').length;
  
  console.log('📋 Résumé:');
  console.log(`   ✅ OK: ${okCount}`);
  console.log(`   ⚠️  Avertissements: ${warningCount}`);
  console.log(`   ❌ Erreurs: ${errorCount}\n`);
  
  // Recommandations
  if (hasErrors || hasWarnings) {
    console.log('💡 Recommandations:\n');
    
    if (hasErrors) {
      console.log('   ❌ Chunks dépassant la limite:');
      chunks.filter(c => c.status === 'error').forEach(chunk => {
        const reduction = (chunk.size - chunk.limit).toFixed(2);
        console.log(`      - ${chunk.name}: Réduire de ${reduction} KB`);
      });
      console.log('');
    }
    
    if (hasWarnings) {
      console.log('   ⚠️  Chunks approchant la limite:');
      chunks.filter(c => c.status === 'warning').forEach(chunk => {
        const remaining = (chunk.limit - chunk.size).toFixed(2);
        console.log(`      - ${chunk.name}: ${remaining} KB restants`);
      });
      console.log('');
    }
    
    console.log('   Actions possibles:');
    console.log('   1. Vérifier les imports inutiles');
    console.log('   2. Utiliser lazy loading pour les composants lourds');
    console.log('   3. Optimiser les dépendances (tree shaking)');
    console.log('   4. Séparer les chunks volumineux\n');
  }
  
  // Code de sortie
  if (hasErrors) {
    console.log('❌ Build échoué: certains chunks dépassent les limites\n');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Build réussi avec avertissements\n');
    process.exit(0);
  } else {
    console.log('✅ Build optimal: tous les chunks sont dans les limites\n');
    process.exit(0);
  }
}

// Exécuter l'analyse
analyzeBundleSize();

