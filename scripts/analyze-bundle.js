#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script d'analyse du bundle pour identifier les optimisations possibles
 */

console.log('🔍 Analyse du Bundle Payhula...\n');

// Fonction pour analyser les fichiers source
function analyzeSourceFiles() {
  const srcDir = path.join(__dirname, '../src');
  const results = {
    pages: [],
    components: [],
    hooks: [],
    lib: [],
    totalSize: 0
  };

  function scanDirectory(dir, category) {
    try {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath, category);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const size = Buffer.byteLength(content, 'utf8');
          const lines = content.split('\n').length;
          
          results[category].push({
            name: file,
            path: path.relative(srcDir, filePath),
            size: size,
            lines: lines,
            imports: (content.match(/import.*from/g) || []).length,
            exports: (content.match(/export/g) || []).length
          });
          
          results.totalSize += size;
        }
      });
    } catch (error) {
      console.warn(`⚠️  Erreur lors de l'analyse de ${dir}:`, error.message);
    }
  }

  // Analyser chaque catégorie
  scanDirectory(path.join(srcDir, 'pages'), 'pages');
  scanDirectory(path.join(srcDir, 'components'), 'components');
  scanDirectory(path.join(srcDir, 'hooks'), 'hooks');
  scanDirectory(path.join(srcDir, 'lib'), 'lib');

  return results;
}

// Fonction pour analyser les dépendances
function analyzeDependencies() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const dependencies = {
    production: Object.keys(packageJson.dependencies || {}),
    development: Object.keys(packageJson.devDependencies || {}),
    total: 0
  };
  
  dependencies.total = dependencies.production.length + dependencies.development.length;
  
  return dependencies;
}

// Fonction pour identifier les optimisations possibles
function suggestOptimizations(analysis) {
  const suggestions = [];
  
  // Analyser les pages les plus volumineuses
  const largePages = analysis.pages
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);
  
  if (largePages.length > 0) {
    suggestions.push({
      type: 'pages',
      title: '📄 Pages volumineuses détectées',
      items: largePages.map(page => ({
        name: page.name,
        size: `${(page.size / 1024).toFixed(1)} kB`,
        lines: page.lines,
        suggestion: page.size > 50000 ? 'Considérer le lazy loading' : 'OK'
      }))
    });
  }
  
  // Analyser les composants les plus volumineux
  const largeComponents = analysis.components
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);
  
  if (largeComponents.length > 0) {
    suggestions.push({
      type: 'components',
      title: '🧩 Composants volumineux détectés',
      items: largeComponents.map(comp => ({
        name: comp.name,
        size: `${(comp.size / 1024).toFixed(1)} kB`,
        lines: comp.lines,
        imports: comp.imports,
        suggestion: comp.size > 20000 ? 'Considérer la division en sous-composants' : 'OK'
      }))
    });
  }
  
  // Analyser les hooks les plus volumineux
  const largeHooks = analysis.hooks
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);
  
  if (largeHooks.length > 0) {
    suggestions.push({
      type: 'hooks',
      title: '🪝 Hooks volumineux détectés',
      items: largeHooks.map(hook => ({
        name: hook.name,
        size: `${(hook.size / 1024).toFixed(1)} kB`,
        lines: hook.lines,
        suggestion: hook.size > 10000 ? 'Considérer la simplification' : 'OK'
      }))
    });
  }
  
  return suggestions;
}

// Fonction principale
function main() {
  console.log('📊 Analyse des fichiers source...');
  const sourceAnalysis = analyzeSourceFiles();
  
  console.log('📦 Analyse des dépendances...');
  const dependencies = analyzeDependencies();
  
  console.log('💡 Génération des suggestions...');
  const suggestions = suggestOptimizations(sourceAnalysis);
  
  // Affichage des résultats
  console.log('\n' + '='.repeat(60));
  console.log('📈 RÉSULTATS DE L\'ANALYSE');
  console.log('='.repeat(60));
  
  console.log(`\n📊 Statistiques générales:`);
  console.log(`   • Taille totale du code source: ${(sourceAnalysis.totalSize / 1024).toFixed(1)} kB`);
  console.log(`   • Nombre de pages: ${sourceAnalysis.pages.length}`);
  console.log(`   • Nombre de composants: ${sourceAnalysis.components.length}`);
  console.log(`   • Nombre de hooks: ${sourceAnalysis.hooks.length}`);
  console.log(`   • Nombre de fichiers lib: ${sourceAnalysis.lib.length}`);
  console.log(`   • Dépendances production: ${dependencies.production.length}`);
  console.log(`   • Dépendances développement: ${dependencies.development.length}`);
  
  // Affichage des suggestions
  suggestions.forEach(suggestion => {
    console.log(`\n${suggestion.title}:`);
    suggestion.items.forEach(item => {
      console.log(`   • ${item.name}: ${item.size} (${item.lines} lignes) - ${item.suggestion}`);
    });
  });
  
  // Recommandations générales
  console.log('\n🎯 RECOMMANDATIONS GÉNÉRALES:');
  console.log('   1. Implémenter le lazy loading pour les pages volumineuses');
  console.log('   2. Diviser les composants complexes en sous-composants');
  console.log('   3. Optimiser les imports (imports dynamiques)');
  console.log('   4. Utiliser React.memo pour les composants coûteux');
  console.log('   5. Implémenter le code splitting par route');
  
  console.log('\n✅ Analyse terminée!');
}

// Exécution
main();
