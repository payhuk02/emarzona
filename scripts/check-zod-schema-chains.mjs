#!/usr/bin/env node
/**
 * Gate CI — refuse Zod chains that crash at module load:
 *   z.string().min().refine(...).trim()  → ZodEffects has no .trim()
 *
 * Usage: node scripts/check-zod-schema-chains.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src/lib/validation', 'src/lib', 'src/schemas', 'src/types'];

/** Methods that exist on ZodString but NOT on ZodEffects (post-refine). */
const FORBIDDEN = new Set([
  'trim',
  'min',
  'max',
  'email',
  'url',
  'uuid',
  'regex',
  'length',
  'startsWith',
  'endsWith',
  'includes',
]);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, out);
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/** Find `.refine(` then balance parens; if next chained call is forbidden, report. */
function findViolations(content, file) {
  const hits = [];
  let i = 0;
  while (i < content.length) {
    const idx = content.indexOf('.refine', i);
    if (idx < 0) break;

    let j = idx + '.refine'.length;
    while (j < content.length && /\s/.test(content[j])) j++;
    if (content[j] !== '(') {
      i = idx + 1;
      continue;
    }

    // Balance parentheses from opening '(' of refine args
    let depth = 0;
    let k = j;
    for (; k < content.length; k++) {
      const ch = content[k];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          k++;
          break;
        }
      }
    }

    let n = k;
    while (n < content.length && /\s/.test(content[n])) n++;
    if (content[n] !== '.') {
      i = k;
      continue;
    }
    n++;
    const methodMatch = content.slice(n).match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    if (methodMatch && FORBIDDEN.has(methodMatch[1])) {
      const line = content.slice(0, idx).split('\n').length;
      hits.push({
        file: relative(ROOT, file).replace(/\\/g, '/'),
        line,
        method: methodMatch[1],
      });
    }
    i = k;
  }
  return hits;
}

const files = [];
for (const dir of SCAN_DIRS) {
  const abs = join(ROOT, dir);
  try {
    if (statSync(abs).isDirectory()) walk(abs, files);
  } catch {
    /* skip */
  }
}

const unique = [...new Set(files)];
const violations = unique.flatMap(file =>
  findViolations(stripComments(readFileSync(file, 'utf8')), file)
);

if (violations.length > 0) {
  console.error('\nZod schema chain violations (refine then string method):\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  .refine(...).${v.method}()`);
  }
  console.error(
    '\nFix: call string methods BEFORE .refine(), e.g. z.string().trim().min(n).refine(...)\n'
  );
  process.exit(1);
}

console.log(`OK — no refine→string-method anti-patterns in ${unique.length} files.`);
