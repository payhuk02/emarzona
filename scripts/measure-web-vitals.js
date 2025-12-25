/**
 * Script pour mesurer les Web Vitals avec Lighthouse
 * Date: 4 Janvier 2025
 * 
 * Usage:
 *   npm run measure:vitals
 *   npm run measure:vitals -- --url=http://localhost:8080
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_URL = 'http://localhost:8080';
const OUTPUT_DIR = path.join(__dirname, '../docs/audits/web-vitals');
const REPORT_FILE = path.join(OUTPUT_DIR, `lighthouse-report-${new Date().toISOString().split('T')[0]}.json`);

// Récupérer l'URL depuis les arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const url = urlArg ? urlArg.split('=')[1] : DEFAULT_URL;

console.log('🔍 Mesure des Web Vitals avec Lighthouse...');
console.log(`📍 URL: ${url}`);
console.log('');

// Créer le dossier de sortie si nécessaire
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

try {
  // Vérifier si Lighthouse est installé
  try {
    execSync('npx lighthouse --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Lighthouse n\'est pas installé. Installation...');
    execSync('npm install -g lighthouse', { stdio: 'inherit' });
  }

  // Exécuter Lighthouse
  console.log('⏳ Exécution de Lighthouse (cela peut prendre 1-2 minutes)...');
  const lighthouseCommand = `npx lighthouse "${url}" --output=json --output-path="${REPORT_FILE}" --chrome-flags="--headless --no-sandbox" --only-categories=performance --quiet`;
  
  execSync(lighthouseCommand, { stdio: 'inherit' });

  // Lire et analyser le rapport
  if (fs.existsSync(REPORT_FILE)) {
    const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
    const audits = report.audits;
    const categories = report.categories;

    // Extraire les métriques Web Vitals
    const metrics = {
      performance: categories.performance?.score ? Math.round(categories.performance.score * 100) : 0,
      fcp: audits['first-contentful-paint']?.numericValue ? Math.round(audits['first-contentful-paint'].numericValue) : 0,
      lcp: audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : 0,
      ttfb: audits['server-response-time']?.numericValue ? Math.round(audits['server-response-time'].numericValue) : 0,
      cls: audits['cumulative-layout-shift']?.numericValue ? audits['cumulative-layout-shift'].numericValue.toFixed(3) : '0.000',
      inp: audits['interaction-to-next-paint']?.numericValue ? Math.round(audits['interaction-to-next-paint'].numericValue) : 0,
      speedIndex: audits['speed-index']?.numericValue ? Math.round(audits['speed-index'].numericValue) : 0,
    };

    // Afficher les résultats
    console.log('');
    console.log('📊 RÉSULTATS WEB VITALS');
    console.log('='.repeat(50));
    console.log(`Performance Score: ${metrics.performance}/100`);
    console.log('');
    console.log('Core Web Vitals:');
    console.log(`  FCP (First Contentful Paint): ${metrics.fcp}ms ${metrics.fcp < 1800 ? '✅' : metrics.fcp < 3000 ? '🟡' : '❌'}`);
    console.log(`  LCP (Largest Contentful Paint): ${metrics.lcp}ms ${metrics.lcp < 2500 ? '✅' : metrics.lcp < 4000 ? '🟡' : '❌'}`);
    console.log(`  TTFB (Time to First Byte): ${metrics.ttfb}ms ${metrics.ttfb < 800 ? '✅' : metrics.ttfb < 1800 ? '🟡' : '❌'}`);
    console.log(`  CLS (Cumulative Layout Shift): ${metrics.cls} ${parseFloat(metrics.cls) < 0.1 ? '✅' : parseFloat(metrics.cls) < 0.25 ? '🟡' : '❌'}`);
    console.log(`  INP (Interaction to Next Paint): ${metrics.inp}ms ${metrics.inp < 200 ? '✅' : metrics.inp < 500 ? '🟡' : '❌'}`);
    console.log('');
    console.log('Autres métriques:');
    console.log(`  Speed Index: ${metrics.speedIndex}ms`);
    console.log('');
    console.log(`📄 Rapport complet sauvegardé: ${REPORT_FILE}`);

    // Créer un résumé JSON
    const summary = {
      date: new Date().toISOString(),
      url,
      metrics,
      thresholds: {
        fcp: { target: 1800, good: metrics.fcp < 1800, needsImprovement: metrics.fcp >= 1800 && metrics.fcp < 3000, poor: metrics.fcp >= 3000 },
        lcp: { target: 2500, good: metrics.lcp < 2500, needsImprovement: metrics.lcp >= 2500 && metrics.lcp < 4000, poor: metrics.lcp >= 4000 },
        ttfb: { target: 800, good: metrics.ttfb < 800, needsImprovement: metrics.ttfb >= 800 && metrics.ttfb < 1800, poor: metrics.ttfb >= 1800 },
        cls: { target: 0.1, good: parseFloat(metrics.cls) < 0.1, needsImprovement: parseFloat(metrics.cls) >= 0.1 && parseFloat(metrics.cls) < 0.25, poor: parseFloat(metrics.cls) >= 0.25 },
        inp: { target: 200, good: metrics.inp < 200, needsImprovement: metrics.inp >= 200 && metrics.inp < 500, poor: metrics.inp >= 500 },
      },
    };

    const summaryFile = path.join(OUTPUT_DIR, `web-vitals-summary-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    console.log(`📊 Résumé sauvegardé: ${summaryFile}`);

    // Vérifier les objectifs
    const allGood = Object.values(summary.thresholds).every(t => t.good);
    if (allGood) {
      console.log('');
      console.log('✅ Tous les Web Vitals sont dans les objectifs !');
    } else {
      console.log('');
      console.log('⚠️  Certains Web Vitals nécessitent des améliorations:');
      Object.entries(summary.thresholds).forEach(([key, value]) => {
        if (!value.good) {
          console.log(`  - ${key.toUpperCase()}: ${value.needsImprovement ? '🟡 Needs Improvement' : '❌ Poor'}`);
        }
      });
    }
  } else {
    console.error('❌ Le rapport Lighthouse n\'a pas été généré.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Erreur lors de la mesure des Web Vitals:', error.message);
  process.exit(1);
}

