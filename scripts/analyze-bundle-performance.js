/**
 * Script d'analyse de performance du bundle
 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');


 * Analyse la taille des chunks et identifie les opportunités d'optimisation
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const STATS_FILE = join(DIST_DIR, 'stats.html');

console.log('📦 Analyse du Bundle - Performance\n');

// Vérifier si le build a été fait avec --mode analyze
if (!existsSync(STATS_FILE)) {
  console.log('❌ Fichier stats.html non trouvé.');
  console.log('💡 Exécutez d\'abord: npm run build:analyze\n');
  process.exit(1);
}

console.log('✅ Fichier stats.html trouvé');
console.log('📊 Ouvrez dist/stats.html dans votre navigateur pour voir la visualisation interactive\n');

// Analyser les chunks JavaScript
const JS_DIR = join(DIST_DIR, 'js');
if (existsSync(JS_DIR)) {
  console.log('📁 Chunks JavaScript trouvés:\n');
  
  // Lire les fichiers JS et calculer leur taille
  const files = readdirSync(JS_DIR).filter((f) => f.endsWith('.js'));
  
  const chunks = files.map((file) => {
    const filePath = join(JS_DIR, file);
    const stats = statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return {
      name: file,
      size: stats.size,
      sizeKB: parseFloat(sizeKB),
      sizeMB: parseFloat(sizeMB),
    };
  });

  // Trier par taille décroissante
  chunks.sort((a, b) => b.size - a.size);

  console.log('📊 Top 10 des chunks les plus volumineux:\n');
  chunks.slice(0, 10).forEach((chunk, index) => {
    const size = chunk.sizeMB > 1 ? `${chunk.sizeMB} MB` : `${chunk.sizeKB} KB`;
    const indicator = chunk.sizeMB > 1 ? '🔴' : chunk.sizeKB > 300 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${indicator} ${chunk.name}: ${size}`);
  });

  // Calculer le total
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  console.log(`\n📦 Taille totale: ${totalSizeMB} MB (${totalSizeKB} KB)`);

  // Recommandations
  console.log('\n💡 Recommandations:\n');
  
  const largeChunks = chunks.filter((c) => c.sizeKB > 300);
  if (largeChunks.length > 0) {
    console.log('⚠️  Chunks > 300KB détectés:');
    largeChunks.forEach((chunk) => {
      console.log(`   - ${chunk.name} (${chunk.sizeKB} KB)`);
      console.log(`     → Considérez le lazy loading ou le code splitting`);
    });
  }

  const mainChunk = chunks.find((c) => c.name.includes('index'));
  if (mainChunk && mainChunk.sizeKB > 500) {
    console.log(`\n🔴 Chunk principal volumineux: ${mainChunk.sizeKB} KB`);
    console.log('   → Objectif: < 500 KB');
    console.log('   → Actions:');
    console.log('     1. Vérifier les imports non-critiques');
    console.log('     2. Lazy load des composants lourds');
    console.log('     3. Optimiser les dépendances');
  }

  // Analyser les chunks CSS
  const CSS_DIR = join(DIST_DIR, 'css');
  if (existsSync(CSS_DIR)) {
    const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      console.log('\n🎨 Chunks CSS:\n');
      cssFiles.forEach((file) => {
        const filePath = join(CSS_DIR, file);
        const stats = statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   - ${file}: ${sizeKB} KB`);
      });
    }
  }
}

console.log('\n✅ Analyse terminée');
console.log('📊 Pour une analyse détaillée, ouvrez dist/stats.html dans votre navigateur\n');

