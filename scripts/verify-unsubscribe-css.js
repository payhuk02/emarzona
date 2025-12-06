#!/usr/bin/env node
/**
 * Script pour vérifier la taille du CSS UnsubscribePage après build
 * Date : 28 Février 2025
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_PATH = join(__dirname, '../dist');

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function findUnsubscribeFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findUnsubscribeFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.includes('UnsubscribePage')) {
        const stats = await stat(fullPath);
        files.push({
          path: fullPath.replace(DIST_PATH, ''),
          size: stats.size,
          name: entry.name
        });
      }
    }
  } catch (error) {
    // Directory might not exist or be accessible
  }
  
  return files;
}

async function verifyUnsubscribeCSS() {
  console.log('🔍 Vérification du CSS UnsubscribePage...\n');

  const files = await findUnsubscribeFiles(DIST_PATH);
  
  if (files.length === 0) {
    console.log('⚠️  Aucun fichier UnsubscribePage trouvé dans dist/');
    console.log('   Le build doit être terminé pour vérifier.');
    return;
  }

  console.log('📊 Fichiers UnsubscribePage trouvés :\n');
  
  let totalSize = 0;
  let cssFiles = [];
  
  for (const file of files) {
    const sizeKB = file.size / 1024;
    totalSize += file.size;
    
    if (file.name.endsWith('.css')) {
      cssFiles.push(file);
      console.log(`   ✅ ${file.path}`);
      console.log(`      Taille: ${formatSize(file.size)} (${sizeKB.toFixed(2)} KB)`);
      
      // Vérifier si la taille est acceptable
      if (sizeKB > 50) {
        console.log(`      ⚠️  Taille trop élevée (> 50 KB)`);
      } else if (sizeKB > 30) {
        console.log(`      ⚠️  Taille acceptable mais peut être optimisée (< 30 KB recommandé)`);
      } else {
        console.log(`      ✅ Taille optimale (< 30 KB)`);
      }
      console.log('');
    } else {
      console.log(`   📄 ${file.path} - ${formatSize(file.size)}`);
    }
  }

  console.log('📈 Résumé :\n');
  console.log(`   Total fichiers: ${files.length}`);
  console.log(`   Fichiers CSS: ${cssFiles.length}`);
  console.log(`   Taille totale CSS: ${formatSize(totalSize)}`);
  
  if (cssFiles.length > 0) {
    const avgSize = cssFiles.reduce((sum, f) => sum + f.size, 0) / cssFiles.length;
    console.log(`   Taille moyenne CSS: ${formatSize(avgSize)}`);
    
    // Comparaison avec l'objectif
    const targetSize = 50 * 1024; // 50 KB
    const previousSize = 275 * 1024; // 275 KB (avant optimisation)
    
    if (avgSize < targetSize) {
      const reduction = ((previousSize - avgSize) / previousSize * 100).toFixed(1);
      console.log(`\n   ✅ Objectif atteint !`);
      console.log(`   📉 Réduction: ${reduction}% (${formatSize(previousSize)} → ${formatSize(avgSize)})`);
    } else {
      console.log(`\n   ⚠️  Objectif non atteint (cible: < ${formatSize(targetSize)})`);
      console.log(`   📊 Taille actuelle: ${formatSize(avgSize)}`);
    }
  }
  
  // Vérifier les chunks JS
  console.log('\n🔍 Vérification des chunks JS...\n');
  try {
    const jsDir = join(DIST_PATH, 'js');
    const jsFiles = await readdir(jsDir);
    const unsubscribeChunks = jsFiles.filter(f => f.includes('unsubscribe'));
    
    if (unsubscribeChunks.length > 0) {
      console.log('   ✅ Chunks UnsubscribePage trouvés :');
      for (const chunk of unsubscribeChunks) {
        const chunkPath = join(jsDir, chunk);
        const stats = await stat(chunkPath);
        console.log(`      - ${chunk}: ${formatSize(stats.size)}`);
      }
    } else {
      console.log('   ⚠️  Aucun chunk JS UnsubscribePage trouvé');
      console.log('      (Le chunk pourrait être dans le bundle principal)');
    }
  } catch (error) {
    console.log('   ⚠️  Impossible de vérifier les chunks JS');
  }
}

verifyUnsubscribeCSS().catch(console.error);

