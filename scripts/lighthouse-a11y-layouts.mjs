#!/usr/bin/env node
/**
 * Audit Lighthouse accessibilité — pages MainLayout et AppPageShell.
 *
 * Avec E2E_TEST_EMAIL + E2E_TEST_PASSWORD : session authentifiée via Playwright
 * (skip-link, topnav et landmarks sur les vrais layouts dashboard).
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

const DEBUGGING_PORT = Number(process.env.LH_DEBUG_PORT ?? 9222);

/** MainLayout (context sidebar) + AppPageShell (standalone shell) */
const routes = [
  { path: '/dashboard/products', name: 'main-layout-products', layout: 'MainLayout', requiresAuth: true },
  { path: '/dashboard', name: 'app-page-shell-dashboard', layout: 'AppPageShell', requiresAuth: true },
];

const reportsDir = resolve(process.cwd(), 'reports/lighthouse-a11y');
const minAccessibilityScore = Number(process.env.LH_A11Y_MIN ?? 0.85);
const requireAuth = process.env.LH_REQUIRE_AUTH === '1';

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

/**
 * Lance Chromium avec port de debug et prépare localStorage (cookies RGPD + auth optionnelle).
 */
async function createBrowserContext() {
  const { chromium } = await import('@playwright/test');

  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${DEBUGGING_PORT}`, '--no-sandbox'],
  });

  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('cookieConsentGiven', 'true');
  });

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  const hasAuth = Boolean(email && password);

  if (hasAuth) {
    console.log('🔐 Authentification E2E pour audit a11y…');
    const page = await context.newPage();
    await page.goto(`${baseUrl.replace(/\/$/, '')}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    console.log('   ✓ Session active');
    await page.close();
  } else {
    console.warn('⚠️  E2E_TEST_EMAIL/PASSWORD absents — audit sur pages publiques (redirection login)');
    if (requireAuth) {
      await browser.close();
      throw new Error('LH_REQUIRE_AUTH=1 mais identifiants E2E manquants');
    }
  }

  return { browser, context, hasAuth };
}

async function auditRoute(route, hasAuth) {
  const url = `${baseUrl.replace(/\/$/, '')}${route.path}`;
  const outPath = join(reportsDir, `${route.name}.json`);

  console.log(`\n♿ Lighthouse a11y [${route.layout}] → ${url}`);

  await runCapture('npx', [
    '--yes',
    'lighthouse',
    url,
    '--only-categories=accessibility',
    '--preset=desktop',
    '--quiet',
    `--port=${DEBUGGING_PORT}`,
    '--chrome-flags=--headless=new --no-sandbox',
    `--output=json`,
    `--output-path=${outPath}`,
  ]);

  const report = JSON.parse(readFileSync(outPath, 'utf8'));
  const score = report.categories.accessibility.score;
  const audits = report.audits;
  const displayedUrl = report.finalDisplayedUrl ?? url;
  const redirectedToLogin = /\/(login|auth)/.test(displayedUrl);

  const summary = {
    route: route.path,
    layout: route.layout,
    score,
    displayedUrl,
    authenticated: hasAuth && !redirectedToLogin,
    skipLink: audits['skip-link']?.score ?? null,
    mainLandmark: audits['landmark-one-main']?.score ?? null,
    ariaValid: audits['aria-valid-attr']?.score ?? null,
    colorContrast: audits['color-contrast']?.score ?? null,
  };

  console.log(`   Score: ${(score * 100).toFixed(0)}/100`);
  console.log(`   URL affichée: ${displayedUrl}`);
  console.log(`   skip-link: ${summary.skipLink === 1 ? '✓' : summary.skipLink ?? 'N/A'}`);
  console.log(`   landmark-one-main: ${summary.mainLandmark === 1 ? '✓' : summary.mainLandmark}`);
  console.log(`   color-contrast: ${summary.colorContrast === 1 ? '✓' : summary.colorContrast}`);

  if (route.requiresAuth && hasAuth && redirectedToLogin) {
    throw new Error(`Route ${route.path} redirigée vers login malgré l'authentification`);
  }

  if (route.requiresAuth && hasAuth && summary.skipLink !== 1) {
    const msg = `skip-link non validé sur ${route.path} (score: ${summary.skipLink})`;
    if (requireAuth) {
      throw new Error(msg);
    }
    console.warn(`   ⚠️  ${msg}`);
  }

  return summary;
}

async function main() {
  mkdirSync(reportsDir, { recursive: true });
  await waitForServer(baseUrl);

  const { browser, hasAuth } = await createBrowserContext();

  try {
    const results = [];
    const routesToAudit = hasAuth
      ? routes
      : [
          ...routes,
          { path: '/login', name: 'auth-login', layout: 'Auth', requiresAuth: false },
        ];

    for (const route of routesToAudit) {
      results.push(await auditRoute(route, hasAuth));
    }

    writeFileSync(join(reportsDir, 'summary.json'), JSON.stringify(results, null, 2));

    const failed = results.filter(r => r.score < minAccessibilityScore);
    if (failed.length) {
      console.error(`\n❌ ${failed.length} route(s) sous le seuil a11y (${minAccessibilityScore * 100})`);
      failed.forEach(r => console.error(`   - ${r.route}: ${(r.score * 100).toFixed(0)}/100`));
      process.exit(1);
    }

    const contrastFailed = results.filter(r => r.colorContrast !== 1);
    if (contrastFailed.length) {
      console.error(`\n❌ Contraste insuffisant sur ${contrastFailed.length} route(s)`);
      contrastFailed.forEach(r => console.error(`   - ${r.route}`));
      process.exit(1);
    }

    console.log(`\n✅ Accessibilité OK (seuil ${minAccessibilityScore * 100})`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
