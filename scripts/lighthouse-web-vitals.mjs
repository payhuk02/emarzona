#!/usr/bin/env node
/**
 * Audit Lighthouse (performance) sur Marketplace + Checkout.
 * Prérequis: npm run build && npx lighthouse (téléchargé à la volée)
 *
 * Usage:
 *   node scripts/lighthouse-web-vitals.mjs
 *   node scripts/lighthouse-web-vitals.mjs --url=http://localhost:4173
 */
import { spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const baseUrl =
  process.argv.find(a => a.startsWith('--url='))?.split('=')[1] ||
  process.env.LIGHTHOUSE_BASE_URL ||
  'http://localhost:4173';

const routes = [
  { path: '/marketplace', name: 'marketplace' },
  { path: '/checkout', name: 'checkout' },
];

const reportsDir = resolve(process.cwd(), 'reports/lighthouse');
const thresholds = {
  performance: 0.5,
  'largest-contentful-paint': 4000,
  'total-blocking-time': 600,
  'cumulative-layout-shift': 0.15,
};

function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
    child.on('close', code => (code === 0 ? resolvePromise() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

function runCapture(cmd, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { shell: true });
    let out = '';
    child.stdout?.on('data', d => { out += d; });
    child.stderr?.on('data', d => { out += d; });
    child.on('close', code =>
      code === 0 ? resolvePromise(out) : reject(new Error(out || `${cmd} failed`))
    );
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

  console.log(`\n🔍 Lighthouse → ${url}`);

  await run(
    'npx',
    [
      '--yes',
      'lighthouse',
      url,
      '--only-categories=performance',
      '--form-factor=mobile',
      '--screenEmulation.mobile=true',
      '--throttling.cpuSlowdownMultiplier=4',
      '--output=json',
      `--output-path=${outPath}`,
      '--quiet',
      '--chrome-flags=--headless --no-sandbox --disable-gpu',
    ],
    { env: process.env }
  );

  const raw = await import('fs').then(fs => fs.readFileSync(outPath, 'utf-8'));
  const report = JSON.parse(raw);
  const audits = report.audits || {};
  const perfScore = report.categories?.performance?.score ?? 0;

  const metrics = {
    performance: perfScore,
    lcp: audits['largest-contentful-paint']?.numericValue,
    tbt: audits['total-blocking-time']?.numericValue,
    cls: audits['cumulative-layout-shift']?.numericValue,
  };

  const failures = [];
  if (perfScore < thresholds.performance) {
    failures.push(`performance score ${(perfScore * 100).toFixed(0)} < ${thresholds.performance * 100}`);
  }
  if (metrics.lcp > thresholds['largest-contentful-paint']) {
    failures.push(`LCP ${Math.round(metrics.lcp)}ms > ${thresholds['largest-contentful-paint']}ms`);
  }
  if (metrics.tbt > thresholds['total-blocking-time']) {
    failures.push(`TBT ${Math.round(metrics.tbt)}ms > ${thresholds['total-blocking-time']}ms`);
  }
  if (metrics.cls > thresholds['cumulative-layout-shift']) {
    failures.push(`CLS ${metrics.cls?.toFixed(3)} > ${thresholds['cumulative-layout-shift']}`);
  }

  return { route: route.name, url, metrics, failures, outPath };
}

async function main() {
  const distIndex = resolve(process.cwd(), 'dist/index.html');
  let previewProcess = null;

  if (!process.argv.some(a => a.startsWith('--url=')) && existsSync(distIndex)) {
    console.log('▶ Démarrage vite preview sur :4173…');
    previewProcess = spawn(
      'npx',
      ['vite', 'preview', '--port', '4173', '--strictPort'],
      { shell: true, stdio: 'ignore' }
    );
    await waitForServer('http://localhost:4173');
  } else if (!existsSync(distIndex)) {
    console.warn('⚠ dist/ absent — utilisez --url= pour cibler un environnement déployé.');
  }

  mkdirSync(reportsDir, { recursive: true });

  const results = [];
  for (const route of routes) {
    try {
      results.push(await auditRoute(route));
    } catch (err) {
      console.error(`❌ ${route.name}:`, err.message);
      results.push({ route: route.name, failures: [err.message] });
    }
  }

  if (previewProcess) previewProcess.kill();

  const summary = { generatedAt: new Date().toISOString(), baseUrl, results };
  writeFileSync(join(reportsDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('\n📊 Résumé\n');
  let hasFailure = false;
  for (const r of results) {
    if (r.metrics) {
      console.log(
        `  ${r.route}: perf ${(r.metrics.performance * 100).toFixed(0)} | LCP ${Math.round(r.metrics.lcp || 0)}ms | CLS ${(r.metrics.cls ?? 0).toFixed(3)}`
      );
    }
    if (r.failures?.length) {
      hasFailure = true;
      r.failures.forEach(f => console.error(`    ⚠ ${f}`));
    }
  }

  console.log(`\nRapports: ${reportsDir}\n`);
  if (hasFailure) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
