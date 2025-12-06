#!/usr/bin/env node

/**
 * Script d'audit ARIA Labels
 * 
 * Identifie tous les boutons et éléments interactifs sans aria-label
 * pour améliorer l'accessibilité (WCAG AA)
 * 
 * Usage: node scripts/audit-aria-labels.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '..', 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const PAGES_DIR = path.join(SRC_DIR, 'pages');

// Patterns pour identifier les éléments interactifs
const INTERACTIVE_PATTERNS = [
  /<button[^>]*>/gi,
  /<a[^>]*href[^>]*>/gi,
  /<input[^>]*type=["'](button|submit|reset|checkbox|radio)["'][^>]*>/gi,
  /onClick\s*=/gi,
  /onSubmit\s*=/gi,
  /onChange\s*=/gi,
];

// Patterns pour identifier les aria-labels existants
const ARIA_PATTERNS = [
  /aria-label\s*=/gi,
  /aria-labelledby\s*=/gi,
  /aria-describedby\s*=/gi,
];

/**
 * Analyse un fichier pour trouver les éléments interactifs sans aria-label
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Trouver tous les éléments interactifs
  INTERACTIVE_PATTERNS.forEach((pattern, index) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const matchText = match[0];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // Vérifier si l'élément a un aria-label
      const hasAriaLabel = ARIA_PATTERNS.some(ariaPattern => 
        matchText.match(ariaPattern)
      );
      
      // Vérifier si c'est un bouton avec du texte visible
      const hasVisibleText = />[^<]*[a-zA-Z]/.test(matchText);
      
      // Ignorer les boutons avec du texte visible (pas besoin d'aria-label)
      if (hasVisibleText && !matchText.includes('icon-only') && !matchText.includes('aria-hidden')) {
        continue;
      }
      
      // Si pas d'aria-label et pas de texte visible, c'est un problème
      if (!hasAriaLabel && !hasVisibleText) {
        issues.push({
          file: filePath,
          line: lineNumber,
          element: matchText.substring(0, 100),
          type: index === 0 ? 'button' : index === 1 ? 'link' : 'input',
        });
      }
    }
  });
  
  return issues;
}

/**
 * Récupère récursivement tous les fichiers .tsx et .jsx
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorer node_modules, dist, et autres dossiers non pertinents
      if (!['node_modules', 'dist', '.git', '.next', 'build'].includes(file)) {
        getAllFiles(filePath, fileList);
      }
    } else if (stat.isFile()) {
      // Inclure seulement les fichiers .tsx et .jsx, exclure les tests
      if ((file.endsWith('.tsx') || file.endsWith('.jsx')) && 
          !file.includes('.test.') && 
          !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Analyse récursive d'un répertoire
 */
function analyzeDirectory(dir) {
  const files = getAllFiles(dir);
  const allIssues = [];
  
  for (const filePath of files) {
    try {
      const issues = analyzeFile(filePath);
      if (issues.length > 0) {
        allIssues.push(...issues);
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse de ${filePath}:`, error.message);
    }
  }
  
  return allIssues;
}

/**
 * Génère un rapport
 */
function generateReport(issues) {
  const report = {
    total: issues.length,
    byType: {},
    byFile: {},
    critical: [],
  };
  
  issues.forEach(issue => {
    // Par type
    report.byType[issue.type] = (report.byType[issue.type] || 0) + 1;
    
    // Par fichier
    const relativePath = path.relative(SRC_DIR, issue.file);
    report.byFile[relativePath] = (report.byFile[relativePath] || 0) + 1;
    
    // Critiques (boutons icon-only sans aria-label)
    if (issue.type === 'button' && issue.element.includes('icon')) {
      report.critical.push(issue);
    }
  });
  
  return report;
}

/**
 * Main
 */
function main() {
  console.log('🔍 Audit ARIA Labels en cours...\n');
  
  const componentIssues = analyzeDirectory(COMPONENTS_DIR);
  const pageIssues = analyzeDirectory(PAGES_DIR);
  
  const allIssues = [...componentIssues, ...pageIssues];
  const report = generateReport(allIssues);
  
  // Afficher le rapport
  console.log('📊 RAPPORT D\'AUDIT ARIA LABELS\n');
  console.log(`Total d'éléments interactifs sans aria-label: ${report.total}\n`);
  
  console.log('Par type:');
  Object.entries(report.byType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });
  
  console.log('\nTop 10 fichiers avec le plus de problèmes:');
  Object.entries(report.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([file, count]) => {
      console.log(`  - ${file}: ${count} problème(s)`);
    });
  
  if (report.critical.length > 0) {
    console.log(`\n⚠️  ${report.critical.length} boutons icon-only critiques identifiés`);
  }
  
  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, '..', 'docs', 'audit-aria-labels-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport sauvegardé dans: ${reportPath}`);
  
  // Générer un fichier markdown
  const markdownPath = path.join(__dirname, '..', 'docs', 'audit-aria-labels-report.md');
  let markdown = '# 🔍 Rapport d\'Audit ARIA Labels\n\n';
  markdown += `**Date**: ${new Date().toISOString().split('T')[0]}\n\n`;
  markdown += `## Résumé\n\n`;
  markdown += `- **Total d'éléments sans aria-label**: ${report.total}\n`;
  markdown += `- **Boutons icon-only critiques**: ${report.critical.length}\n\n`;
  
  markdown += `## Par Type\n\n`;
  Object.entries(report.byType).forEach(([type, count]) => {
    markdown += `- **${type}**: ${count}\n`;
  });
  
  markdown += `\n## Top 10 Fichiers\n\n`;
  Object.entries(report.byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([file, count]) => {
      markdown += `- \`${file}\`: ${count} problème(s)\n`;
    });
  
  if (report.critical.length > 0) {
    markdown += `\n## Boutons Icon-Only Critiques\n\n`;
    report.critical.slice(0, 20).forEach((issue, index) => {
      const relativePath = path.relative(SRC_DIR, issue.file);
      markdown += `${index + 1}. \`${relativePath}\` (ligne ${issue.line})\n`;
    });
  }
  
  fs.writeFileSync(markdownPath, markdown);
  console.log(`✅ Rapport Markdown sauvegardé dans: ${markdownPath}`);
  
  // Code de sortie
  process.exit(report.total > 0 ? 1 : 0);
}

try {
  main();
} catch (error) {
  console.error('Erreur:', error);
  process.exit(1);
}

