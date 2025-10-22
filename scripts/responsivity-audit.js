#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AUDIT RESPONSIVITÉ COMPLET - PAYHULA
 * Analyse de toutes les pages et composants pour garantir un rendu professionnel
 * Inspiré du design ComeUp pour marketplace et boutique
 */

console.log('🔍 AUDIT RESPONSIVITÉ COMPLET - PAYHULA\n');

// Pages principales identifiées
const mainPages = [
  { name: 'Landing', file: 'src/pages/Landing.tsx', priority: 'High', type: 'Public' },
  { name: 'Marketplace', file: 'src/pages/Marketplace.tsx', priority: 'Critical', type: 'Public' },
  { name: 'Storefront', file: 'src/pages/Storefront.tsx', priority: 'Critical', type: 'Public' },
  { name: 'ProductDetail', file: 'src/pages/ProductDetail.tsx', priority: 'Critical', type: 'Public' },
  { name: 'Auth', file: 'src/pages/Auth.tsx', priority: 'High', type: 'Public' },
  { name: 'Dashboard', file: 'src/pages/Dashboard.tsx', priority: 'High', type: 'Private' },
  { name: 'Products', file: 'src/pages/Products.tsx', priority: 'High', type: 'Private' },
  { name: 'Store', file: 'src/pages/Store.tsx', priority: 'High', type: 'Private' },
  { name: 'Settings', file: 'src/pages/Settings.tsx', priority: 'Medium', type: 'Private' },
  { name: 'Payments', file: 'src/pages/Payments.tsx', priority: 'High', type: 'Private' },
  { name: 'Orders', file: 'src/pages/Orders.tsx', priority: 'Medium', type: 'Private' },
  { name: 'Customers', file: 'src/pages/Customers.tsx', priority: 'Medium', type: 'Private' },
  { name: 'Analytics', file: 'src/pages/Analytics.tsx', priority: 'Medium', type: 'Private' },
  { name: 'CreateProduct', file: 'src/pages/CreateProduct.tsx', priority: 'High', type: 'Private' },
  { name: 'EditProduct', file: 'src/pages/EditProduct.tsx', priority: 'High', type: 'Private' }
];

// Composants critiques à analyser
const criticalComponents = [
  { name: 'ProductCard', file: 'src/components/marketplace/ProductCard.tsx', type: 'Product Display' },
  { name: 'ProductGrid', file: 'src/components/ui/ProductGrid.tsx', type: 'Layout' },
  { name: 'ResponsiveProductImage', file: 'src/components/ui/ResponsiveProductImage.tsx', type: 'Image' },
  { name: 'AppSidebar', file: 'src/components/AppSidebar.tsx', type: 'Navigation' },
  { name: 'MarketplaceHeader', file: 'src/components/marketplace/MarketplaceHeader.tsx', type: 'Header' },
  { name: 'MarketplaceFooter', file: 'src/components/marketplace/MarketplaceFooter.tsx', type: 'Footer' }
];

// Breakpoints standards
const breakpoints = {
  mobile: { min: 0, max: 640, name: 'Mobile' },
  tablet: { min: 641, max: 1023, name: 'Tablette' },
  desktop: { min: 1024, max: 9999, name: 'Desktop' }
};

