/**
 * Script Lighthouse simplifié (sans dépendances npm)
 * Utilise Lighthouse CLI si installé globalement
 * Usage: node scripts/lighthouse-test-simple.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const urls = [
  'http://localhost:8080',
  'http://localhost:8080/marketplace',
  'http://localhost:8080/stores/demo/products/demo-product',
];

function runLighthouseCLI(url) {
  try {
    console.log(`📊 Test de ${url}...`);
    
    const output = execSync(
      `lighthouse ${url} --only-categories=performance,accessibility --output=json --output-path=./lighthouse-${Date.now()}.json --chrome-flags="--headless"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    return { success: true, url };
  } catch (error) {
    console.error(`❌ Erreur pour ${url}:`, error.message);
    return { success: false, url, error: error.message };
  }
}

function main() {
  console.log('🚀 Démarrage des tests Lighthouse (CLI)...\n');
  console.log('⚠️  Assurez-vous que Lighthouse CLI est installé: npm install -g lighthouse\n');

  const results = urls.map(runLighthouseCLI);

  console.log('\n📊 RÉSUMÉ\n');
  results.forEach((result) => {
    if (result.success) {
      console.log(`✅ ${result.url}`);
    } else {
      console.log(`❌ ${result.url}: ${result.error}`);
    }
  });

  console.log('\n💡 Pour installer Lighthouse CLI: npm install -g lighthouse');
  console.log('💡 Les rapports sont sauvegardés dans le répertoire courant');
}

if (require.main === module) {
  main();
}

module.exports = { runLighthouseCLI };

