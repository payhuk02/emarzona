/**
 * Script pour vérifier automatiquement les problèmes d'accessibilité
 * Utilise axe-core pour scanner les pages principales
 * 
 * Usage: node scripts/check-accessibility.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const OUTPUT_DIR = path.join(process.cwd(), 'accessibility-reports');

// Pages à scanner
const pages = [
  { name: 'Accueil', path: '/' },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Authentification', path: '/auth' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Produits', path: '/products' },
];

// Créer le dossier de sortie
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔍 Vérification de l\'accessibilité...\n');
console.log(`Base URL: ${BASE_URL}\n`);

// Vérifier que le serveur est en cours d'exécution
try {
  execSync(`curl -f ${BASE_URL} > /dev/null 2>&1`, { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Erreur: Le serveur n\'est pas en cours d\'exécution.');
  console.error(`   Veuillez démarrer le serveur avec: npm run dev`);
  process.exit(1);
}

// Générer un rapport pour chaque page
const reports = [];

pages.forEach((page, index) => {
  console.log(`[${index + 1}/${pages.length}] Scanning: ${page.name} (${page.path})`);
  
  try {
    // Exécuter les tests Playwright pour cette page
    const testFile = path.join(process.cwd(), 'tests', 'accessibility.spec.ts');
    const result = execSync(
      `npx playwright test tests/accessibility.spec.ts --grep "${page.name}" --reporter=json`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    const report = {
      page: page.name,
      path: page.path,
      status: 'success',
      timestamp: new Date().toISOString(),
    };
    
    reports.push(report);
    console.log(`   ✅ ${page.name} - OK\n`);
  } catch (error) {
    const report = {
      page: page.name,
      path: page.path,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
    
    reports.push(report);
    console.log(`   ⚠️  ${page.name} - Problèmes détectés\n`);
  }
});

// Générer le rapport final
const reportPath = path.join(OUTPUT_DIR, `accessibility-report-${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));

// Résumé
const successCount = reports.filter(r => r.status === 'success').length;
const failedCount = reports.filter(r => r.status === 'failed').length;

console.log('\n📊 Résumé:');
console.log(`   ✅ Pages OK: ${successCount}/${pages.length}`);
console.log(`   ⚠️  Pages avec problèmes: ${failedCount}/${pages.length}`);
console.log(`\n📄 Rapport sauvegardé: ${reportPath}`);

if (failedCount > 0) {
  console.log('\n⚠️  Des problèmes d\'accessibilité ont été détectés.');
  console.log('   Consultez le rapport pour plus de détails.');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les pages sont conformes !');
  process.exit(0);
}





