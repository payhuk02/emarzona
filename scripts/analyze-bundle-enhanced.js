#!/usr/bin/env node

/**
 * Script d'analyse de bundle amélioré
 * Analyse la taille du bundle et identifie les dépendances lourdes
 * 
 * Usage: node scripts/analyze-bundle-enhanced.js [options]
 * 
 * Options:
 *   --build              Construire le bundle avant analyse
 *   --threshold=size     Taille seuil en KB (défaut: 50)
 *   --format=json|table  Format de sortie (défaut: table)
 *   --output=path        Fichier de sortie (optionnel)
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const DEFAULT_OPTIONS = {
  build: false,
  threshold: 50, // KB
  format: 'table',
  output: null,
};

/**
 * Parser les arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_OPTIONS };

  args.forEach(arg => {
    if (arg === '--build') {
      options.build = true;
    } else if (arg.startsWith('--threshold=')) {
      options.threshold = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    }
  });

  return options;
}

/**
 * Construire le bundle
 */
async function buildBundle() {
  console.log('🔨 Construction du bundle...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Bundle construit avec succès\n');
  } catch (error) {
    console.error('❌ Erreur lors de la construction:', error.message);
    process.exit(1);
  }
}

/**
 * Analyser le bundle avec vite-bundle-visualizer
 */
async function analyzeWithVisualizer() {
  console.log('📊 Analyse du bundle avec vite-bundle-visualizer...');
  
  try {
    // Vérifier si le plugin est installé
    try {
      execSync('npm list rollup-plugin-visualizer', { stdio: 'ignore' });
    } catch {
      console.log('📦 Installation de rollup-plugin-visualizer...');
      execSync('npm install -D rollup-plugin-visualizer', { stdio: 'inherit' });
    }

    // Construire avec analyse
    execSync('npm run build -- --mode analyze', { stdio: 'inherit' });
    
    console.log('✅ Analyse terminée. Vérifiez le fichier stats.html dans dist/');
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

/**
 * Analyser les fichiers du bundle
 */
async function analyzeBundleFiles(options) {
  const distDir = 'dist';
  
  if (!existsSync(distDir)) {
    console.error('❌ Le dossier dist/ n\'existe pas. Exécutez --build d\'abord.');
    return null;
  }

  console.log('📊 Analyse des fichiers du bundle...\n');

  const files = await getBundleFiles(distDir);
  const analysis = analyzeFiles(files, options.threshold);

  return analysis;
}

/**
 * Obtenir tous les fichiers JS du bundle
 */
async function getBundleFiles(dir) {
  const { readdir, stat } = await import('fs/promises');
  const { join, extname } = await import('path');
  
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await getBundleFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && extname(entry.name) === '.js') {
      const stats = await stat(fullPath);
      files.push({
        path: fullPath,
        name: entry.name,
        size: stats.size,
      });
    }
  }

  return files;
}

/**
 * Analyser les fichiers
 */
function analyzeFiles(files, threshold) {
  const analysis = {
    total: 0,
    chunks: [],
    large: [],
    recommendations: [],
  };

  files.forEach(file => {
    const sizeKB = file.size / 1024;
    analysis.total += file.size;

    const chunk = {
      name: file.name,
      path: file.path,
      size: file.size,
      sizeKB: sizeKB.toFixed(2),
    };

    analysis.chunks.push(chunk);

    if (sizeKB > threshold) {
      analysis.large.push(chunk);
    }
  });

  // Générer des recommandations
  analysis.large.forEach(chunk => {
    if (chunk.sizeKB > 200) {
      analysis.recommendations.push({
        chunk: chunk.name,
        issue: 'Chunk très volumineux (>200KB)',
        suggestion: 'Considérez le code splitting ou le lazy loading',
      });
    } else if (chunk.sizeKB > 100) {
      analysis.recommendations.push({
        chunk: chunk.name,
        issue: 'Chunk volumineux (>100KB)',
        suggestion: 'Vérifiez les imports et le tree-shaking',
      });
    }
  });

  return analysis;
}

/**
 * Formater en table
 */
function formatTable(analysis) {
  let output = '\n📊 ANALYSE DU BUNDLE\n';
  output += '='.repeat(80) + '\n\n';
  
  output += `Taille totale: ${(analysis.total / 1024 / 1024).toFixed(2)}MB\n`;
  output += `Nombre de chunks: ${analysis.chunks.length}\n\n`;

  if (analysis.large.length > 0) {
    output += '⚠️  CHUNKS VOLUMINEUX (>' + (analysis.threshold || 50) + 'KB):\n';
    output += '-'.repeat(80) + '\n';
    output += 'Nom'.padEnd(40) + 'Taille'.padEnd(15) + 'Chemin\n';
    output += '-'.repeat(80) + '\n';
    
    analysis.large.forEach(chunk => {
      output += chunk.name.padEnd(40) + `${chunk.sizeKB}KB`.padEnd(15) + chunk.path + '\n';
    });
    output += '\n';
  }

  if (analysis.recommendations.length > 0) {
    output += '💡 RECOMMANDATIONS:\n';
    output += '-'.repeat(80) + '\n';
    analysis.recommendations.forEach(rec => {
      output += `• ${rec.chunk}: ${rec.issue}\n`;
      output += `  → ${rec.suggestion}\n\n`;
    });
  }

  return output;
}

/**
 * Formater en JSON
 */
function formatJSON(analysis) {
  return JSON.stringify(analysis, null, 2);
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  console.log('🚀 Analyse du bundle...\n');

  // Construire si demandé
  if (options.build) {
    await buildBundle();
  }

  // Analyser avec visualizer
  await analyzeWithVisualizer();

  // Analyser les fichiers
  const analysis = await analyzeBundleFiles(options);

  if (!analysis) {
    return;
  }

  // Formater la sortie
  let output;
  if (options.format === 'json') {
    output = formatJSON(analysis);
  } else {
    output = formatTable(analysis);
  }

  console.log(output);

  // Écrire dans un fichier si demandé
  if (options.output) {
    await writeFile(options.output, output);
    console.log(`\n✅ Résultats sauvegardés dans: ${options.output}`);
  }
}

// Exécuter
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
