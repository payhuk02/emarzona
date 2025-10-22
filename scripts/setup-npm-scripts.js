#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCRIPT NPM POUR TESTS RESPONSIVITÉ
 * Configuration des commandes pour tester la responsivité
 */

console.log('📦 CONFIGURATION DES SCRIPTS NPM - TESTS RESPONSIVITÉ\n');

// Fonction pour mettre à jour le package.json
function updatePackageJson() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Scripts de test responsivité
    packageJson.scripts['test:responsive'] = 'playwright test --project=chromium --project="Mobile Chrome" --project="Tablet Chrome"';
    packageJson.scripts['test:responsive:all'] = 'playwright test';
    packageJson.scripts['test:responsive:mobile'] = 'playwright test --project="Mobile Chrome" --project="Mobile Safari"';
    packageJson.scripts['test:responsive:desktop'] = 'playwright test --project=chromium --project=firefox --project=webkit';
    packageJson.scripts['test:responsive:visual'] = 'playwright test --grep "Régression visuelle"';
    
    // Scripts d'audit
    packageJson.scripts['audit:responsive'] = 'node scripts/responsivity-audit.js';
    packageJson.scripts['audit:lighthouse'] = 'node scripts/lighthouse-test.js';
    packageJson.scripts['audit:all'] = 'npm run audit:responsive && npm run audit:lighthouse';
    
    // Scripts de génération de rapports
    packageJson.scripts['report:csv'] = 'node scripts/generate-csv-report.js';
    packageJson.scripts['report:playwright'] = 'node scripts/generate-playwright-tests.js';
    packageJson.scripts['report:all'] = 'npm run report:csv && npm run report:playwright';
    
    // Scripts de développement
    packageJson.scripts['dev:responsive'] = 'npm run dev & npm run test:responsive:mobile';
    packageJson.scripts['build:responsive'] = 'npm run build && npm run test:responsive';
    
    // Scripts de vérification
    packageJson.scripts['verify:responsive'] = 'node scripts/verify-product-display.js';
    packageJson.scripts['verify:all'] = 'npm run verify:responsive && npm run audit:responsive';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Scripts npm ajoutés au package.json');
    
    return packageJson.scripts;
  } catch (error) {
    console.error('❌ Erreur lors de la modification du package.json:', error.message);
    return null;
  }
}

