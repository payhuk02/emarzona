#!/usr/bin/env node
/**
 * Vérifie que les clés Supabase front ne sont pas des JWT legacy (eyJ...).
 * Usage: node scripts/verify-supabase-publishable-key.mjs
 * Charge .env.local si présent (via dotenv optionnel) — sinon process.env uniquement.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function parseEnvAssignments(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  const assignments = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    assignments.push({ file: filename, key, value });
    if (!process.env[key]) process.env[key] = value;
  }
  return assignments;
}

const allAssignments = [
  ...parseEnvAssignments('.env.local'),
  ...parseEnvAssignments('.env'),
];

const anonAssignments = allAssignments.filter(
  a => a.key === 'VITE_SUPABASE_ANON_KEY' || a.key === 'VITE_SUPABASE_PUBLISHABLE_KEY'
);

const url = process.env.VITE_SUPABASE_URL || '';
const key =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

let failed = false;

if (!url) {
  console.warn('[warn] VITE_SUPABASE_URL manquant');
}

const anonByFile = {};
for (const a of anonAssignments) {
  if (!anonByFile[a.file]) anonByFile[a.file] = [];
  anonByFile[a.file].push(a);
}
for (const [file, rows] of Object.entries(anonByFile)) {
  if (rows.length > 1) {
    console.error(
      `[fail] ${file} : ${rows.length} définitions VITE_SUPABASE_ANON_KEY — Vite garde la **dernière** (souvent eyJ legacy). Ne garder qu'une seule ligne sb_publishable_...`
    );
    failed = true;
  }
}

for (const a of anonAssignments) {
  if (a.value.startsWith('eyJ')) {
    console.error(
      `[fail] ${a.file} : clé JWT legacy (eyJ...) pour ${a.key}. Remplacer par sb_publishable_...`
    );
    failed = true;
  }
}

if (!key) {
  console.error('[fail] Aucune clé : définir VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY');
  failed = true;
} else if (!failed && !key.startsWith('sb_publishable_')) {
  console.warn(
    `[warn] Format inattendu (attendu sb_publishable_...). Préfixe actuel : ${key.slice(0, 12)}...`
  );
} else if (!failed) {
  console.log('[ok] Clé publishable Supabase (sb_publishable_...)');
}

if (failed) process.exit(1);
console.log('[ok] Vérification clés front terminée');
