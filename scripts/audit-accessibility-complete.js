/**
 * Audit d'accessibilité complet
 * Identifie : images sans alt, inputs sans labels, liens sans texte, focus visible, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const issues = {
  imagesWithoutAlt: [],
  inputsWithoutLabel: [],
  linksWithoutText: [],
  buttonsWithoutAriaLabel: [],
  missingFocusStyles: [],
  missingSkipLinks: [],
  missingLandmarks: [],
};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      analyzeFile(filePath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(srcDir, filePath);
  const lines = content.split('\n');
  
  // Analyser les images sans alt
  lines.forEach((line, index) => {
    // Images sans alt ou avec alt vide
    if (line.includes('<img') || line.includes('<Image')) {
      const hasAlt = /alt\s*=\s*["']([^"']+)["']/.test(line) || /alt\s*=\s*\{[^}]+\}/.test(line);
      if (!hasAlt || /alt\s*=\s*["']\s*["']/.test(line)) {
        issues.imagesWithoutAlt.push({
          file: relativePath,
          line: index + 1,
          content: line.trim(),
        });
      }
    }
    
    // Inputs sans label associé
    if (line.includes('<input') || line.includes('<Input')) {
      const hasId = /id\s*=\s*["']([^"']+)["']/.test(line) || /id\s*=\s*\{[^}]+\}/.test(line);
      const hasAriaLabel = /aria-label\s*=\s*["']([^"']+)["']/.test(line) || /aria-label\s*=\s*\{[^}]+\}/.test(line);
      const hasPlaceholder = /placeholder\s*=\s*["']([^"']+)["']/.test(line) || /placeholder\s*=\s*\{[^}]+\}/.test(line);
      
      // Vérifier si un label existe dans les lignes suivantes (contexte limité)
      const nextLines = lines.slice(index, Math.min(index + 10, lines.length)).join('\n');
      const hasLabel = /<label[^>]*for\s*=\s*["']([^"']+)["']/.test(nextLines) || 
                       /<Label[^>]*htmlFor\s*=\s*["']([^"']+)["']/.test(nextLines);
      
      if (!hasId && !hasAriaLabel && !hasPlaceholder && !hasLabel) {
        // Ignorer les inputs de type hidden
        if (!/type\s*=\s*["']hidden["']/.test(line)) {
          issues.inputsWithoutLabel.push({
            file: relativePath,
            line: index + 1,
            content: line.trim(),
          });
        }
      }
    }
    
    // Liens sans texte accessible
    if (line.includes('<a href') || line.includes('<Link to')) {
      const hasText = />[^<]+</.test(line) || /children/.test(line);
      const hasAriaLabel = /aria-label\s*=\s*["']([^"']+)["']/.test(line) || /aria-label\s*=\s*\{[^}]+\}/.test(line);
      const hasTitle = /title\s*=\s*["']([^"']+)["']/.test(line) || /title\s*=\s*\{[^}]+\}/.test(line);
      
      // Vérifier les lignes suivantes pour le texte
      const nextLines = lines.slice(index, Math.min(index + 5, lines.length)).join('\n');
      const hasTextInNextLines = />[^<]+</.test(nextLines);
      
      if (!hasText && !hasTextInNextLines && !hasAriaLabel && !hasTitle) {
        issues.linksWithoutText.push({
          file: relativePath,
          line: index + 1,
          content: line.trim(),
        });
      }
    }
    
    // Vérifier les styles de focus
    if (line.includes('outline-none') || line.includes('outline: none')) {
      const hasFocusVisible = /focus:outline|focus-visible:outline|focus:ring/.test(content);
      if (!hasFocusVisible) {
        issues.missingFocusStyles.push({
          file: relativePath,
          line: index + 1,
          content: line.trim(),
        });
      }
    }
  });
  
  // Vérifier les landmarks
  if (content.includes('return') && !content.includes('<main') && !content.includes('role="main"')) {
    // Vérifier si c'est une page principale
    if (filePath.includes('/pages/') || filePath.includes('/Page')) {
      issues.missingLandmarks.push({
        file: relativePath,
        reason: 'Missing main landmark',
      });
    }
  }
}

// Scanner le répertoire src
scanDirectory(srcDir);

// Générer le rapport
const report = {
  summary: {
    totalImagesWithoutAlt: issues.imagesWithoutAlt.length,
    totalInputsWithoutLabel: issues.inputsWithoutLabel.length,
    totalLinksWithoutText: issues.linksWithoutText.length,
    totalMissingFocusStyles: issues.missingFocusStyles.length,
    totalMissingLandmarks: issues.missingLandmarks.length,
  },
  details: issues,
};

// Sauvegarder le rapport
const reportPath = path.join(__dirname, '../docs/audit-accessibility-complete.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// Afficher le résumé
console.log('\n📊 AUDIT D\'ACCESSIBILITÉ COMPLET\n');
console.log('Résumé:');
console.log(`  - Images sans alt: ${issues.imagesWithoutAlt.length}`);
console.log(`  - Inputs sans label: ${issues.inputsWithoutLabel.length}`);
console.log(`  - Liens sans texte: ${issues.linksWithoutText.length}`);
console.log(`  - Styles de focus manquants: ${issues.missingFocusStyles.length}`);
console.log(`  - Landmarks manquants: ${issues.missingLandmarks.length}`);
console.log(`\n✅ Rapport sauvegardé: ${reportPath}\n`);

// Afficher les 10 premiers problèmes de chaque catégorie
if (issues.imagesWithoutAlt.length > 0) {
  console.log('\n🖼️  Images sans alt (premiers 10):');
  issues.imagesWithoutAlt.slice(0, 10).forEach(issue => {
    console.log(`  - ${issue.file}:${issue.line}`);
  });
}

if (issues.inputsWithoutLabel.length > 0) {
  console.log('\n📝 Inputs sans label (premiers 10):');
  issues.inputsWithoutLabel.slice(0, 10).forEach(issue => {
    console.log(`  - ${issue.file}:${issue.line}`);
  });
}

if (issues.linksWithoutText.length > 0) {
  console.log('\n🔗 Liens sans texte (premiers 10):');
  issues.linksWithoutText.slice(0, 10).forEach(issue => {
    console.log(`  - ${issue.file}:${issue.line}`);
  });
}

