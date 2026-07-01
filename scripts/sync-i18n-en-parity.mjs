#!/usr/bin/env node
/**
 * Phase 2.3 — Applique le patch EN pour parité avec FR (clés manquantes uniquement).
 * Usage: npm run sync:i18n-en-parity
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const enPath = join(root, 'src', 'i18n', 'locales', 'en.json');
const patchPath = join(root, 'scripts', 'i18n-en-parity-patch.json');

function deepMergeMissing(target, patch) {
  let added = 0;
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      added += deepMergeMissing(target[key], value);
    } else if (target[key] === undefined) {
      target[key] = value;
      added += 1;
    }
  }
  return added;
}

const en = JSON.parse(readFileSync(enPath, 'utf8'));
const patch = JSON.parse(readFileSync(patchPath, 'utf8'));
const added = deepMergeMissing(en, patch);

writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, keysAdded: added, file: enPath }, null, 2));
process.exit(0);
