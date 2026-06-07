#!/usr/bin/env node
/**
 * Migrate MainLayout → AppPageShell in page and layout wrapper files.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(full, acc);
    } else if (/\.tsx?$/.test(entry) && !full.includes('MainLayout.tsx')) {
      acc.push(full);
    }
  }
  return acc;
}

const files = walk('src');

const importPatterns = [
  [/import\s+\{\s*MainLayout\s*\}\s+from\s+['"]@\/components\/layout\/MainLayout['"]/g, "import { AppPageShell } from '@/components/layout/AppPageShell'"],
  [/import\s+\{\s*MainLayout\s*\}\s+from\s+['"]@\/components\/layout['"]/g, "import { AppPageShell } from '@/components/layout/AppPageShell'"],
];

let changed = 0;
for (const file of files) {
  let content = readFileSync(file, 'utf8');
  if (!content.includes('MainLayout')) continue;

  const original = content;
  for (const [pattern, replacement] of importPatterns) {
    content = content.replace(pattern, replacement);
  }
  content = content.replace(/<MainLayout\b/g, '<AppPageShell');
  content = content.replace(/<\/MainLayout>/g, '</AppPageShell>');

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    console.log('updated', file);
    changed++;
  }
}

console.log(`\n✅ ${changed} file(s) migrated`);