// Fonction pour analyser une page
function analyzePage(page) {
  const issues = [];
  
  try {
    const fullPath = path.join(__dirname, '..', page.file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    
    // Vérifications de responsivité
    const checks = {
      hasResponsiveClasses: content.includes('sm:') || content.includes('md:') || content.includes('lg:') || content.includes('xl:'),
      hasMobileMenu: content.includes('mobileMenuOpen') || content.includes('mobile-menu'),
      hasTouchTargets: content.includes('touch-manipulation') || content.includes('min-h-[44px]'),
      hasGridLayout: content.includes('grid') || content.includes('flex'),
      hasImageOptimization: content.includes('object-cover') || content.includes('aspect-ratio'),
      hasHoverEffects: content.includes('hover:') || content.includes('group-hover'),
      hasFocusStates: content.includes('focus:') || content.includes('focus-visible'),
      hasOverflowControl: content.includes('overflow-hidden') || content.includes('overflow-x-hidden'),
      hasResponsiveText: content.includes('text-sm') || content.includes('text-base') || content.includes('text-lg'),
      hasResponsiveSpacing: content.includes('p-') || content.includes('m-') || content.includes('gap-')
    };
    
    // Détecter les problèmes potentiels
    Object.entries(checks).forEach(([check, passed]) => {
      if (!passed) {
        issues.push({
          id: `${page.name.toLowerCase()}-${check}`,
          description: `Manque de ${check.replace('has', '').toLowerCase()}`,
          breakpoint: 'all',
          severity: check.includes('Touch') || check.includes('Mobile') ? 'High' : 'Medium',
          fix: getFixSuggestion(check, page.name)
        });
      }
    });
    
    // Vérifications spécifiques par type de page
    if (page.name === 'Marketplace' || page.name === 'Storefront') {
      if (!content.includes('grid-cols-3') || !content.includes('grid-cols-2') || !content.includes('grid-cols-1')) {
        issues.push({
          id: `${page.name.toLowerCase()}-grid-layout`,
          description: 'Grille de produits non responsive',
          breakpoint: 'all',
          severity: 'Critical',
          fix: 'Implémenter grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        });
      }
    }
    
    if (page.name === 'ProductDetail') {
      if (!content.includes('aspect-ratio') && !content.includes('object-cover')) {
        issues.push({
          id: 'product-detail-image',
          description: 'Images produit non optimisées',
          breakpoint: 'all',
          severity: 'High',
          fix: 'Ajouter aspect-ratio et object-cover'
        });
      }
    }
    
    return {
      page: page.name,
      file: page.file,
      priority: page.priority,
      type: page.type,
      issues: issues,
      lines: lines.length,
      size: Buffer.byteLength(content, 'utf8')
    };
    
  } catch (error) {
    return {
      page: page.name,
      file: page.file,
      priority: page.priority,
      type: page.type,
      error: error.message,
      issues: []
    };
  }
}

// Fonction pour analyser un composant
function analyzeComponent(component) {
  const issues = [];
  
  try {
    const fullPath = path.join(__dirname, '..', component.file);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const checks = {
      hasResponsiveProps: content.includes('className') && (content.includes('sm:') || content.includes('md:')),
      hasAccessibility: content.includes('aria-') || content.includes('role='),
      hasTouchSupport: content.includes('touch-manipulation') || content.includes('onTouchStart'),
      hasHoverStates: content.includes('hover:') || content.includes('group-hover'),
      hasFocusStates: content.includes('focus:') || content.includes('focus-visible'),
      hasLoadingStates: content.includes('loading') || content.includes('isLoading'),
      hasErrorHandling: content.includes('error') || content.includes('Error')
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
      if (!passed) {
        issues.push({
          id: `${component.name.toLowerCase()}-${check}`,
          description: `Composant ${component.name} manque ${check.replace('has', '').toLowerCase()}`,
          severity: check.includes('Accessibility') ? 'High' : 'Medium',
          fix: getComponentFixSuggestion(check, component.name)
        });
      }
    });
    
    return {
      component: component.name,
      file: component.file,
      type: component.type,
      issues: issues
    };
    
  } catch (error) {
    return {
      component: component.name,
      file: component.file,
      type: component.type,
      error: error.message,
      issues: []
    };
  }
}

// Fonction pour suggérer des corrections
function getFixSuggestion(check, pageName) {
  const fixes = {
    'hasResponsiveClasses': 'Ajouter des classes Tailwind responsive (sm:, md:, lg:, xl:)',
    'hasMobileMenu': 'Implémenter un menu mobile avec hamburger',
    'hasTouchTargets': 'Ajouter touch-manipulation et min-h-[44px] pour les boutons',
    'hasGridLayout': 'Utiliser CSS Grid ou Flexbox pour la mise en page',
    'hasImageOptimization': 'Ajouter object-cover et aspect-ratio pour les images',
    'hasHoverEffects': 'Implémenter des effets hover avec group-hover',
    'hasFocusStates': 'Ajouter des états focus pour l\'accessibilité',
    'hasOverflowControl': 'Contrôler le débordement avec overflow-hidden',
    'hasResponsiveText': 'Utiliser des tailles de texte responsive',
    'hasResponsiveSpacing': 'Utiliser des espacements responsive'
  };
  
  return fixes[check] || 'Correction à définir';
}

function getComponentFixSuggestion(check, componentName) {
  const fixes = {
    'hasResponsiveProps': 'Ajouter des props responsive au composant',
    'hasAccessibility': 'Ajouter des attributs ARIA et role',
    'hasTouchSupport': 'Implémenter le support tactile',
    'hasHoverStates': 'Ajouter des états hover',
    'hasFocusStates': 'Ajouter des états focus',
    'hasLoadingStates': 'Implémenter des états de chargement',
    'hasErrorHandling': 'Ajouter la gestion d\'erreur'
  };
  
  return fixes[check] || 'Correction à définir';
}

// Fonction principale
function main() {
  console.log('📊 ANALYSE DES PAGES PRINCIPALES...');
  const pageResults = mainPages.map(analyzePage);
  
  console.log('🔧 ANALYSE DES COMPOSANTS CRITIQUES...');
  const componentResults = criticalComponents.map(analyzeComponent);
  
  // Génération du rapport JSON
  const auditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: mainPages.length,
      totalComponents: criticalComponents.length,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0
    },
    pages: pageResults,
    components: componentResults,
    breakpoints: breakpoints,
    recommendations: {
      priority1: ['Marketplace', 'Storefront', 'ProductDetail'],
      priority2: ['Landing', 'Auth', 'Dashboard'],
      priority3: ['Settings', 'Payments', 'Orders']
    }
  };
  
  // Compter les issues par priorité
  [...pageResults, ...componentResults].forEach(result => {
    if (result.issues) {
      result.issues.forEach(issue => {
        switch (issue.severity) {
          case 'Critical': auditReport.summary.criticalIssues++; break;
          case 'High': auditReport.summary.highIssues++; break;
          case 'Medium': auditReport.summary.mediumIssues++; break;
          case 'Low': auditReport.summary.lowIssues++; break;
        }
      });
    }
  });
  
  // Sauvegarder le rapport
  const reportPath = path.join(__dirname, '..', 'responsivity-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  
  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DE L\'AUDIT RESPONSIVITÉ');
  console.log('='.repeat(80));
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   📄 Pages analysées: ${auditReport.summary.totalPages}`);
  console.log(`   🔧 Composants analysés: ${auditReport.summary.totalComponents}`);
  console.log(`   🚨 Issues critiques: ${auditReport.summary.criticalIssues}`);
  console.log(`   ⚠️  Issues importantes: ${auditReport.summary.highIssues}`);
  console.log(`   📝 Issues moyennes: ${auditReport.summary.mediumIssues}`);
  console.log(`   ℹ️  Issues mineures: ${auditReport.summary.lowIssues}`);
  
  console.log(`\n🎯 PRIORITÉS:`);
  console.log(`   🔥 Priorité 1: ${auditReport.recommendations.priority1.join(', ')}`);
  console.log(`   ⚡ Priorité 2: ${auditReport.recommendations.priority2.join(', ')}`);
  console.log(`   📋 Priorité 3: ${auditReport.recommendations.priority3.join(', ')}`);
  
  console.log(`\n📁 RAPPORT SAUVEGARDÉ: ${reportPath}`);
  console.log('\n✅ Audit terminé!');
}

// Exécution
main();
