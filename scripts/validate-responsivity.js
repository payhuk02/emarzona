#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCRIPT DE VALIDATION FINALE RESPONSIVITÉ
 * Vérifie que toutes les corrections ont été appliquées
 */

console.log('✅ VALIDATION FINALE RESPONSIVITÉ PAYHULA\n');

// Critères de validation
const validationCriteria = {
  marketplace: {
    file: 'src/pages/Marketplace.tsx',
    checks: [
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      'ProductGrid',
      'gap-4 sm:gap-6 lg:gap-8'
    ]
  },
  storefront: {
    file: 'src/pages/Storefront.tsx',
    checks: [
      'ProductGrid',
      'overflow-x-hidden',
      'px-3 sm:px-4 md:px-6 lg:px-8'
    ]
  },
  productCard: {
    file: 'src/components/marketplace/ProductCard.tsx',
    checks: [
      'min-h-[44px]',
      'touch-manipulation',
      'aspect-[16/9]',
      'object-cover'
    ]
  },
  header: {
    file: 'src/components/marketplace/MarketplaceHeader.tsx',
    checks: [
      'min-h-[44px]',
      'touch-manipulation',
      'aria-label',
      'focus-visible:ring-2'
    ]
  },
  styles: {
    file: 'src/styles/product-banners.css',
    checks: [
      'grid-cols-1',
      'grid-cols-2', 
      'grid-cols-3',
      'height: 480px',
      'height: 520px',
      'height: 560px'
    ]
  }
};

// Fonction de validation
function validateFile(criteria) {
  try {
    const fullPath = path.join(__dirname, '..', criteria.file);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const results = criteria.checks.map(check => ({
      check,
      passed: content.includes(check),
      file: criteria.file
    }));
    
    return results;
  } catch (error) {
    return [{
      check: 'FILE_NOT_FOUND',
      passed: false,
      file: criteria.file,
      error: error.message
    }];
  }
}

// Fonction principale
function main() {
  console.log('🔍 Validation des corrections...');
  
  let totalChecks = 0;
  let passedChecks = 0;
  const allResults = [];
  
  Object.entries(validationCriteria).forEach(([name, criteria]) => {
    console.log(`\n📄 Validation ${name}...`);
    const results = validateFile(criteria);
    
    results.forEach(result => {
      totalChecks++;
      if (result.passed) {
        passedChecks++;
        console.log(`   ✅ ${result.check}`);
      } else {
        console.log(`   ❌ ${result.check}`);
        if (result.error) {
          console.log(`      Erreur: ${result.error}`);
        }
      }
      allResults.push(result);
    });
  });
  
  // Résumé
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DE VALIDATION');
  console.log('='.repeat(80));
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   ✅ Checks réussis: ${passedChecks}/${totalChecks}`);
  console.log(`   ❌ Checks échoués: ${totalChecks - passedChecks}/${totalChecks}`);
  console.log(`   📈 Taux de réussite: ${Math.round((passedChecks / totalChecks) * 100)}%`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 VALIDATION RÉUSSIE!');
    console.log('   Toutes les corrections responsivité ont été appliquées.');
    console.log('   L\'application est prête pour le déploiement.');
  } else {
    console.log('\n⚠️  VALIDATION PARTIELLE');
    console.log('   Certaines corrections sont manquantes.');
    console.log('   Consultez les rapports pour plus de détails.');
  }
  
  console.log('\n✅ Validation terminée!');
}

// Exécution
main();
