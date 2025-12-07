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
// Note: On cherche d'abord les balises ouvrantes, puis on analyse le contexte
const INTERACTIVE_PATTERNS = [
  { pattern: /<Button\s+/gi, type: 'button', component: 'Button', closingPattern: /<\/Button>/gi },
  { pattern: /<button\s+/gi, type: 'button', component: 'button', closingPattern: /<\/button>/gi },
  { pattern: /<a\s+[^>]*href\s*=/gi, type: 'link', component: 'a', closingPattern: /<\/a>/gi },
  { pattern: /<input\s+[^>]*type\s*=\s*["'](button|submit|reset|checkbox|radio)["']/gi, type: 'input', component: 'input', closingPattern: null },
];

// Patterns pour identifier les aria-labels existants
const ARIA_PATTERNS = [
  /aria-label\s*=\s*["'`][^"'`]*["'`]/gi,
  /aria-labelledby\s*=\s*["'`][^"'`]*["'`]/gi,
  /aria-describedby\s*=\s*["'`][^"'`]*["'`]/gi,
];

// Patterns pour identifier les boutons icon-only
const ICON_ONLY_PATTERNS = [
  /size\s*=\s*["']icon["']/gi,
  /size\s*=\s*["']sm["']/gi, // size="sm" avec seulement une icône
  /className\s*=\s*["'][^"']*icon[^"']*["']/gi,
];

/**
 * Extrait le contexte autour d'un élément (plusieurs lignes)
 */
function getElementContext(content, startIndex, maxLines = 15) {
  const lines = content.split('\n');
  const startLine = content.substring(0, startIndex).split('\n').length - 1;
  const endLine = Math.min(startLine + maxLines, lines.length);
  
  return lines.slice(startLine, endLine).join('\n');
}

/**
 * Trouve la balise fermante correspondante
 */
function findClosingTag(content, startIndex, tagName) {
  const isSelfClosing = /\/\s*>/.test(content.substring(startIndex, startIndex + 100));
  if (isSelfClosing) {
    return content.indexOf('>', startIndex) + 1;
  }
  
  let depth = 1;
  let i = startIndex;
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  
  while (i < content.length && depth > 0) {
    const nextOpen = content.indexOf(openTag, i);
    const nextClose = content.indexOf(closeTag, i);
    
    if (nextClose === -1) break;
    
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) {
        return nextClose + closeTag.length;
      }
      i = nextClose + closeTag.length;
    }
  }
  
  // Si on ne trouve pas la balise fermante, chercher juste la balise suivante
  return content.indexOf('>', startIndex) + 1;
}

/**
 * Vérifie si un élément a un aria-label dans son contexte
 */
function hasAriaLabelInContext(context) {
  // Chercher aria-label dans le contexte (peut être sur plusieurs lignes)
  // Patterns améliorés pour détecter aria-label même sur plusieurs lignes
  const ariaLabelPatterns = [
    /aria-label\s*=\s*["'`][^"'`]*["'`]/gi,
    /aria-label\s*=\s*\{[^}]*\}/gi, // aria-label={...} pour les expressions JSX
    /aria-labelledby\s*=\s*["'`][^"'`]*["'`]/gi,
    /aria-describedby\s*=\s*["'`][^"'`]*["'`]/gi,
  ];
  
  return ariaLabelPatterns.some(pattern => {
    const matches = context.match(pattern);
    return matches && matches.length > 0;
  });
}

/**
 * Vérifie si un bouton est icon-only
 */
function isIconOnlyButton(context, elementText) {
  // Vérifier les patterns icon-only explicites
  const hasIconOnlyPattern = ICON_ONLY_PATTERNS.some(pattern => {
    const matches = context.match(pattern);
    return matches && matches.length > 0;
  });
  
  // Si on a size="icon", c'est définitivement icon-only
  if (context.includes('size="icon"') || context.includes("size='icon'")) {
    return true;
  }
  
  // Si on a size="sm" mais pas de texte visible, vérifier plus en détail
  if (context.includes('size="sm"') || context.includes("size='sm'")) {
    // Extraire le contenu entre les balises ouvrantes et fermantes
    const buttonMatch = context.match(/<Button[\s\S]*?>/);
    const closingMatch = context.match(/<\/Button>/);
    
    if (buttonMatch && closingMatch) {
      const startIndex = buttonMatch.index + buttonMatch[0].length;
      const endIndex = closingMatch.index;
      const innerContent = context.substring(startIndex, endIndex);
      
      // Vérifier si le contenu ne contient que des composants d'icônes (pas de texte)
      // Les composants d'icônes sont généralement des composants React avec des noms en PascalCase
      const iconComponentPattern = /<[A-Z][a-zA-Z0-9]*\s*[^>]*\/>/g;
      const textPattern = /[a-zA-Z]{3,}/g;
      
      // Remplacer les composants d'icônes par des espaces
      const withoutIcons = innerContent.replace(iconComponentPattern, ' ').trim();
      
      // Si après avoir retiré les icônes, il ne reste que des espaces ou des caractères spéciaux
      // et qu'il n'y a pas de texte visible, c'est icon-only
      if (!textPattern.test(withoutIcons) || /^\s*$/.test(withoutIcons)) {
        return true;
      }
    }
  }
  
  // Pour les autres cas, vérifier si le contenu ne contient que des icônes
  const contentMatch = context.match(/>([\s\S]*?)<\//);
  if (contentMatch) {
    const innerContent = contentMatch[1];
    // Si le contenu est vide ou ne contient que des espaces, c'est probablement icon-only
    if (!innerContent.trim() || /^\s*$/.test(innerContent.trim())) {
      return true;
    }
    
    // Vérifier si le contenu ne contient que des composants d'icônes (pas de texte)
    const iconComponentPattern = /<[A-Z][a-zA-Z0-9]*\s*[^>]*\/>/g;
    const textPattern = /[a-zA-Z]{3,}/g;
    const withoutIcons = innerContent.replace(iconComponentPattern, ' ').trim();
    
    // Si après avoir retiré les icônes, il ne reste que des espaces, c'est icon-only
    if (!textPattern.test(withoutIcons) || /^\s*$/.test(withoutIcons)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Vérifie si un bouton a du texte visible
 */
function hasVisibleText(context) {
  // Extraire le contenu entre les balises
  const contentMatch = context.match(/>([\s\S]*?)<\//);
  if (contentMatch) {
    const innerContent = contentMatch[1];
    // Vérifier s'il y a du texte visible (plus de 2 caractères alphabétiques consécutifs)
    if (/[a-zA-Z]{3,}/.test(innerContent)) {
      // Ignorer les noms de composants React
      const reactComponentPattern = /<[A-Z][a-zA-Z0-9]*/g;
      const withoutComponents = innerContent.replace(reactComponentPattern, '');
      return /[a-zA-Z]{3,}/.test(withoutComponents);
    }
  }
  
  return false;
}

/**
 * Analyse un fichier pour trouver les éléments interactifs sans aria-label
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Trouver tous les éléments interactifs
  INTERACTIVE_PATTERNS.forEach(({ pattern, type, component }) => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const matchIndex = match.index;
      const matchText = match[0];
      const lineNumber = content.substring(0, matchIndex).split('\n').length;
      
      // Obtenir le contexte autour de l'élément (15 lignes)
      const context = getElementContext(content, matchIndex, 15);
      
      // Vérifier si l'élément a un aria-label dans son contexte
      const hasAriaLabel = hasAriaLabelInContext(context);
      
      // Pour les boutons, vérifier s'ils sont icon-only
      let isIconOnly = false;
      if (type === 'button') {
        isIconOnly = isIconOnlyButton(context, matchText);
      }
      
      // Vérifier si c'est un bouton avec du texte visible
      const hasText = hasVisibleText(context);
      
      // Ignorer les boutons avec du texte visible (pas besoin d'aria-label)
      // SAUF s'ils sont explicitement icon-only
      if (hasText && !isIconOnly) {
        continue;
      }
      
      // Pour les boutons icon-only, aria-label est obligatoire
      // Pour les autres éléments interactifs, vérifier s'ils ont besoin d'aria-label
      if (type === 'button' && isIconOnly && !hasAriaLabel) {
        issues.push({
          file: filePath,
          line: lineNumber,
          element: context.substring(0, 150).replace(/\n/g, ' '),
          type: 'button',
          isIconOnly: true,
        });
      } else if (type !== 'button' && !hasAriaLabel && !hasText) {
        // Pour les liens et inputs sans texte, aria-label est recommandé
        issues.push({
          file: filePath,
          line: lineNumber,
          element: context.substring(0, 150).replace(/\n/g, ' '),
          type: type,
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
    if (issue.type === 'button' && (issue.isIconOnly || issue.element.includes('icon') || issue.element.includes('size="icon"') || issue.element.includes("size='icon'"))) {
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

