#!/usr/bin/env node
/**
 * Gate CI Phase 3 : interdit les imports statiques de libs lourdes dans le shell app.
 * Usage: node scripts/check-shell-heavy-imports.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();

/** Packages qui doivent rester lazy-loaded (routes / composants dedies). */
const FORBIDDEN_PACKAGES = [
  'three',
  '@react-three/fiber',
  '@react-three/drei',
  'recharts',
  'jspdf',
  '@tiptap/',
  'framer-motion',
];

const SHELL_FILES = [
  'src/App.tsx',
  'src/main.tsx',
  'src/components/layout/AppPageShell.tsx',
  'src/components/layout/MainLayout.tsx',
];

const IMPORT_RE =
  /^\s*import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/gm;

function checkFile(relativePath) {
  const abs = resolve(ROOT, relativePath);
  if (!existsSync(abs)) {
    return { file: relativePath, violations: [] };
  }

  const content = readFileSync(abs, 'utf8');
  const violations = [];

  for (const match of content.matchAll(IMPORT_RE)) {
    const specifier = match[1];
    const hit = FORBIDDEN_PACKAGES.find(
      pkg => specifier === pkg || specifier.startsWith(`${pkg}/`)
    );
    if (hit) {
      violations.push({ specifier, blockedBy: hit });
    }
  }

  return { file: relativePath, violations };
}

let failed = false;

for (const file of SHELL_FILES) {
  const { violations } = checkFile(file);
  if (violations.length > 0) {
    failed = true;
    console.error(`\n${file}:`);
    for (const v of violations) {
      console.error(`  - import "${v.specifier}" (package lourd: ${v.blockedBy})`);
    }
  }
}

if (failed) {
  console.error(
    '\nEchec: les libs lourdes doivent etre importees via React.lazy() dans des routes/composants dedies, pas dans le shell.'
  );
  process.exit(1);
}

console.log(`OK — aucun import lourd dans ${SHELL_FILES.length} fichiers shell.`);
