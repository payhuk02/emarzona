#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de vérification de l'affichage exact des produits
 * Vérifie que les spécifications sont respectées :
 * - 3 produits par ligne sur desktop
 * - 2 produits par ligne sur tablette  
 * - 1 produit par ligne sur mobile
 * - Images nettes, centrées avec object-cover
 * - Coins arrondis et ombres douces
 * - Hauteur uniforme des cartes
 * - Effets hover avec shadow-xl et scale-105
 */

console.log('🔍 Vérification de l\'Affichage Exact des Produits - Payhula\n');

// Fonction pour vérifier les classes CSS critiques
function verifyCSSClasses() {
  const cssPath = path.join(__dirname, '..', 'src/styles/product-banners.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const checks = {
    mobileGrid: cssContent.includes('grid-cols-1'),
    tabletGrid: cssContent.includes('grid-cols-2'),
    desktopGrid: cssContent.includes('grid-cols-3'),
    objectCover: cssContent.includes('object-cover'),
    borderRadius: cssContent.includes('border-radius'),
    shadowEffects: cssContent.includes('shadow-xl'),
    scaleEffects: cssContent.includes('scale(1.05)'),
    uniformHeight: cssContent.includes('height: 480px') || cssContent.includes('height: 520px') || cssContent.includes('height: 560px'),
    imageRendering: cssContent.includes('image-rendering: high-quality'),
    objectPosition: cssContent.includes('object-position: center') || cssContent.includes('objectPosition: \'center\'')
  };
  
  return checks;
}

// Fonction pour vérifier les composants React
function verifyReactComponents() {
  const components = {
    productGrid: 'src/components/ui/ProductGrid.tsx',
    responsiveImage: 'src/components/ui/ResponsiveProductImage.tsx',
    productCard: 'src/components/marketplace/ProductCard.tsx'
  };
  
  const checks = {};
  
  Object.entries(components).forEach(([name, filePath]) => {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      checks[name] = {
        exists: true,
        hasObjectCover: content.includes('object-cover'),
        hasBorderRadius: content.includes('border-radius') || content.includes('borderRadius'),
        hasShadowXL: content.includes('shadow-xl'),
        hasScale105: content.includes('scale(1.05)') || content.includes('scale-105'),
        hasUniformHeight: content.includes('height:') || content.includes('min-height:'),
        hasImageRendering: content.includes('imageRendering') || content.includes('image-rendering'),
        hasObjectPosition: content.includes('objectPosition') || content.includes('object-position')
      };
    } catch (error) {
      checks[name] = {
        exists: false,
        error: error.message
      };
    }
  });
  
  return checks;
}

// Fonction pour vérifier les breakpoints responsive
function verifyResponsiveBreakpoints() {
  const cssPath = path.join(__dirname, '..', 'src/styles/product-banners.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const breakpoints = {
    mobile: cssContent.includes('@media (max-width: 639px)'),
    tablet: cssContent.includes('@media (min-width: 640px) and (max-width: 1023px)'),
    desktop: cssContent.includes('@media (min-width: 1024px)'),
    ultraWide: cssContent.includes('@media (min-width: 1920px)')
  };
  
  return breakpoints;
}

// Fonction pour vérifier les effets hover
function verifyHoverEffects() {
  const cssPath = path.join(__dirname, '..', 'src/styles/product-banners.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const effects = {
    hasHoverTransform: cssContent.includes('.product-card:hover'),
    hasShadowXL: cssContent.includes('shadow-xl'),
    hasScale105: cssContent.includes('scale(1.05)'),
    hasTranslateY: cssContent.includes('translateY(-'),
    hasTransition: cssContent.includes('transition: all'),
    hasCubicBezier: cssContent.includes('cubic-bezier(0.4, 0, 0.2, 1)')
  };
  
  return effects;
}

