#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script d'analyse approfondie de l'affichage des produits sur le marketplace
 */

console.log('🔍 Analyse Approfondie de l\'Affichage des Produits - Marketplace Payhula\n');

// Fonction pour analyser les composants critiques
function analyzeCriticalComponents() {
  const components = {
    marketplace: 'src/pages/Marketplace.tsx',
    productCard: 'src/components/marketplace/ProductCard.tsx',
    productGrid: 'src/components/ui/ProductGrid.tsx',
    responsiveImage: 'src/components/ui/ResponsiveProductImage.tsx',
    imageOptimization: 'src/hooks/useImageOptimization.ts',
    styles: 'src/styles/product-banners.css'
  };

  const analysis = {};

  Object.entries(components).forEach(([name, filePath]) => {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      analysis[name] = {
        exists: true,
        size: Buffer.byteLength(content, 'utf8'),
        lines: lines.length,
        issues: []
      };

      // Détecter les problèmes potentiels
      if (name === 'marketplace') {
        // Vérifier les imports manquants
        if (!content.includes('import { ProductGrid }')) {
          analysis[name].issues.push('ProductGrid import manquant');
        }
        if (!content.includes('import { ProductBanner }')) {
          analysis[name].issues.push('ProductBanner import manquant');
        }
        
        // Vérifier la structure des cartes produits
        if (!content.includes('ProductCardAdvanced')) {
          analysis[name].issues.push('Composant ProductCardAdvanced utilisé mais non défini');
        }
      }

      if (name === 'productCard') {
        // Vérifier les classes CSS
        if (!content.includes('product-card')) {
          analysis[name].issues.push('Classes CSS product-card manquantes');
        }
        if (!content.includes('ProductBanner')) {
          analysis[name].issues.push('Composant ProductBanner non utilisé');
        }
      }

      if (name === 'productGrid') {
        // Vérifier le lazy loading
        if (!content.includes('IntersectionObserver')) {
          analysis[name].issues.push('IntersectionObserver non utilisé pour le lazy loading');
        }
        if (!content.includes('products-grid-mobile')) {
          analysis[name].issues.push('Classes CSS responsive manquantes');
        }
      }

      if (name === 'responsiveImage') {
        // Vérifier les hooks
        if (!content.includes('useImageOptimization')) {
          analysis[name].issues.push('Hook useImageOptimization non utilisé');
        }
        if (!content.includes('useLazyLoading')) {
          analysis[name].issues.push('Hook useLazyLoading non utilisé');
        }
      }

      if (name === 'imageOptimization') {
        // Vérifier les imports
        if (!content.includes('useRef')) {
          analysis[name].issues.push('useRef import manquant');
        }
        if (!content.includes('IntersectionObserver')) {
          analysis[name].issues.push('IntersectionObserver non utilisé');
        }
      }

      if (name === 'styles') {
        // Vérifier les classes CSS critiques
        const criticalClasses = [
          'products-grid-mobile',
          'products-grid-tablet', 
          'products-grid-desktop',
          'product-card-mobile',
          'product-card-tablet',
          'product-card-desktop',
          'product-banner',
          'product-card-content'
        ];
        
        criticalClasses.forEach(className => {
          if (!content.includes(className)) {
            analysis[name].issues.push(`Classe CSS critique manquante: ${className}`);
          }
        });
      }

    } catch (error) {
      analysis[name] = {
        exists: false,
        error: error.message
      };
    }
  });

  return analysis;
}

// Fonction pour analyser les problèmes de performance
function analyzePerformanceIssues() {
  const issues = [];
  
  // Vérifier la configuration Vite
  try {
    const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    if (!viteConfig.includes('manualChunks')) {
      issues.push('Configuration manualChunks manquante dans Vite');
    }
    
    if (!viteConfig.includes('optimizeDeps')) {
      issues.push('Configuration optimizeDeps manquante dans Vite');
    }
  } catch (error) {
    issues.push(`Erreur lecture vite.config.ts: ${error.message}`);
  }

  // Vérifier les dépendances critiques
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const criticalDeps = ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'];
    criticalDeps.forEach(dep => {
      if (!packageJson.dependencies[dep]) {
        issues.push(`Dépendance critique manquante: ${dep}`);
      }
    });
  } catch (error) {
    issues.push(`Erreur lecture package.json: ${error.message}`);
  }

  return issues;
}

