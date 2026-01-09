/**
 * Script pour vérifier la couverture de tests
 * Échoue si la couverture est en dessous des seuils définis dans vitest.config.ts
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COVERAGE_THRESHOLDS = {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
};

try {
  // Lire le rapport de couverture JSON généré par Vitest
  const coveragePath = join(__dirname, '..', 'coverage', 'coverage-summary.json');
  const coverage = JSON.parse(readFileSync(coveragePath, 'utf-8'));

  // Calculer les totaux globaux
  const totals = coverage.total || {};
  const metrics = {
    lines: totals.lines?.pct || 0,
    functions: totals.functions?.pct || 0,
    branches: totals.branches?.pct || 0,
    statements: totals.statements?.pct || 0,
  };

  console.log('\n📊 Coverage Summary:');
  console.log(`  Lines:      ${metrics.lines.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLDS.lines}%)`);
  console.log(`  Functions:  ${metrics.functions.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLDS.functions}%)`);
  console.log(`  Branches:   ${metrics.branches.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLDS.branches}%)`);
  console.log(`  Statements: ${metrics.statements.toFixed(2)}% (threshold: ${COVERAGE_THRESHOLDS.statements}%)\n`);

  // Vérifier les seuils
  const failures = [];
  if (metrics.lines < COVERAGE_THRESHOLDS.lines) {
    failures.push(`Lines coverage ${metrics.lines.toFixed(2)}% is below threshold ${COVERAGE_THRESHOLDS.lines}%`);
  }
  if (metrics.functions < COVERAGE_THRESHOLDS.functions) {
    failures.push(`Functions coverage ${metrics.functions.toFixed(2)}% is below threshold ${COVERAGE_THRESHOLDS.functions}%`);
  }
  if (metrics.branches < COVERAGE_THRESHOLDS.branches) {
    failures.push(`Branches coverage ${metrics.branches.toFixed(2)}% is below threshold ${COVERAGE_THRESHOLDS.branches}%`);
  }
  if (metrics.statements < COVERAGE_THRESHOLDS.statements) {
    failures.push(`Statements coverage ${metrics.statements.toFixed(2)}% is below threshold ${COVERAGE_THRESHOLDS.statements}%`);
  }

  if (failures.length > 0) {
    console.error('❌ Coverage thresholds not met:\n');
    failures.forEach(failure => console.error(`  - ${failure}`));
    console.error('\n💡 To improve coverage:');
    console.error('  1. Add tests for uncovered code');
    console.error('  2. Run: npm run test:coverage');
    console.error('  3. Check coverage/index.html for details\n');
    process.exit(1);
  }

  console.log('✅ All coverage thresholds met!\n');
  process.exit(0);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('❌ Coverage report not found. Run: npm run test:coverage');
    process.exit(1);
  }
  console.error('❌ Error checking coverage:', error.message);
  process.exit(1);
}
