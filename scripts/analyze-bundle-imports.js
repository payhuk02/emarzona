/**
 * Script d'analyse des imports pour optimiser le bundle size
 * Identifie les imports lucide-react qui pourraient utiliser l'index centralisé
 * 
 * Usage: node scripts/analyze-bundle-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../src');
const ICONS_INDEX = path.join(SRC_DIR, 'components/icons/index.ts');

// Lire les icônes disponibles dans l'index
function getAvailableIcons() {
  const content = fs.readFileSync(ICONS_INDEX, 'utf-8');
  const exports = content.match(/export\s+{\s*([^}]+)\s*}/g) || [];
  const icons = new Set();
  
  exports.forEach(exportBlock => {
    const matches = exportBlock.match(/(\w+)/g);
    if (matches) {
      matches.forEach(icon => {
        if (icon !== 'export' && icon !== 'from') {
          icons.add(icon);
        }
      });
    }
  });
  
  return icons;
}

// Analyser un fichier pour les imports lucide-react
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  // Chercher les imports lucide-react
  const lucideImports = lines
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(({ line }) => line.includes("from 'lucide-react'") || line.includes('from "lucide-react"'));
  
  lucideImports.forEach(({ line, index }) => {
    // Extraire les icônes importées
    const importMatch = line.match(/import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/);
    if (importMatch) {
      const importedIcons = importMatch[1]
        .split(',')
        .map(i => i.trim().split(' as ')[0].trim())
        .filter(Boolean);
      
      importedIcons.forEach(icon => {
        issues.push({
          file: filePath,
          line: index,
          icon,
          suggestion: `Utiliser l'index centralisé: import { ${icon} } from '@/components/icons'`
        });
      });
    }
  });
  
  return issues;
}

// Parcourir récursivement les fichiers
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer node_modules, dist, etc.
      if (!['node_modules', 'dist', '.git', '.next'].includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Fonction principale
function main() {
  console.log('🔍 Analyse des imports lucide-react...\n');
  
  const availableIcons = getAvailableIcons();
  console.log(`✅ ${availableIcons.size} icônes disponibles dans l'index centralisé\n`);
  
  const files = walkDir(SRC_DIR);
  console.log(`📁 Analyse de ${files.length} fichiers...\n`);
  
  const allIssues = [];
  files.forEach(file => {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  });
  
  // Filtrer les issues pour ne garder que celles qui peuvent utiliser l'index
  const optimizableIssues = allIssues.filter(issue => 
    availableIcons.has(issue.icon)
  );
  
  // Grouper par fichier
  const issuesByFile = {};
  optimizableIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Afficher les résultats
  console.log(`\n📊 Résultats:\n`);
  console.log(`   Total d'imports lucide-react: ${allIssues.length}`);
  console.log(`   Imports optimisables: ${optimizableIssues.length}`);
  console.log(`   Fichiers concernés: ${Object.keys(issuesByFile).length}\n`);
  
  // Afficher les 20 premiers fichiers avec le plus d'opportunités
  const sortedFiles = Object.entries(issuesByFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 20);
  
  if (sortedFiles.length > 0) {
    console.log('📋 Top 20 fichiers avec opportunités d\'optimisation:\n');
    sortedFiles.forEach(([file, issues]) => {
      const relativePath = path.relative(SRC_DIR, file);
      console.log(`   ${relativePath}: ${issues.length} imports optimisables`);
    });
  }
  
  // Générer un rapport JSON
  const report = {
    totalImports: allIssues.length,
    optimizableImports: optimizableIssues.length,
    filesAffected: Object.keys(issuesByFile).length,
    topFiles: sortedFiles.map(([file, issues]) => ({
      file: path.relative(SRC_DIR, file),
      count: issues.length,
      icons: [...new Set(issues.map(i => i.icon))]
    }))
  };
  
  const reportPath = path.join(__dirname, '../bundle-imports-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport sauvegardé: ${reportPath}`);
}

main();
