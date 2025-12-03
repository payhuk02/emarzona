/**
 * Script d'analyse des pages pour identifier les problèmes de responsivité
 * Recherche les patterns de texte non-responsive
 */

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../src/pages');
const results = [];

// Patterns à rechercher
const patterns = [
  {
    name: 'Titres fixes (text-lg, text-xl, text-2xl, etc.)',
    regex: /className="[^"]*text-(lg|xl|2xl|3xl|4xl|5xl|6xl)(?!\s+sm:|md:|lg:)/g,
  },
  {
    name: 'Textes sans breakpoints',
    regex: /className="[^"]*text-(base|sm|md|lg|xl)(?!\s+sm:|md:|lg:)/g,
  },
  {
    name: 'Paddings fixes (p-6, p-8, etc.)',
    regex: /className="[^"]*p-(6|8|10|12)(?!\s+sm:|md:|lg:)/g,
  },
  {
    name: 'Gaps fixes (gap-6, gap-8, etc.)',
    regex: /className="[^"]*gap-(6|8|10|12)(?!\s+sm:|md:|lg:)/g,
  },
];

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(pagesDir, filePath);
  const issues = [];

  patterns.forEach((pattern) => {
    const matches = content.match(pattern.regex);
    if (matches) {
      issues.push({
        pattern: pattern.name,
        count: matches.length,
        examples: matches.slice(0, 3),
      });
    }
  });

  if (issues.length > 0) {
    results.push({
      file: relativePath,
      issues,
    });
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      analyzeFile(filePath);
    }
  });
}

console.log('🔍 Analyse des pages pour problèmes de responsivité...\n');
walkDir(pagesDir);

console.log(`📊 Résultats: ${results.length} fichiers avec problèmes potentiels\n`);

results.forEach((result) => {
  console.log(`📄 ${result.file}`);
  result.issues.forEach((issue) => {
    console.log(`  - ${issue.pattern}: ${issue.count} occurrence(s)`);
    if (issue.examples.length > 0) {
      console.log(`    Exemples: ${issue.examples.slice(0, 2).join(', ')}`);
    }
  });
  console.log('');
});

// Générer un rapport JSON
const reportPath = path.join(__dirname, '../docs/audits/ANALYSE_RESPONSIVITE_PAGES.json');
fs.writeFileSync(
  reportPath,
  JSON.stringify(results, null, 2),
  'utf-8'
);

console.log(`\n✅ Rapport généré: ${reportPath}`);

