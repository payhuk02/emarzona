import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const reportPath = `${__dirname}/../docs/audit-aria-labels-report.json`;

const report = JSON.parse(readFileSync(reportPath, 'utf-8'));

// Grouper les boutons icon-only par fichier
const byFile = {};
report.critical.forEach(item => {
  const file = item.file.replace(/\\/g, '/').replace(/.*\/src\//, 'src/');
  if (!byFile[file]) {
    byFile[file] = [];
  }
  byFile[file].push(item);
});

// Trier par nombre de boutons
const sortedFiles = Object.entries(byFile)
  .map(([file, items]) => ({ file, count: items.length, items }))
  .sort((a, b) => b.count - a.count);

console.log('📊 Top 20 fichiers avec le plus de boutons icon-only:\n');
console.log('─'.repeat(80));
sortedFiles.slice(0, 20).forEach((item, index) => {
  console.log(`${(index + 1).toString().padStart(2)}. ${item.file.padEnd(60)} ${item.count.toString().padStart(3)} bouton(s)`);
});
console.log('─'.repeat(80));
console.log(`\nTotal: ${report.critical.length} boutons icon-only à corriger`);
console.log(`Fichiers concernés: ${sortedFiles.length}\n`);

// Exporter les top 10 pour correction prioritaire
const top10 = sortedFiles.slice(0, 10);
console.log('🎯 Top 10 fichiers prioritaires pour correction:\n');
top10.forEach((item, index) => {
  console.log(`${index + 1}. ${item.file} (${item.count} boutons)`);
});

