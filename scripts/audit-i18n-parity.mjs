#!/usr/bin/env node
/**
 * Phase 2 — Audit parité i18n FR vs EN (cible ≥ 98 %).
 * Usage: npm run audit:i18n-parity
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_PARITY = Number(process.env.I18N_MIN_PARITY ?? 98);

function load(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function flatKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flatKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

function get(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

const pairs = [
  ['src/i18n/locales/fr.json', 'src/i18n/locales/en.json', 'main'],
  ['src/i18n/locales/sidebar-fr.json', 'src/i18n/locales/sidebar-en.json', 'sidebar'],
];

const report = {
  ok: true,
  minParityPercent: MIN_PARITY,
  locales: {},
  missingSample: [],
  blockers: [],
};

let totalFr = 0;
let totalMissing = 0;

for (const [frRel, enRel, label] of pairs) {
  const fr = load(join(root, frRel));
  const en = load(join(root, enRel));
  const frKeys = flatKeys(fr);
  const missing = frKeys.filter(k => get(en, k) === undefined);
  totalFr += frKeys.length;
  totalMissing += missing.length;

  const parity = frKeys.length ? ((frKeys.length - missing.length) / frKeys.length) * 100 : 100;
  report.locales[label] = {
    frKeys: frKeys.length,
    missingInEn: missing.length,
    parityPercent: Math.round(parity * 100) / 100,
  };

  if (missing.length > 0 && report.missingSample.length < 15) {
    report.missingSample.push(...missing.slice(0, 15 - report.missingSample.length));
  }
}

const overallParity = totalFr ? ((totalFr - totalMissing) / totalFr) * 100 : 100;
report.overallParityPercent = Math.round(overallParity * 100) / 100;

if (overallParity < MIN_PARITY) {
  report.ok = false;
  report.blockers.push(
    `EN parity ${report.overallParityPercent}% < ${MIN_PARITY}% (${totalMissing} missing keys)`
  );
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
