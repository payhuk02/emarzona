#!/usr/bin/env node
/**
 * Audit Lighthouse accessibilité — pages MainLayout et AppPageShell.
 *
 * Usage:
 *   npm run build && npm run preview &
 *   node scripts/lighthouse-a11y-layouts.mjs
 *   node scripts/lighthouse-a11y-layouts.mjs --url=http://localhost:4173
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const baseUrl =
  process.argv.find(a => a.startsWith('--url='))?.split('=')[1] ||
  process.env.LIGHTHOUSE_BASE_URL ||
  'http://localhost:4173';

/** MainLayout (context sidebar) + AppPageShell (standalone shell) */
const routes = [
  { path: '/dashboard/products', name: 'main-layout-products', layout: 'MainLayout' },
  { path: '/dashboard', name: 'app-page-shell-dashboard', layout: 'AppPageShell' },
];

const reportsDir = resolve(process.cwd(), 'reports/lighthouse-a11y');
const minAccessibilityScore = Number(process.env.LH_A11Y_MIN ?? 0.85);

function runCapture(cmd, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { shell: true });
    let out = '';
    child.stdout?.on('data', d => {
      out += d;
    });
    child.stderr?.on('data', d => {
      out += d;
    });
    child.on('close', code => (code === 0 ? resolvePromise(out) : reject(new Error(out || `${cmd} failed`))));
  });
}

async function waitForServer(url, attempts = 30) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status === 404) return;
    } catch {
      /* retry */
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Serveur inaccessible: ${url}`);
}

async function auditRoute(route) {
  const url = `${baseUrl.replace(/\/$/, '')}${route.path}`;
  const outPath = join(reportsDir, `${route.name}.json`);

  console.log(`\n♿ Lighthouse a11y [${route.layout}] → ${url}`);

  await runCapture('npx', [
    '--yes',
    'lighthouse',
    url,
    '--only-categories=accessibility',
    '--form-factor=desktop',
    '--quiet',
    '--chrome-flags=--headless',
    `--output=json`,
    `--output-path=${outPath}`,
  ]);

  const report = JSON.parse(readFileSync(outPath, 'utf8'));
  const score = report.categories.accessibility.score;
  const audits = report.audits;

  const summary = {
    route: route.path,
    layout: route.layout,
    score,
    skipLink: audits['skip-link']?.score ?? null,
    mainLandmark: audits['landmark-one-main']?.score ?? null,
    ariaValid: audits['aria-valid-attr']?.score ?? null,
    colorContrast: audits['color-contrast']?.score ?? null,
  };

  console.log(`   Score: ${(score * 100).toFixed(0)}/100`);
  console.log(`   skip-link: ${summary.skipLink === 1 ? '✓' : summary.skipLink}`);
  console.log(`   landmark-one-main: ${summary.mainLandmark === 1 ? '✓' : summary.mainLandmark}`);

  return summary;
}

async function main() {
  mkdirSync(reportsDir, { recursive: true });
  await waitForServer(baseUrl);

  const results = [];
  for (const route of routes) {
    results.push(await auditRoute(route));
  }

  writeFileSync(join(reportsDir, 'summary.json'), JSON.stringify(results, null, 2));

  const failed = results.filter(r => r.score < minAccessibilityScore);
  if (failed.length) {
    console.error(`\n❌ ${failed.length} route(s) sous le seuil a11y (${minAccessibilityScore * 100})`);
    failed.forEach(r => console.error(`   - ${r.route}: ${(r.score * 100).toFixed(0)}/100`));
    process.exit(1);
  }

  console.log(`\n✅ Accessibilité OK (seuil ${minAccessibilityScore * 100})`);
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
