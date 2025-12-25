#!/usr/bin/env node

/**
 * Script amélioré pour mesurer les Web Vitals avec Lighthouse
 * Date: 4 Janvier 2025
 * 
 * Usage:
 *   npm run audit:lighthouse
 *   npm run audit:lighthouse -- --url=http://localhost:8080
 *   npm run audit:lighthouse -- --url=http://localhost:8080 --pages=landing,marketplace
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_URL = 'http://localhost:8080';
const OUTPUT_DIR = path.join(__dirname, '../docs/audits/web-vitals');
const REPORT_FILE = path.join(OUTPUT_DIR, `lighthouse-web-vitals-${new Date().toISOString().split('T')[0]}.json`);

// Pages à tester par défaut
const DEFAULT_PAGES = [
  { name: 'Landing', path: '/', priority: 'High' },
  { name: 'Marketplace', path: '/marketplace', priority: 'Critical' },
  { name: 'Storefront', path: '/stores/test-store', priority: 'Critical' },
  { name: 'ProductDetail', path: '/stores/test-store/products/test-product', priority: 'High' },
  { name: 'Auth', path: '/auth', priority: 'High' },
  { name: 'Dashboard', path: '/dashboard', priority: 'High' },
];

// Récupérer les arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const pagesArg = args.find(arg => arg.startsWith('--pages='));
const url = urlArg ? urlArg.split('=')[1] : DEFAULT_URL;
const pagesToTest = pagesArg 
  ? pagesArg.split('=')[1].split(',').map(name => {
      const page = DEFAULT_PAGES.find(p => p.name.toLowerCase() === name.toLowerCase());
      return page || { name, path: `/${name.toLowerCase()}`, priority: 'Medium' };
    })
  : DEFAULT_PAGES;

console.log('🔍 Mesure des Web Vitals avec Lighthouse...');
console.log(`📍 URL de base: ${url}`);
console.log(`📄 Pages à tester: ${pagesToTest.length}`);
console.log('');

// Créer le dossier de sortie si nécessaire
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fonction pour exécuter Lighthouse sur une page
function runLighthouse(pageUrl, pageName) {
  try {
    console.log(`⏳ Test de ${pageName} (${pageUrl})...`);
    
    const tempReportPath = path.join(OUTPUT_DIR, `temp-${pageName.toLowerCase()}.json`);
    const lighthouseCommand = `npx lighthouse "${pageUrl}" --output=json --output-path="${tempReportPath}" --chrome-flags="--headless --no-sandbox" --only-categories=performance --quiet --no-enable-error-reporting`;
    
    execSync(lighthouseCommand, { stdio: 'pipe', timeout: 120000 });
    
    if (fs.existsSync(tempReportPath)) {
      const report = JSON.parse(fs.readFileSync(tempReportPath, 'utf-8'));
      
      // Extraire les Web Vitals
      const webVitals = extractWebVitals(report);
      const opportunities = extractOpportunities(report);
      
      // Supprimer le fichier temporaire
      fs.unlinkSync(tempReportPath);
      
      return {
        page: pageName,
        url: pageUrl,
        scores: {
          performance: Math.round((report.categories?.performance?.score || 0) * 100),
        },
        webVitals,
        opportunities,
        audits: extractCriticalAudits(report.audits),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Erreur pour ${pageName}:`, error.message);
    return {
      page: pageName,
      url: pageUrl,
      error: error.message,
    };
  }
}

// Extraire les Web Vitals
function extractWebVitals(report) {
  const audits = report.audits || {};
  
  return {
    fcp: {
      value: audits['first-contentful-paint']?.numericValue || 0,
      score: audits['first-contentful-paint']?.score || 0,
      displayValue: audits['first-contentful-paint']?.displayValue || 'N/A',
    },
    lcp: {
      value: audits['largest-contentful-paint']?.numericValue || 0,
      score: audits['largest-contentful-paint']?.score || 0,
      displayValue: audits['largest-contentful-paint']?.displayValue || 'N/A',
    },
    cls: {
      value: audits['cumulative-layout-shift']?.numericValue || 0,
      score: audits['cumulative-layout-shift']?.score || 0,
      displayValue: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    },
    tbt: {
      value: audits['total-blocking-time']?.numericValue || 0,
      score: audits['total-blocking-time']?.score || 0,
      displayValue: audits['total-blocking-time']?.displayValue || 'N/A',
    },
    si: {
      value: audits['speed-index']?.numericValue || 0,
      score: audits['speed-index']?.score || 0,
      displayValue: audits['speed-index']?.displayValue || 'N/A',
    },
    ttfb: {
      value: audits['server-response-time']?.numericValue || 0,
      score: audits['server-response-time']?.score || 0,
      displayValue: audits['server-response-time']?.displayValue || 'N/A',
    },
  };
}

// Extraire les audits critiques
function extractCriticalAudits(audits) {
  const criticalAudits = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'total-blocking-time',
    'speed-index',
    'server-response-time',
    'interactive',
    'render-blocking-resources',
  ];
  
  const results = {};
  criticalAudits.forEach(auditId => {
    if (audits[auditId]) {
      results[auditId] = {
        score: audits[auditId].score,
        displayValue: audits[auditId].displayValue,
        description: audits[auditId].description,
      };
    }
  });
  
  return results;
}

// Extraire les opportunités d'amélioration
function extractOpportunities(audits) {
  const opportunityAudits = [
    'unused-css-rules',
    'unused-javascript',
    'render-blocking-resources',
    'unminified-css',
    'unminified-javascript',
    'modern-image-formats',
    'uses-responsive-images',
    'offscreen-images',
    'unused-preloads',
  ];
  
  const results = {};
  opportunityAudits.forEach(auditId => {
    if (audits[auditId] && audits[auditId].score < 0.9) {
      results[auditId] = {
        score: audits[auditId].score,
        displayValue: audits[auditId].displayValue,
        description: audits[auditId].description,
        details: audits[auditId].details,
      };
    }
  });
  
  return results;
}

// Fonction principale
function main() {
  console.log('🚀 Démarrage des tests Lighthouse...');
  console.log('⚠️  Assurez-vous que le serveur de développement est démarré (npm run dev)');
  console.log('');
  
  const results = [];
  
  pagesToTest.forEach(page => {
    const pageUrl = `${url}${page.path}`;
    const result = runLighthouse(pageUrl, page.name);
    if (result) {
      results.push({
        ...result,
        priority: page.priority,
      });
    }
  });
  
  // Générer le rapport
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: url,
    pages: results,
    summary: generateSummary(results),
  };
  
  // Sauvegarder le rapport JSON
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  // Afficher les résultats
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS WEB VITALS');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    if (result.webVitals) {
      console.log(`\n📄 ${result.page} (${result.priority}):`);
      console.log(`   🚀 Performance: ${result.scores.performance}/100`);
      console.log(`   ⚡ FCP: ${result.webVitals.fcp.displayValue} (score: ${Math.round(result.webVitals.fcp.score * 100)})`);
      console.log(`   ⚡ LCP: ${result.webVitals.lcp.displayValue} (score: ${Math.round(result.webVitals.lcp.score * 100)})`);
      console.log(`   ⚡ CLS: ${result.webVitals.cls.displayValue} (score: ${Math.round(result.webVitals.cls.score * 100)})`);
      console.log(`   ⚡ TBT: ${result.webVitals.tbt.displayValue} (score: ${Math.round(result.webVitals.tbt.score * 100)})`);
      console.log(`   ⚡ SI: ${result.webVitals.si.displayValue} (score: ${Math.round(result.webVitals.si.score * 100)})`);
      console.log(`   ⚡ TTFB: ${result.webVitals.ttfb.displayValue} (score: ${Math.round(result.webVitals.ttfb.score * 100)})`);
      
      if (Object.keys(result.opportunities).length > 0) {
        console.log(`   💡 Opportunités: ${Object.keys(result.opportunities).length}`);
      }
    } else {
      console.log(`\n❌ ${result.page}: ${result.error}`);
    }
  });
  
  // Afficher le résumé
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  console.log(`Moyenne Performance: ${report.summary.averagePerformance}/100`);
  console.log(`FCP moyen: ${report.summary.averageFCP}ms`);
  console.log(`LCP moyen: ${report.summary.averageLCP}ms`);
  console.log(`CLS moyen: ${report.summary.averageCLS}`);
  console.log(`TBT moyen: ${report.summary.averageTBT}ms`);
  
  console.log(`\n📁 Rapport complet: ${REPORT_FILE}`);
  console.log('\n✅ Tests Lighthouse terminés!');
}

// Générer le résumé
function generateSummary(results) {
  const validResults = results.filter(r => r.webVitals);
  
  if (validResults.length === 0) {
    return {
      averagePerformance: 0,
      averageFCP: 0,
      averageLCP: 0,
      averageCLS: 0,
      averageTBT: 0,
    };
  }
  
  const avgPerformance = validResults.reduce((sum, r) => sum + r.scores.performance, 0) / validResults.length;
  const avgFCP = validResults.reduce((sum, r) => sum + r.webVitals.fcp.value, 0) / validResults.length;
  const avgLCP = validResults.reduce((sum, r) => sum + r.webVitals.lcp.value, 0) / validResults.length;
  const avgCLS = validResults.reduce((sum, r) => sum + r.webVitals.cls.value, 0) / validResults.length;
  const avgTBT = validResults.reduce((sum, r) => sum + r.webVitals.tbt.value, 0) / validResults.length;
  
  return {
    averagePerformance: Math.round(avgPerformance),
    averageFCP: Math.round(avgFCP),
    averageLCP: Math.round(avgLCP),
    averageCLS: parseFloat(avgCLS.toFixed(3)),
    averageTBT: Math.round(avgTBT),
  };
}

// Exécution
main();





