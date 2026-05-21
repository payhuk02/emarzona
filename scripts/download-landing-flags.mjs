/**
 * Télécharge les drapeaux SVG (flagcdn) vers public/landing/flags/
 * Usage: node scripts/download-landing-flags.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'landing', 'flags');

const CODES = [
  'bf', 'sn', 'ci', 'ml', 'bj', 'tg', 'ne', 'cm', 'gn', 'gh', 'ng', 'ma', 'tn', 'dz',
  'za', 'ke', 'rw', 'cd', 'ga', 'fr', 'be', 'ch', 'de', 'gb', 'es', 'it', 'pt', 'ca', 'us', 'ae',
];

await mkdir(OUT_DIR, { recursive: true });

for (const code of CODES) {
  const url = `https://flagcdn.com/${code}.svg`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed ${code}: ${res.status}`);
    continue;
  }
  const svg = await res.text();
  await writeFile(join(OUT_DIR, `${code}.svg`), svg, 'utf8');
  console.log(`OK ${code}.svg`);
}

console.log(`Done — ${CODES.length} flags in public/landing/flags/`);
