/**
 * Script de test Lighthouse pour mesurer les performances
 * Usage: node scripts/lighthouse-test.js [url]
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration Lighthouse
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: true,
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
    },
  },
};

// URLs à tester
const urls = [
  'http://localhost:8080',
  'http://localhost:8080/marketplace',
  'http://localhost:8080/stores/demo/products/demo-product',
];

async function runLighthouse(url, options = {}) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  options.port = chrome.port;

  try {
    const runnerResult = await lighthouse(url, options, config);

    // Extraire les métriques importantes
    const metrics = {
      url,
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
      seo: runnerResult.lhr.categories.seo.score * 100,
      // Core Web Vitals
      fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
      lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
      fid: runnerResult.lhr.audits['max-potential-fid'].numericValue,
      cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
      tti: runnerResult.lhr.audits['interactive'].numericValue,
      tbt: runnerResult.lhr.audits['total-blocking-time'].numericValue,
      speedIndex: runnerResult.lhr.audits['speed-index'].numericValue,
    };

    return {
      metrics,
      report: runnerResult.lhr,
    };
  } finally {
    await chrome.kill();
  }
}

async function generateReport() {
  console.log('🚀 Démarrage des tests Lighthouse...\n');

  const results = [];

  for (const url of urls) {
    console.log(`📊 Test de ${url}...`);
    try {
      const result = await runLighthouse(url);
      results.push(result.metrics);
      console.log(`✅ ${url}: Performance ${result.metrics.performance.toFixed(0)}/100\n`);
    } catch (error) {
      console.error(`❌ Erreur pour ${url}:`, error.message);
    }
  }

  // Générer le rapport
  const reportPath = path.join(__dirname, '../lighthouse-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  // Afficher le résumé
  console.log('\n📊 RÉSUMÉ DES TESTS\n');
  console.log('='.repeat(80));
  results.forEach((result) => {
    console.log(`\nURL: ${result.url}`);
    console.log(`Performance: ${result.performance.toFixed(0)}/100`);
    console.log(`Accessibility: ${result.accessibility.toFixed(0)}/100`);
    console.log(`Best Practices: ${result.bestPractices.toFixed(0)}/100`);
    console.log(`SEO: ${result.seo.toFixed(0)}/100`);
    console.log(`\nCore Web Vitals:`);
    console.log(`  FCP: ${result.fcp.toFixed(0)}ms`);
    console.log(`  LCP: ${result.lcp.toFixed(0)}ms`);
    console.log(`  FID: ${result.fid.toFixed(0)}ms`);
    console.log(`  CLS: ${result.cls.toFixed(3)}`);
    console.log(`  TTI: ${result.tti.toFixed(0)}ms`);
    console.log(`  TBT: ${result.tbt.toFixed(0)}ms`);
    console.log(`  Speed Index: ${result.speedIndex.toFixed(0)}ms`);
    console.log('-'.repeat(80));
  });

  console.log(`\n📄 Rapport complet sauvegardé dans: ${reportPath}`);
}

// Exécuter si appelé directement
if (require.main === module) {
  const url = process.argv[2];
  if (url) {
    runLighthouse(url).then((result) => {
      console.log(JSON.stringify(result.metrics, null, 2));
    });
  } else {
    generateReport();
  }
}

module.exports = { runLighthouse, generateReport };
