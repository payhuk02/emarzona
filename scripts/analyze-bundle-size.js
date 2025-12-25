/**
 * Script d'analyse de la taille du bundle
 * Génère un rapport détaillé des chunks et de leurs tailles
 * 
 * Usage: node scripts/analyze-bundle-size.js
 * Prérequis: npm run build (doit être exécuté d'abord)
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const DIST_DIR = join(process.cwd(), 'dist');
const JS_DIR = join(DIST_DIR, 'js');
const CSS_DIR = join(DIST_DIR, 'css');

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
 * Analyse un répertoire et retourne les fichiers avec leur taille
 */
async function analyzeDirectory(dir, extension = '.js') {
  if (!existsSync(dir)) {
    console.warn(`⚠️  Répertoire non trouvé: ${dir}`);
    return [];
  }

  const files = await readdir(dir);
  const fileStats = await Promise.all(
    files
      .filter(file => file.endsWith(extension))
      .map(async file => {
        const filePath = join(dir, file);
        const stats = await stat(filePath);
        return {
          name: file,
          size: stats.size,
          path: filePath,
        };
      })
  );

  return fileStats.sort((a, b) => b.size - a.size);
}

/**
 * Analyse le bundle principal
 */
async function analyzeMainBundle() {
  console.log('\n📦 ANALYSE DU BUNDLE PRINCIPAL\n');
  console.log('═'.repeat(60));

  const jsFiles = await analyzeDirectory(JS_DIR, '.js');
  const cssFiles = await analyzeDirectory(CSS_DIR, '.css');

  if (jsFiles.length === 0 && cssFiles.length === 0) {
    console.log('\n❌ Aucun fichier trouvé. Assurez-vous d\'avoir exécuté `npm run build` d\'abord.\n');
    return;
  }

  // Analyse des fichiers JS
  if (jsFiles.length > 0) {
    console.log('\n📄 FICHIERS JAVASCRIPT\n');
    console.log('─'.repeat(60));
    
    let totalJS = 0;
    const chunks = {
      main: [],
      router: [],
      reactQuery: [],
      radix: [],
      tiptap: [],
      forms: [],
      charts: [],
      calendar: [],
      animations: [],
      other: [],
    };

    jsFiles.forEach(file => {
      totalJS += file.size;
      const name = file.name.toLowerCase();
      
      if (name.includes('index-') || name.includes('main-')) {
        chunks.main.push(file);
      } else if (name.includes('router')) {
        chunks.router.push(file);
      } else if (name.includes('react-query') || name.includes('query')) {
        chunks.reactQuery.push(file);
      } else if (name.includes('radix')) {
        chunks.radix.push(file);
      } else if (name.includes('tiptap')) {
        chunks.tiptap.push(file);
      } else if (name.includes('form')) {
        chunks.forms.push(file);
      } else if (name.includes('chart')) {
        chunks.charts.push(file);
      } else if (name.includes('calendar')) {
        chunks.calendar.push(file);
      } else if (name.includes('animation') || name.includes('framer')) {
        chunks.animations.push(file);
      } else {
        chunks.other.push(file);
      }

      console.log(`${file.name.padEnd(50)} ${formatSize(file.size).padStart(10)}`);
    });

    console.log('─'.repeat(60));
    console.log(`Total JS: ${formatSize(totalJS).padStart(10)}`);

    // Analyse par catégorie
    console.log('\n📊 RÉPARTITION PAR CATÉGORIE\n');
    console.log('─'.repeat(60));
    
    Object.entries(chunks).forEach(([category, files]) => {
      if (files.length > 0) {
        const categoryTotal = files.reduce((sum, f) => sum + f.size, 0);
        const percentage = ((categoryTotal / totalJS) * 100).toFixed(1);
        console.log(
          `${category.padEnd(20)} ${formatSize(categoryTotal).padStart(10)} (${percentage.padStart(5)}%)`
        );
      }
    });

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS\n');
    console.log('─'.repeat(60));
    
    const mainChunk = chunks.main[0];
    if (mainChunk && mainChunk.size > 350 * 1024) {
      console.log(`⚠️  Bundle principal trop volumineux: ${formatSize(mainChunk.size)}`);
      console.log('   → Objectif: < 350KB (non gzippé)');
      console.log('   → Actions: Séparer React Router, Radix UI, TipTap en chunks dédiés');
    }

    if (chunks.router.length > 0) {
      const routerTotal = chunks.router.reduce((sum, f) => sum + f.size, 0);
      if (routerTotal < 50 * 1024) {
        console.log(`✅ React Router bien séparé: ${formatSize(routerTotal)}`);
      }
    }

    if (chunks.radix.length > 0) {
      const radixTotal = chunks.radix.reduce((sum, f) => sum + f.size, 0);
      if (radixTotal < 100 * 1024) {
        console.log(`✅ Radix UI bien séparé: ${formatSize(radixTotal)}`);
      } else {
        console.log(`⚠️  Radix UI volumineux: ${formatSize(radixTotal)}`);
        console.log('   → Actions: Considérer le lazy-loading par composant');
      }
    }
  }

  // Analyse des fichiers CSS
  if (cssFiles.length > 0) {
    console.log('\n🎨 FICHIERS CSS\n');
    console.log('─'.repeat(60));
    
    let totalCSS = 0;
    cssFiles.forEach(file => {
      totalCSS += file.size;
      console.log(`${file.name.padEnd(50)} ${formatSize(file.size).padStart(10)}`);
    });

    console.log('─'.repeat(60));
    console.log(`Total CSS: ${formatSize(totalCSS).padStart(10)}`);

    if (totalCSS > 15 * 1024) {
      console.log('\n⚠️  CSS total trop volumineux');
      console.log('   → Objectif: < 15KB (non gzippé)');
      console.log('   → Actions: Séparer le CSS non-critique, purger les styles inutilisés');
    } else {
      console.log('\n✅ CSS dans les objectifs');
    }
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

// Exécuter l'analyse
analyzeMainBundle().catch(error => {
  console.error('❌ Erreur lors de l\'analyse:', error);
  process.exit(1);
});