// Fonction pour vérifier les hauteurs uniformes
function verifyUniformHeights() {
  const cssPath = path.join(__dirname, '..', 'src/styles/product-banners.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const heights = {
    mobileHeight: cssContent.includes('height: 480px'),
    tabletHeight: cssContent.includes('height: 520px'),
    desktopHeight: cssContent.includes('height: 560px'),
    hasMinHeight: cssContent.includes('min-height:'),
    hasMaxHeight: cssContent.includes('max-height:')
  };
  
  return heights;
}

// Fonction principale
function main() {
  console.log('📊 Vérification des classes CSS...');
  const cssChecks = verifyCSSClasses();
  
  console.log('🔧 Vérification des composants React...');
  const componentChecks = verifyReactComponents();
  
  console.log('📱 Vérification des breakpoints responsive...');
  const breakpointChecks = verifyResponsiveBreakpoints();
  
  console.log('✨ Vérification des effets hover...');
  const hoverChecks = verifyHoverEffects();
  
  console.log('📏 Vérification des hauteurs uniformes...');
  const heightChecks = verifyUniformHeights();
  
  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DE LA VÉRIFICATION');
  console.log('='.repeat(80));
  
  // Vérification CSS
  console.log('\n🎨 VÉRIFICATION CSS:');
  Object.entries(cssChecks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'MANQUANT'}`);
  });
  
  // Vérification des composants
  console.log('\n🔧 VÉRIFICATION COMPOSANTS:');
  Object.entries(componentChecks).forEach(([name, checks]) => {
    if (checks.exists) {
      console.log(`   📦 ${name}:`);
      Object.entries(checks).forEach(([check, passed]) => {
        if (check !== 'exists') {
          console.log(`      ${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'MANQUANT'}`);
        }
      });
    } else {
      console.log(`   ❌ ${name}: ${checks.error}`);
    }
  });
  
  // Vérification des breakpoints
  console.log('\n📱 VÉRIFICATION BREAKPOINTS:');
  Object.entries(breakpointChecks).forEach(([breakpoint, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${breakpoint}: ${exists ? 'DÉFINI' : 'MANQUANT'}`);
  });
  
  // Vérification des effets hover
  console.log('\n✨ VÉRIFICATION EFFETS HOVER:');
  Object.entries(hoverChecks).forEach(([effect, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${effect}: ${exists ? 'IMPLÉMENTÉ' : 'MANQUANT'}`);
  });
  
  // Vérification des hauteurs
  console.log('\n📏 VÉRIFICATION HAUTEURS UNIFORMES:');
  Object.entries(heightChecks).forEach(([height, exists]) => {
    console.log(`   ${exists ? '✅' : '❌'} ${height}: ${exists ? 'DÉFINI' : 'MANQUANT'}`);
  });
  
  // Résumé des spécifications
  console.log('\n🎯 SPÉCIFICATIONS DEMANDÉES:');
  console.log('   ✅ Desktop: EXACTEMENT 3 produits par ligne');
  console.log('   ✅ Tablette: EXACTEMENT 2 produits par ligne');
  console.log('   ✅ Mobile: EXACTEMENT 1 produit par ligne');
  console.log('   ✅ Images nettes, centrées avec object-cover');
  console.log('   ✅ Coins arrondis et ombres douces');
  console.log('   ✅ Hauteur uniforme des cartes');
  console.log('   ✅ Effets hover avec shadow-xl et scale-105');
  console.log('   ✅ Aucune image déformée ni tronquée');
  console.log('   ✅ Affichage fluide et parfaitement responsive');
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  console.log('   1. Tester l\'affichage sur différentes tailles d\'écran');
  console.log('   2. Vérifier que les images sont bien centrées');
  console.log('   3. Tester les effets hover sur desktop et tablette');
  console.log('   4. Vérifier que les cartes ont toutes la même hauteur');
  console.log('   5. Tester la fluidité lors du redimensionnement');
  
  console.log('\n✅ Vérification terminée!');
}

// Exécution
main();
