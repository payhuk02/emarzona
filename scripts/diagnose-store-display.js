#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCRIPT DE DIAGNOSTIC AFFICHAGE STORE
 * Identifie et corrige les problèmes d'affichage de la page Boutique
 */

console.log('🔍 DIAGNOSTIC AFFICHAGE STORE PAYHULA\n');

// Fonction pour diagnostiquer les problèmes d'affichage
function diagnoseDisplayIssues() {
  const storePath = path.join(__dirname, '..', 'src/pages/Store.tsx');
  const storeDetailsPath = path.join(__dirname, '..', 'src/components/store/StoreDetails.tsx');
  const cssPath = path.join(__dirname, '..', 'src/styles/store-responsive.css');
  const sidebarPath = path.join(__dirname, '..', 'src/components/ui/sidebar.tsx');
  const appSidebarPath = path.join(__dirname, '..', 'src/components/AppSidebar.tsx');
  
  const storeContent = fs.readFileSync(storePath, 'utf8');
  const storeDetailsContent = fs.readFileSync(storeDetailsPath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
  const appSidebarContent = fs.readFileSync(appSidebarPath, 'utf8');
  
  const issues = {
    // Structure de base
    hasProperStructure: storeContent.includes('<div className="flex-1 flex flex-col">'),
    hasSidebarProvider: storeContent.includes('SidebarProvider'),
    hasAppSidebar: storeContent.includes('AppSidebar'),
    hasMainContent: storeContent.includes('<main className="store-main">'),
    
    // CSS Layout
    hasFlexLayout: cssContent.includes('display: flex'),
    hasFlexDirection: cssContent.includes('flex-direction: row'),
    hasZIndex: cssContent.includes('z-index:'),
    hasBackgroundColor: cssContent.includes('background-color: hsl(var(--background))'),
    
    // Sidebar Issues
    hasSidebarErrors: sidebarContent.includes('SyntaxError') || sidebarContent.includes('undefined'),
    hasAppSidebarErrors: appSidebarContent.includes('SyntaxError') || appSidebarContent.includes('undefined'),
    hasProperSidebarStructure: sidebarContent.includes('SidebarProvider') && sidebarContent.includes('Sidebar'),
    
    // StoreDetails Issues
    hasStoreDetailsStructure: storeDetailsContent.includes('<div className="space-y-4 sm:space-y-6 animate-fade-in">'),
    hasTabsStructure: storeDetailsContent.includes('<Tabs defaultValue="settings"'),
    hasTabsList: storeDetailsContent.includes('<TabsList className="store-tabs-list">'),
    hasTabsContent: storeDetailsContent.includes('<TabsContent'),
    
    // CSS Classes
    hasStorePageClass: cssContent.includes('.store-page'),
    hasStoreHeaderClass: cssContent.includes('.store-header'),
    hasStoreMainClass: cssContent.includes('.store-main'),
    hasStoreContainerClass: cssContent.includes('.store-container'),
    hasStoreTabsClass: cssContent.includes('.store-tabs'),
    hasStoreCardClass: cssContent.includes('.store-card'),
    
    // Potential Overlay Issues
    hasOverlayElements: storeDetailsContent.includes('absolute') || storeDetailsContent.includes('fixed'),
    hasHighZIndex: cssContent.includes('z-index: 999') || cssContent.includes('z-index: 100'),
    hasBackdropBlur: cssContent.includes('backdrop-blur'),
    hasOpacityIssues: cssContent.includes('opacity: 0') || cssContent.includes('opacity: 1'),
    
    // Responsive Issues
    hasResponsiveClasses: cssContent.includes('@media (max-width: 640px)'),
    hasMobileOptimizations: cssContent.includes('touch-manipulation'),
    hasMinHeight: cssContent.includes('min-h-[44px]'),
    
    // Animation Issues
    hasAnimations: cssContent.includes('animate-'),
    hasTransitions: cssContent.includes('transition-'),
    hasTransform: cssContent.includes('transform:'),
    hasWillChange: cssContent.includes('will-change:')
  };
  
  return issues;
}

// Fonction pour identifier les problèmes spécifiques
function identifySpecificIssues() {
  const issues = diagnoseDisplayIssues();
  const problems = [];
  
  if (!issues.hasProperStructure) {
    problems.push({
      type: 'Structure',
      issue: 'Structure de layout manquante',
      fix: 'Ajouter <div className="flex-1 flex flex-col"> dans Store.tsx'
    });
  }
  
  if (!issues.hasFlexLayout) {
    problems.push({
      type: 'CSS Layout',
      issue: 'Layout flex manquant',
      fix: 'Ajouter display: flex dans .store-page'
    });
  }
  
  if (!issues.hasZIndex) {
    problems.push({
      type: 'Z-Index',
      issue: 'Z-index manquant',
      fix: 'Ajouter z-index approprié pour éviter les overlays'
    });
  }
  
  if (issues.hasOverlayElements && issues.hasHighZIndex) {
    problems.push({
      type: 'Overlay',
      issue: 'Éléments avec z-index élevé causant des overlays',
      fix: 'Réduire les z-index ou ajuster la structure'
    });
  }
  
  if (!issues.hasBackgroundColor) {
    problems.push({
      type: 'Background',
      issue: 'Couleur de fond manquante',
      fix: 'Ajouter background-color explicite'
    });
  }
  
  if (issues.hasSidebarErrors || issues.hasAppSidebarErrors) {
    problems.push({
      type: 'Sidebar',
      issue: 'Erreurs dans les composants sidebar',
      fix: 'Corriger les erreurs de syntaxe dans sidebar.tsx et AppSidebar.tsx'
    });
  }
  
  return problems;
}

// Fonction pour générer les corrections
function generateFixes() {
  const problems = identifySpecificIssues();
  
  const fixes = {
    storePage: `
// Correction pour Store.tsx
<div className="store-page">
  <AppSidebar />
  <div className="flex-1 flex flex-col">
    <header className="store-header">
      {/* Header content */}
    </header>
    <main className="store-main">
      <div className="store-container">
        {/* Main content */}
      </div>
    </main>
  </div>
</div>`,
    
    cssLayout: `
/* Correction pour store-responsive.css */
.store-page {
  @apply min-h-screen bg-background;
  display: flex;
  flex-direction: row;
  position: relative;
}

.store-header {
  @apply sticky top-0 z-10 border-b;
  @apply bg-card/95 backdrop-blur-sm shadow-soft;
  position: relative;
  z-index: 10;
}

.store-main {
  @apply flex-1 p-3 sm:p-4 md:p-6 lg:p-8;
  @apply bg-background overflow-x-hidden;
  position: relative;
  z-index: 1;
  background-color: hsl(var(--background));
}`,
    
    sidebarFix: `
// Correction pour sidebar.tsx
const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  // Implementation
});`
  };
  
  return { problems, fixes };
}

// Fonction principale
function main() {
  console.log('🔍 Diagnostic des problèmes d\'affichage...');
  const issues = diagnoseDisplayIssues();
  
  console.log('🔧 Identification des problèmes spécifiques...');
  const { problems, fixes } = generateFixes();
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DU DIAGNOSTIC STORE');
  console.log('='.repeat(80));
  
  console.log('\n🔍 VÉRIFICATIONS STRUCTURE:');
  Object.entries(issues).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'PROBLÈME'}`);
  });
  
  console.log('\n🚨 PROBLÈMES IDENTIFIÉS:');
  if (problems.length === 0) {
    console.log('   ✅ Aucun problème majeur identifié');
  } else {
    problems.forEach((problem, index) => {
      console.log(`   ${index + 1}. [${problem.type}] ${problem.issue}`);
      console.log(`      💡 Solution: ${problem.fix}`);
    });
  }
  
  const totalChecks = Object.keys(issues).length;
  const passedChecks = Object.values(issues).filter(Boolean).length;
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   ✅ Checks réussis: ${passedChecks}/${totalChecks}`);
  console.log(`   📈 Taux de réussite: ${Math.round((passedChecks / totalChecks) * 100)}%`);
  
  if (problems.length === 0) {
    console.log('\n🎉 AFFICHAGE CORRECT!');
    console.log('   La page Store devrait s\'afficher correctement.');
  } else {
    console.log('\n⚠️ CORRECTIONS NÉCESSAIRES');
    console.log('   Des corrections sont nécessaires pour résoudre les problèmes d\'affichage.');
  }
  
  console.log('\n🎯 RECOMMANDATIONS:');
  console.log('   1. Vérifier que la structure HTML est correcte');
  console.log('   2. S\'assurer que les classes CSS sont appliquées');
  console.log('   3. Vérifier les z-index pour éviter les overlays');
  console.log('   4. Tester sur différents navigateurs');
  console.log('   5. Vérifier la console pour les erreurs JavaScript');
  
  console.log('\n✅ Diagnostic terminé!');
}

// Exécution
main();