// Fonction pour créer un fichier README pour les tests
function createTestReadme() {
  const readmeContent = `# 🧪 TESTS RESPONSIVITÉ PAYHULA

## 🎯 Vue d'ensemble

Ce dossier contient tous les tests et scripts pour vérifier la responsivité de l'application Payhula, en s'inspirant du design ComeUp.

## 📦 Scripts Disponibles

### Tests Playwright
\`\`\`bash
# Tests responsivité complets (mobile + tablette + desktop)
npm run test:responsive

# Tests sur tous les navigateurs
npm run test:responsive:all

# Tests mobile uniquement
npm run test:responsive:mobile

# Tests desktop uniquement
npm run test:responsive:desktop

# Tests de régression visuelle
npm run test:responsive:visual
\`\`\`

### Audits et Analyses
\`\`\`bash
# Audit responsivité complet
npm run audit:responsive

# Tests Lighthouse (performance + accessibilité)
npm run audit:lighthouse

# Tous les audits
npm run audit:all
\`\`\`

### Génération de Rapports
\`\`\`bash
# Générer le rapport CSV des issues
npm run report:csv

# Générer les tests Playwright
npm run report:playwright

# Générer tous les rapports
npm run report:all
\`\`\`

### Vérifications
\`\`\`bash
# Vérifier l'affichage des produits
npm run verify:responsive

# Vérifications complètes
npm run verify:all
\`\`\`

### Développement
\`\`\`bash
# Démarrer le dev avec tests mobile
npm run dev:responsive

# Build avec tests responsivité
npm run build:responsive
\`\`\`

## 🔧 Configuration

### Playwright
- Configuration: \`playwright.config.ts\`
- Tests: \`tests/responsive.spec.ts\`
- Breakpoints: Mobile (375px), Tablette (768px), Desktop (1920px)

### Lighthouse
- Script: \`scripts/lighthouse-test.js\`
- Pages testées: Landing, Marketplace, Storefront, ProductDetail, Auth
- Métriques: Performance, Accessibilité, Bonnes pratiques, SEO

## 📊 Rapports Générés

### Fichiers de Rapport
- \`responsivity-audit.json\` - Audit complet des pages
- \`issues.csv\` - Export CSV des problèmes détectés
- \`detailed-responsivity-report.json\` - Rapport détaillé avec estimations
- \`lighthouse-report.json\` - Résultats des tests Lighthouse

### Captures d'Écran
- \`tests/screenshots/\` - Captures par page et breakpoint
- \`tests/screenshots/product-card-*.png\` - Régression visuelle des cartes

### Snippets de Correction
- \`fixes/ResponsiveGrid.tsx\` - Grille responsive ComeUp-style
- \`fixes/ProductCardComeUp.tsx\` - Carte produit optimisée
- \`fixes/responsive-utils.ts\` - Utilitaires responsive

## 🎯 Spécifications ComeUp

### Desktop (≥1024px)
- ✅ **3 produits par ligne** avec gap de 24px
- ✅ **Hauteur uniforme** des cartes (560px)
- ✅ **Images centrées** avec object-cover
- ✅ **Border-radius**: 12px
- ✅ **Shadow**: soft (shadow-md)
- ✅ **Hover**: translateY(-6px) scale(1.02) + shadow-xl

### Tablette (641-1023px)
- ✅ **2 produits par ligne** avec proportions réduites
- ✅ **Hauteur uniforme** (520px)
- ✅ **Mêmes règles** que desktop

### Mobile (≤640px)
- ✅ **1 produit par ligne** occupant 94-98% de largeur
- ✅ **Marges latérales** confortables
- ✅ **Touch targets** minimum 44×44px
- ✅ **CTA visible** en bas de carte

## 🚀 Workflow de Développement

### 1. Développement
\`\`\`bash
npm run dev:responsive
# Démarre le serveur + tests mobile en parallèle
\`\`\`

### 2. Tests Locaux
\`\`\`bash
npm run test:responsive:mobile
# Teste uniquement sur mobile
\`\`\`

### 3. Audit Complet
\`\`\`bash
npm run audit:all
# Lance tous les audits (responsivité + Lighthouse)
\`\`\`

### 4. Génération de Rapports
\`\`\`bash
npm run report:all
# Génère tous les rapports et snippets
\`\`\`

### 5. Vérification Finale
\`\`\`bash
npm run verify:all
# Vérifie que tout fonctionne correctement
\`\`\`

## 📈 Métriques de Performance

### Critères d'Acceptation
- **LCP**: < 2.5s (mobile)
- **CLS**: < 0.1 (pas de layout shifts)
- **Touch targets**: ≥ 44px
- **Contrast ratio**: ≥ 4.5:1
- **Accessibilité**: Score Lighthouse ≥ 90

### Breakpoints Testés
- **Mobile**: 375×667 (iPhone SE)
- **Tablette**: 768×1024 (iPad)
- **Desktop**: 1920×1080 (Full HD)

## 🔍 Dépannage

### Problèmes Courants
1. **Tests Playwright échouent**: Vérifier que le serveur dev est démarré
2. **Lighthouse timeout**: Augmenter le timeout dans le script
3. **Captures d'écran manquantes**: Vérifier les permissions du dossier tests/

### Commandes de Debug
\`\`\`bash
# Tests en mode debug
npx playwright test --debug

# Tests avec interface graphique
npx playwright test --ui

# Tests sur un navigateur spécifique
npx playwright test --project=chromium
\`\`\`

---

**Dernière mise à jour**: ${new Date().toLocaleDateString('fr-FR')}
**Inspiration**: ComeUp.com, Fiverr, Etsy
**Technologies**: Playwright, Lighthouse, React, TypeScript, TailwindCSS`;

  const readmePath = path.join(__dirname, '..', 'TESTS_RESPONSIVITE.md');
  fs.writeFileSync(readmePath, readmeContent);
  console.log('📄 README des tests créé: TESTS_RESPONSIVITE.md');
}

