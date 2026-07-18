#!/usr/bin/env node
/**
 * Vérifie les budgets de taille du bundle après `npm run build`.
 * Usage: node scripts/check-bundle-budget.mjs [--dist=./dist]
 */
import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const distDir = resolve(
  process.cwd(),
  process.argv.find(a => a.startsWith('--dist='))?.split('=')[1] || 'dist/js'
);

/** @type {{ test: (name: string, kb: number) => boolean, maxKb: number, label: string }[]} */
const BUDGETS = [
  {
    label: 'app-core (index-*.js, > 40 KB)',
    test: (name, kb) =>
      /^index-[A-Za-z0-9_-]+\.js$/.test(name) && !name.startsWith('index.es') && kb > 40,
    maxKb: 305,
  },
  {
    label: 'entry-script (index-*.js, <= 40 KB)',
    test: (name, kb) =>
      /^index-[A-Za-z0-9_-]+\.js$/.test(name) && !name.startsWith('index.es') && kb <= 40,
    maxKb: 50,
  },
  { label: 'vendor-react', test: name => name.startsWith('vendor-react-'), maxKb: 180 },
  { label: 'vendor-supabase', test: name => name.startsWith('vendor-supabase-'), maxKb: 220 },
  { label: 'vendor-radix', test: name => name.startsWith('vendor-radix-'), maxKb: 200 },
  // Chunk lazy — non chargé sur marketplace/checkout ; taille recharts ~490 KB minifié
  { label: 'charts (recharts, lazy)', test: name => name.startsWith('charts-'), maxKb: 520 },
  { label: 'pdf (jspdf)', test: name => name.startsWith('pdf-'), maxKb: 450 },
  { label: 'data-processing', test: name => name.startsWith('data-processing-'), maxKb: 500 },
  { label: 'three (3D)', test: name => name.startsWith('three-'), maxKb: 1000 },
  {
    label: 'Artwork3DViewer (lazy shell)',
    test: name => name.startsWith('Artwork3DViewer-'),
    maxKb: 20,
  },
];

let files;
try {
  files = readdirSync(distDir).filter(f => f.endsWith('.js') && !f.endsWith('.br.js'));
} catch {
  console.error(`❌ Dossier introuvable: ${distDir}. Lancez d'abord: npm run build`);
  process.exit(1);
}

const sizes = files.map(name => {
  const bytes = statSync(join(distDir, name)).size;
  return { name, kb: Math.round((bytes / 1024) * 10) / 10 };
});

const violations = [];

for (const budget of BUDGETS) {
  const matched = sizes.filter(f => budget.test(f.name, f.kb));
  for (const file of matched) {
    if (file.kb > budget.maxKb) {
      violations.push({ ...file, budget: budget.label, maxKb: budget.maxKb });
    }
  }
}

console.log('\n📦 Bundle budget report\n');
for (const { name, kb } of sizes.sort((a, b) => b.kb - a.kb).slice(0, 15)) {
  const budget = BUDGETS.find(b => b.test(name, kb));
  const limit = budget ? ` (max ${budget.maxKb} KB)` : '';
  console.log(`  ${name.padEnd(42)} ${String(kb).padStart(7)} KB${limit}`);
}

if (violations.length > 0) {
  console.error('\n❌ Budget dépassé:\n');
  for (const v of violations) {
    console.error(`  • ${v.name}: ${v.kb} KB > ${v.maxKb} KB [${v.budget}]`);
  }
  process.exit(1);
}

console.log('\n✅ Tous les budgets respectés.\n');
