#!/usr/bin/env node
/**
 * Phase 2.4 — Parité i18n checkout/account (ES, DE, PT vs FR).
 * Usage: npm run audit:i18n-checkout-locales
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_PARITY = Number(process.env.I18N_CHECKOUT_MIN_PARITY ?? 100);

/** Préfixes UI checkout + portail acheteur (Phase 2.4). */
const CHECKOUT_PREFIXES = [
  'checkout.',
  'cart.',
  'account.',
  'payment.',
  'shipping.',
  'orderSummary.',
  'giftCard.',
  'coupon.',
];

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

function isCheckoutKey(key) {
  return CHECKOUT_PREFIXES.some(p => key === p.slice(0, -1) || key.startsWith(p));
}

const fr = load(join(root, 'src/i18n/locales/fr.json'));
const frCheckoutKeys = flatKeys(fr).filter(isCheckoutKey);

const targets = [
  ['src/i18n/locales/es.json', 'es'],
  ['src/i18n/locales/de.json', 'de'],
  ['src/i18n/locales/pt.json', 'pt'],
];

const report = {
  ok: true,
  minParityPercent: MIN_PARITY,
  frCheckoutKeys: frCheckoutKeys.length,
  locales: {},
  missingSample: [],
  blockers: [],
};

for (const [rel, label] of targets) {
  const locale = load(join(root, rel));
  const missing = frCheckoutKeys.filter(k => get(locale, k) === undefined);
  const parity = frCheckoutKeys.length
    ? ((frCheckoutKeys.length - missing.length) / frCheckoutKeys.length) * 100
    : 100;

  report.locales[label] = {
    missingInLocale: missing.length,
    parityPercent: Math.round(parity * 100) / 100,
  };

  if (missing.length > 0 && report.missingSample.length < 12) {
    report.missingSample.push(...missing.slice(0, 12 - report.missingSample.length).map(k => `${label}:${k}`));
  }

  if (parity < MIN_PARITY) {
    report.ok = false;
    report.blockers.push(`${label} checkout parity ${Math.round(parity)}% < ${MIN_PARITY}%`);
  }
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