// Fonction pour analyser les problèmes de responsive
function analyzeResponsiveIssues() {
  const issues = [];
  
  try {
    const cssPath = path.join(__dirname, '..', 'src/styles/product-banners.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Vérifier les breakpoints
    const breakpoints = ['640px', '1024px', '1920px'];
    breakpoints.forEach(bp => {
      if (!cssContent.includes(bp)) {
        issues.push(`Breakpoint manquant: ${bp}`);
      }
    });
    
    // Vérifier les grilles responsive
    if (!cssContent.includes('grid-cols-1')) {
      issues.push('Grille mobile (1 colonne) manquante');
    }
    if (!cssContent.includes('grid-cols-2')) {
      issues.push('Grille tablette (2 colonnes) manquante');
    }
    if (!cssContent.includes('grid-cols-3')) {
      issues.push('Grille desktop (3 colonnes) manquante');
    }
    
    // Vérifier les ratios d'aspect
    if (!cssContent.includes('aspect-ratio')) {
      issues.push('Ratio d\'aspect 16:9 manquant');
    }
    
  } catch (error) {
    issues.push(`Erreur lecture CSS: ${error.message}`);
  }

  return issues;
}

// Fonction pour analyser les problèmes d'accessibilité
function analyzeAccessibilityIssues() {
  const issues = [];
  
  try {
    const components = [
      'src/components/marketplace/ProductCard.tsx',
      'src/components/ui/ResponsiveProductImage.tsx'
    ];
    
    components.forEach(componentPath => {
      const fullPath = path.join(__dirname, '..', componentPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Vérifier les attributs d'accessibilité
      if (!content.includes('alt=')) {
        issues.push(`${componentPath}: Attribut alt manquant`);
      }
      
      if (!content.includes('aria-')) {
        issues.push(`${componentPath}: Attributs ARIA manquants`);
      }
      
      if (!content.includes('role=')) {
        issues.push(`${componentPath}: Attribut role manquant`);
      }
    });
    
  } catch (error) {
    issues.push(`Erreur analyse accessibilité: ${error.message}`);
  }

  return issues;
}

// Fonction principale
function main() {
  console.log('📊 Analyse des composants critiques...');
  const componentAnalysis = analyzeCriticalComponents();
  
  console.log('⚡ Analyse des problèmes de performance...');
  const performanceIssues = analyzePerformanceIssues();
  
  console.log('📱 Analyse des problèmes responsive...');
  const responsiveIssues = analyzeResponsiveIssues();
  
  console.log('♿ Analyse des problèmes d\'accessibilité...');
  const accessibilityIssues = analyzeAccessibilityIssues();
  
  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS DE L\'ANALYSE APPROFONDIE');
  console.log('='.repeat(80));
  
  // Analyse des composants
  console.log('\n🔧 ANALYSE DES COMPOSANTS:');
  Object.entries(componentAnalysis).forEach(([name, analysis]) => {
    if (analysis.exists) {
      console.log(`   ✅ ${name}: ${analysis.lines} lignes, ${(analysis.size / 1024).toFixed(1)} kB`);
      if (analysis.issues.length > 0) {
        analysis.issues.forEach(issue => {
          console.log(`      ⚠️  ${issue}`);
        });
      }
    } else {
      console.log(`   ❌ ${name}: ${analysis.error}`);
    }
  });
  
  // Problèmes de performance
  console.log('\n⚡ PROBLÈMES DE PERFORMANCE:');
  if (performanceIssues.length === 0) {
    console.log('   ✅ Aucun problème de performance détecté');
  } else {
    performanceIssues.forEach(issue => {
      console.log(`   ❌ ${issue}`);
    });
  }
  
  // Problèmes responsive
  console.log('\n📱 PROBLÈMES RESPONSIVE:');
  if (responsiveIssues.length === 0) {
    console.log('   ✅ Aucun problème responsive détecté');
  } else {
    responsiveIssues.forEach(issue => {
      console.log(`   ❌ ${issue}`);
    });
  }
  
  // Problèmes d'accessibilité
  console.log('\n♿ PROBLÈMES D\'ACCESSIBILITÉ:');
  if (accessibilityIssues.length === 0) {
    console.log('   ✅ Aucun problème d\'accessibilité détecté');
  } else {
    accessibilityIssues.forEach(issue => {
      console.log(`   ❌ ${issue}`);
    });
  }
  
  // Recommandations
  console.log('\n🎯 RECOMMANDATIONS:');
  console.log('   1. Vérifier que tous les composants utilisent les bonnes classes CSS');
  console.log('   2. S\'assurer que le lazy loading fonctionne correctement');
  console.log('   3. Tester l\'affichage sur différentes tailles d\'écran');
  console.log('   4. Vérifier les performances avec les DevTools');
  console.log('   5. Tester l\'accessibilité avec les outils de développement');
  
  console.log('\n✅ Analyse terminée!');
}

// Exécution
main();
