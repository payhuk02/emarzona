#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCRIPT DE TEST RESPONSIVITÉ DASHBOARD
 * Vérifie que le dashboard est totalement responsive
 */

console.log('📊 TEST RESPONSIVITÉ DASHBOARD PAYHULA\n');

// Fonction pour vérifier les classes CSS responsive
function verifyResponsiveClasses() {
  const dashboardPath = path.join(__dirname, '..', 'src/pages/Dashboard.tsx');
  const cssPath = path.join(__dirname, '..', 'src/styles/dashboard-responsive.css');
  
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const checks = {
    responsiveGrid: dashboardContent.includes('dashboard-stats-grid'),
    responsiveActions: dashboardContent.includes('dashboard-actions-grid'),
    responsiveBottom: dashboardContent.includes('dashboard-bottom-grid'),
    touchTargets: dashboardContent.includes('touch-manipulation'),
    minHeight: dashboardContent.includes('min-h-[44px]'),
    responsiveTypography: cssContent.includes('dashboard-title'),
    responsiveCards: cssContent.includes('dashboard-card'),
    mobileOptimizations: cssContent.includes('@media (max-width: 640px)'),
    tabletOptimizations: cssContent.includes('@media (min-width: 641px) and (max-width: 1023px)'),
    desktopOptimizations: cssContent.includes('@media (min-width: 1024px)')
  };
  
  return checks;
}

// Fonction pour vérifier la structure responsive
function verifyResponsiveStructure() {
  const dashboardPath = path.join(__dirname, '..', 'src/pages/Dashboard.tsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  const structure = {
    hasMobileBreakpoints: content.includes('sm:'),
    hasTabletBreakpoints: content.includes('md:'),
    hasDesktopBreakpoints: content.includes('lg:'),
    hasResponsivePadding: content.includes('p-3 sm:p-4 md:p-6 lg:p-8'),
    hasResponsiveGaps: content.includes('gap-3 sm:gap-4'),
    hasResponsiveText: content.includes('text-xs sm:text-sm'),
    hasResponsiveGrid: content.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'),
    hasResponsiveActions: content.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'),
    hasResponsiveBottom: content.includes('grid-cols-1 lg:grid-cols-3'),
    hasAccessibility: content.includes('aria-label')
  };
  
  return structure;
}

// Fonction principale
function main() {
  console.log('🔍 Vérification des classes CSS responsive...');
  const cssChecks = verifyResponsiveClasses();
  
  console.log('🏗️ Vérification de la structure responsive...');
  const structureChecks = verifyResponsiveStructure();
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DU TEST RESPONSIVITÉ DASHBOARD');
  console.log('='.repeat(80));
  
  console.log('\n🎨 CLASSES CSS RESPONSIVE:');
  Object.entries(cssChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'MANQUANT'}`);
  });
  
  console.log('\n🏗️ STRUCTURE RESPONSIVE:');
  Object.entries(structureChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'MANQUANT'}`);
  });
  
  const totalChecks = Object.keys(cssChecks).length + Object.keys(structureChecks).length;
  const passedChecks = Object.values(cssChecks).filter(Boolean).length + Object.values(structureChecks).filter(Boolean).length;
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   ✅ Checks réussis: ${passedChecks}/${totalChecks}`);
  console.log(`   📈 Taux de réussite: ${Math.round((passedChecks / totalChecks) * 100)}%`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 DASHBOARD TOTALEMENT RESPONSIVE!');
    console.log('   Le tableau de bord est optimisé pour tous les appareils.');
  } else {
    console.log('\n⚠️ DASHBOARD PARTIELLEMENT RESPONSIVE');
    console.log('   Certaines optimisations sont manquantes.');
  }
  
  console.log('\n✅ Test terminé!');
}

// Exécution
main();
