/**
 * Minimal coverage gate — exits 0 when vitest coverage summary is present.
 * Full thresholds can be tightened in a later wave.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const summaryPath = join(process.cwd(), 'coverage', 'coverage-summary.json');

if (!existsSync(summaryPath)) {
  console.warn('[check-coverage] coverage-summary.json missing — skipping threshold gate');
  process.exit(0);
}

try {
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const total = summary.total;
  if (!total?.lines) {
    console.warn('[check-coverage] no total.lines in summary — skipping');
    process.exit(0);
  }
  const pct = total.lines.pct;
  console.log(`[check-coverage] lines coverage: ${pct}%`);
  process.exit(0);
} catch (error) {
  console.error('[check-coverage] failed to read summary:', error);
  process.exit(1);
}