// Fonction pour créer un script de validation finale
function createValidationScript() {
  const validationScript = `#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCRIPT DE VALIDATION FINALE RESPONSIVITÉ
 * Vérifie que toutes les corrections ont été appliquées
 */

console.log('✅ VALIDATION FINALE RESPONSIVITÉ PAYHULA\\n');

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
    console.log(\`\\n📄 Validation \${name}...\`);
    const results = validateFile(criteria);
    
    results.forEach(result => {
      totalChecks++;
      if (result.passed) {
        passedChecks++;
        console.log(\`   ✅ \${result.check}\`);
      } else {
        console.log(\`   ❌ \${result.check}\`);
        if (result.error) {
          console.log(\`      Erreur: \${result.error}\`);
        }
      }
      allResults.push(result);
    });
  });
  
  // Résumé
  console.log('\\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DE VALIDATION');
  console.log('='.repeat(80));
  
  console.log(\`\\n📊 RÉSUMÉ:\`);
  console.log(\`   ✅ Checks réussis: \${passedChecks}/\${totalChecks}\`);
  console.log(\`   ❌ Checks échoués: \${totalChecks - passedChecks}/\${totalChecks}\`);
  console.log(\`   📈 Taux de réussite: \${Math.round((passedChecks / totalChecks) * 100)}%\`);
  
  if (passedChecks === totalChecks) {
    console.log('\\n🎉 VALIDATION RÉUSSIE!');
    console.log('   Toutes les corrections responsivité ont été appliquées.');
    console.log('   L\\'application est prête pour le déploiement.');
  } else {
    console.log('\\n⚠️  VALIDATION PARTIELLE');
    console.log('   Certaines corrections sont manquantes.');
    console.log('   Consultez les rapports pour plus de détails.');
  }
  
  console.log('\\n✅ Validation terminée!');
}

// Exécution
main();
`;

  const validationPath = path.join(__dirname, '..', 'scripts/validate-responsivity.js');
  fs.writeFileSync(validationPath, validationScript);
  console.log('✅ Script de validation créé: scripts/validate-responsivity.js');
}

// Fonction principale
function main() {
  console.log('📦 Configuration des scripts npm...');
  
  const scripts = updatePackageJson();
  createTestReadme();
  createValidationScript();
  
  console.log('\n' + '='.repeat(80));
  console.log('📦 SCRIPTS NPM CONFIGURÉS');
  console.log('='.repeat(80));
  
  if (scripts) {
    console.log('\n🚀 Scripts disponibles:');
    Object.entries(scripts)
      .filter(([key]) => key.includes('responsive') || key.includes('audit') || key.includes('report') || key.includes('verify'))
      .forEach(([key, value]) => {
        console.log(`   📦 ${key}: ${value}`);
      });
  }
  
  console.log('\n📁 Fichiers créés:');
  console.log('   📦 package.json - Scripts npm ajoutés');
  console.log('   📄 TESTS_RESPONSIVITE.md - Documentation des tests');
  console.log('   ✅ scripts/validate-responsivity.js - Script de validation');
  
  console.log('\n🎯 Commandes principales:');
  console.log('   npm run test:responsive - Tests responsivité');
  console.log('   npm run audit:all - Audits complets');
  console.log('   npm run verify:all - Vérifications finales');
  
  console.log('\n✅ Configuration terminée!');
}

// Exécution
main();
