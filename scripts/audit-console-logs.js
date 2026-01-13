#!/usr/bin/env node

/**
 * Script d'audit pour identifier tous les fichiers avec console.*
 * Exclut les fichiers légitimes (logger.ts, console-guard.ts, test/setup.ts)
 * 
 * Usage: node scripts/audit-console-logs.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fichiers légitimes qui peuvent utiliser console.*
const LEGITIMATE_FILES = [
  'src/lib/logger.ts',
  'src/lib/console-guard.ts',
  'src/lib/error-logger.ts',
  'src/test/setup.ts',
  'scripts/',
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
];

// Patterns à rechercher
const CONSOLE_PATTERNS = [
  /console\.log\(/g,
  /console\.error\(/g,
  /console\.warn\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
];

/**
 * Vérifie si un fichier est légitime (peut utiliser console.*)
 */
function isLegitimateFile(filePath) {
  return LEGITIMATE_FILES.some(legit => {
    if (legit.endsWith('/')) {
      return filePath.includes(legit);
    }
    return filePath.includes(legit);
  });
}

/**
 * Compte les occurrences de console.* dans un fichier
 */
function countConsoleOccurrences(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const occurrences = {
      log: (content.match(/console\.log\(/g) || []).length,
      error: (content.match(/console\.error\(/g) || []).length,
      warn: (content.match(/console\.warn\(/g) || []).length,
      debug: (content.match(/console\.debug\(/g) || []).length,
      info: (content.match(/console\.info\(/g) || []).length,
    };
    
    const total = Object.values(occurrences).reduce((sum, count) => sum + count, 0);
    
    return { occurrences, total };
  } catch (error) {
    console.error(`Erreur lecture ${filePath}:`, error.message);
    return { occurrences: {}, total: 0 };
  }
}

/**
 * Trouve tous les fichiers TypeScript/JavaScript dans src/
 */
function findSourceFiles() {
  try {
    // Utiliser find (Unix) ou PowerShell (Windows)
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // PowerShell command pour Windows
      const command = `powershell -Command "Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-Object -ExpandProperty FullName"`;
      const output = execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
      return output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0)
        .map(line => path.relative(process.cwd(), line).replace(/\\/g, '/'));
    } else {
      // find command pour Unix/Mac
      const command = 'find src -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\)';
      const output = execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
      return output
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0);
    }
  } catch (error) {
    console.error('Erreur lors de la recherche de fichiers:', error.message);
    return [];
  }
}

/**
 * Audit principal
 */
function auditConsoleLogs() {
  console.log('🔍 Audit des console.* dans le projet...\n');
  
  const files = findSourceFiles();
  const results = [];
  let totalOccurrences = 0;
  let totalFiles = 0;
  
  for (const file of files) {
    if (isLegitimateFile(file)) {
      continue;
    }
    
    const { occurrences, total } = countConsoleOccurrences(file);
    
    if (total > 0) {
      results.push({
        file,
        occurrences,
        total,
      });
      totalOccurrences += total;
      totalFiles++;
    }
  }
  
  // Trier par nombre d'occurrences décroissant
  results.sort((a, b) => b.total - a.total);
  
  // Afficher résultats
  console.log('📊 RÉSULTATS DE L\'AUDIT\n');
  console.log(`Total fichiers avec console.* : ${totalFiles}`);
  console.log(`Total occurrences : ${totalOccurrences}\n`);
  
  console.log('📋 FICHIERS PAR ORDRE DE PRIORITÉ (plus d\'occurrences en premier)\n');
  
  results.forEach((result, index) => {
    const methods = Object.entries(result.occurrences)
      .filter(([_, count]) => count > 0)
      .map(([method, count]) => `${method}: ${count}`)
      .join(', ');
    
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   Total: ${result.total} (${methods})`);
    console.log('');
  });
  
  // Générer rapport JSON
  const reportPath = path.join(process.cwd(), 'docs', 'audits', 'console-logs-audit.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    date: new Date().toISOString(),
    summary: {
      totalFiles,
      totalOccurrences,
    },
    files: results,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport JSON généré : ${reportPath}`);
  
  // Générer rapport Markdown
  const markdownPath = path.join(process.cwd(), 'docs', 'audits', 'console-logs-audit.md');
  let markdown = `# 🔍 Audit Console.* - ${new Date().toLocaleDateString('fr-FR')}\n\n`;
  markdown += `## 📊 Résumé\n\n`;
  markdown += `- **Total fichiers** : ${totalFiles}\n`;
  markdown += `- **Total occurrences** : ${totalOccurrences}\n\n`;
  markdown += `## 📋 Fichiers à Corriger\n\n`;
  
  results.forEach((result, index) => {
    const methods = Object.entries(result.occurrences)
      .filter(([_, count]) => count > 0)
      .map(([method, count]) => `\`console.${method}\`: ${count}`)
      .join(', ');
    
    markdown += `### ${index + 1}. \`${result.file}\`\n\n`;
    markdown += `- **Total** : ${result.total}\n`;
    markdown += `- **Méthodes** : ${methods}\n\n`;
  });
  
  fs.writeFileSync(markdownPath, markdown);
  console.log(`✅ Rapport Markdown généré : ${markdownPath}`);
  
  // Suggestions
  console.log('\n💡 SUGGESTIONS\n');
  console.log('1. Commencer par les fichiers avec le plus d\'occurrences');
  console.log('2. Remplacer console.* par logger.* de @/lib/logger');
  console.log('3. Vérifier que console-guard.ts est bien installé dans main.tsx');
  console.log('4. Tester chaque fichier modifié');
  console.log('\n📝 Commandes utiles:');
  console.log('   - npm run lint:fix  # Corriger automatiquement si possible');
  console.log('   - npm run test      # Tester après modifications\n');
}

// Exécuter l'audit
auditConsoleLogs();
