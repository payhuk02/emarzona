/**
 * Télécharge les logos devises SVG (lissy93/currency-flags) vers public/landing/currencies/
 * Usage: node scripts/download-landing-currencies.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'landing', 'currencies');
const BASE =
  'https://raw.githubusercontent.com/lissy93/currency-flags/master/assets/flags_svg_square';

const CODES = [
  'xof',
  'xaf',
  'eur',
  'usd',
  'gbp',
  'ngn',
  'ghs',
  'kes',
  'zar',
  'ugx',
  'tzs',
  'rwf',
  'etb',
  'mad',
  'cad',
  'chf',
  'aed',
];

await mkdir(OUT_DIR, { recursive: true });

for (const code of CODES) {
  const url = `${BASE}/${code}.svg`;
  const res = await fetch(url);
  if (!res.ok) {
    const fallbacks = { xaf: 'cm', rwf: 'rw', etb: 'et' };
    const flag = fallbacks[code];
    if (flag) {
      const flagRes = await fetch(`https://flagcdn.com/${flag}.svg`);
      if (flagRes.ok) {
        await writeFile(join(OUT_DIR, `${code}.svg`), await flagRes.text(), 'utf8');
        console.log(`OK ${code}.svg (fallback ${flag})`);
        continue;
      }
    }
    console.error(`Failed ${code}: ${res.status}`);
    continue;
  }
  const svg = await res.text();
  await writeFile(join(OUT_DIR, `${code}.svg`), svg, 'utf8');
  console.log(`OK ${code}.svg`);
}

console.log(`Done — ${CODES.length} currencies in public/landing/currencies/`);
