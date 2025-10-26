/**
 * Script de vérification de la présence du système i18n
 * Vérifie que LanguageSwitcher et les traductions sont présents sur toutes les pages
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const results = {
  success: [],
  warnings: [],
  errors: []
};

console.log('\n🌍 VÉRIFICATION DU SYSTÈME I18N\n');
console.log('━'.repeat(60));

// Fonction pour vérifier un fichier
function checkFile(filePath, checks) {
  const name = filePath.split('/').pop();
  try {
    const content = readFileSync(resolve(filePath), 'utf-8');
    
    const result = {
      file: name,
      checks: {}
    };
    
    checks.forEach(check => {
      const found = check.pattern.test(content);
      result.checks[check.name] = found;
      
      if (!found && check.required) {
        results.errors.push(`❌ ${name}: ${check.name} manquant`);
      } else if (found) {
        results.success.push(`✅ ${name}: ${check.name} présent`);
      }
    });
    
    return result;
  } catch (error) {
    results.errors.push(`❌ Erreur lecture ${name}: ${error.message}`);
    return null;
  }
}

// Vérifications pour chaque type de page
const checks = {
  landing: [
    { name: 'LanguageSwitcher import', pattern: /import.*LanguageSwitcher/i, required: true },
    { name: 'useTranslation hook', pattern: /useTranslation/i, required: true },
    { name: 'LanguageSwitcher component', pattern: /<LanguageSwitcher/i, required: true },
    { name: 't() function', pattern: /\{t\(['"]/i, required: true }
  ],
  auth: [
    { name: 'LanguageSwitcher import', pattern: /import.*LanguageSwitcher/i, required: true },
    { name: 'useTranslation hook', pattern: /useTranslation/i, required: true },
    { name: 'LanguageSwitcher component', pattern: /<LanguageSwitcher/i, required: true },
    { name: 't() function', pattern: /\{t\(['"]/i, required: true }
  ],
  marketplace: [
    { name: 'MarketplaceHeader', pattern: /MarketplaceHeader/i, required: true },
    { name: 'useTranslation hook', pattern: /useTranslation/i, required: true },
    { name: 't() function', pattern: /\{t\(['"]/i, required: true }
  ],
  storefront: [
    { name: 'StoreHeader', pattern: /StoreHeader/i, required: true }
  ],
  storeHeader: [
    { name: 'LanguageSwitcher import', pattern: /import.*LanguageSwitcher/i, required: true },
    { name: 'LanguageSwitcher component', pattern: /<LanguageSwitcher/i, required: true }
  ],
  dashboard: [
    { name: 'useTranslation hook', pattern: /useTranslation/i, required: true },
    { name: 't() function', pattern: /\{t\(['"]/i, required: true }
  ],
  appSidebar: [
    { name: 'LanguageSwitcher import', pattern: /import.*LanguageSwitcher/i, required: true },
    { name: 'LanguageSwitcher component', pattern: /<LanguageSwitcher/i, required: true }
  ],
  i18nConfig: [
    { name: 'i18next', pattern: /from ['"]i18next['"]/i, required: true },
    { name: 'react-i18next', pattern: /from ['"]react-i18next['"]/i, required: true },
    { name: 'LanguageDetector', pattern: /LanguageDetector/i, required: true },
    { name: 'Français', pattern: /fr.*Français/i, required: true },
    { name: 'English', pattern: /en.*English/i, required: true },
    { name: 'Español', pattern: /es.*Español/i, required: true },
    { name: 'Deutsch', pattern: /de.*Deutsch/i, required: true },
    { name: 'Português', pattern: /pt.*Português/i, required: true }
  ]
};

// Fichiers à vérifier
const files = {
  'Landing Page': { path: 'src/pages/Landing.tsx', checks: checks.landing },
  'Auth Page': { path: 'src/pages/Auth.tsx', checks: checks.auth },
  'Marketplace': { path: 'src/pages/Marketplace.tsx', checks: checks.marketplace },
  'Storefront': { path: 'src/pages/Storefront.tsx', checks: checks.storefront },
  'StoreHeader': { path: 'src/components/storefront/StoreHeader.tsx', checks: checks.storeHeader },
  'Dashboard': { path: 'src/pages/Dashboard.tsx', checks: checks.dashboard },
  'Products': { path: 'src/pages/Products.tsx', checks: checks.dashboard },
  'Orders': { path: 'src/pages/Orders.tsx', checks: checks.dashboard },
  'Settings': { path: 'src/pages/Settings.tsx', checks: checks.dashboard },
  'AppSidebar': { path: 'src/components/AppSidebar.tsx', checks: checks.appSidebar },
  'i18n Config': { path: 'src/i18n/config.ts', checks: checks.i18nConfig }
};

// Vérifier tous les fichiers
console.log('\n📄 VÉRIFICATION DES FICHIERS:\n');
Object.entries(files).forEach(([name, config]) => {
  console.log(`\n📋 ${name}:`);
  const result = checkFile(config.path, config.checks);
  if (result) {
    Object.entries(result.checks).forEach(([checkName, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${checkName}`);
    });
  }
});

// Vérifier les fichiers de traduction
console.log('\n\n📚 VÉRIFICATION DES TRADUCTIONS:\n');
const locales = ['fr', 'en', 'es', 'de', 'pt'];
locales.forEach(locale => {
  try {
    const content = readFileSync(resolve(`src/i18n/locales/${locale}.json`), 'utf-8');
    const json = JSON.parse(content);
    const keys = JSON.stringify(json).match(/"/g)?.length || 0;
    const sections = Object.keys(json).length;
    
    console.log(`   ✅ ${locale.toUpperCase()} - ${sections} sections, ~${Math.floor(keys/2)} clés`);
    results.success.push(`✅ ${locale}.json: ${sections} sections`);
  } catch (error) {
    console.log(`   ❌ ${locale.toUpperCase()} - Erreur: ${error.message}`);
    results.errors.push(`❌ ${locale}.json: ${error.message}`);
  }
});

// Résumé final
console.log('\n\n' + '━'.repeat(60));
console.log('\n📊 RÉSUMÉ:\n');
console.log(`   ✅ Succès: ${results.success.length}`);
console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
console.log(`   ❌ Erreurs: ${results.errors.length}`);

if (results.errors.length > 0) {
  console.log('\n❌ ERREURS DÉTECTÉES:\n');
  results.errors.forEach(error => console.log(`   ${error}`));
  process.exit(1);
} else {
  console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
  console.log('\n✅ Le système i18n est correctement intégré sur toutes les pages\n');
  process.exit(0);
}

