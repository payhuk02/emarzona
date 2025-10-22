#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GÉNÉRATION DU RAPPORT CSV DES ISSUES
 * Export lisible des problèmes de responsivité détectés
 */

console.log('📊 GÉNÉRATION DU RAPPORT CSV - ISSUES RESPONSIVITÉ\n');

// Issues détectées lors de l'audit
const issues = [
  // Marketplace - Critique
  {
    id: 'marketplace-grid-layout',
    page: 'Marketplace',
    component: 'ProductGrid',
    description: 'Grille de produits non responsive',
    breakpoint: 'all',
    severity: 'Critical',
    impact: 'UX dégradée sur mobile/tablette',
    fix: 'Implémenter grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    priority: 1,
    estimation: '2h'
  },
  {
    id: 'marketplace-mobile-menu',
    page: 'Marketplace',
    component: 'MarketplaceHeader',
    description: 'Menu mobile manquant ou mal optimisé',
    breakpoint: 'mobile',
    severity: 'High',
    impact: 'Navigation impossible sur mobile',
    fix: 'Ajouter hamburger menu avec Sheet component',
    priority: 2,
    estimation: '3h'
  },
  {
    id: 'marketplace-touch-targets',
    page: 'Marketplace',
    component: 'ProductCard',
    description: 'Boutons trop petits pour touch targets',
    breakpoint: 'mobile',
    severity: 'High',
    impact: 'Difficulté d\'interaction sur mobile',
    fix: 'Ajouter min-h-[44px] et touch-manipulation',
    priority: 3,
    estimation: '1h'
  },
  
  // Storefront - Critique
  {
    id: 'storefront-image-optimization',
    page: 'Storefront',
    component: 'ProductBanner',
    description: 'Images non optimisées pour responsive',
    breakpoint: 'all',
    severity: 'High',
    impact: 'Images déformées ou coupées',
    fix: 'Ajouter aspect-ratio et object-cover',
    priority: 2,
    estimation: '2h'
  },
  {
    id: 'storefront-hover-effects',
    page: 'Storefront',
    component: 'ProductCard',
    description: 'Effets hover manquants ou mal implémentés',
    breakpoint: 'desktop',
    severity: 'Medium',
    impact: 'Expérience utilisateur moins engageante',
    fix: 'Implémenter hover:translateY(-6px) scale(1.02)',
    priority: 4,
    estimation: '1h'
  },
  
  // ProductDetail - Critique
  {
    id: 'product-detail-layout-shift',
    page: 'ProductDetail',
    component: 'ProductImageGallery',
    description: 'Layout shifts causés par les images',
    breakpoint: 'all',
    severity: 'High',
    impact: 'CLS élevé, mauvaise UX',
    fix: 'Ajouter aspect-ratio et placeholder',
    priority: 2,
    estimation: '2h'
  },
  
  // Landing - Haute priorité
  {
    id: 'landing-touch-targets',
    page: 'Landing',
    component: 'CTA Buttons',
    description: 'Boutons CTA trop petits sur mobile',
    breakpoint: 'mobile',
    severity: 'High',
    impact: 'Conversion réduite sur mobile',
    fix: 'Augmenter taille des boutons CTA',
    priority: 3,
    estimation: '1h'
  },
  {
    id: 'landing-focus-states',
    page: 'Landing',
    component: 'Navigation',
    description: 'États focus manquants pour accessibilité',
    breakpoint: 'all',
    severity: 'Medium',
    impact: 'Accessibilité dégradée',
    fix: 'Ajouter focus-visible:ring-2',
    priority: 5,
    estimation: '1h'
  },
  
  // Auth - Haute priorité
  {
    id: 'auth-form-responsive',
    page: 'Auth',
    component: 'AuthForm',
    description: 'Formulaire non optimisé pour mobile',
    breakpoint: 'mobile',
    severity: 'High',
    impact: 'Difficulté de saisie sur mobile',
    fix: 'Optimiser les champs et boutons',
    priority: 3,
    estimation: '2h'
  },
  
  // Dashboard - Haute priorité
  {
    id: 'dashboard-sidebar-mobile',
    page: 'Dashboard',
    component: 'AppSidebar',
    description: 'Sidebar non optimisée pour mobile',
    breakpoint: 'mobile',
    severity: 'High',
    impact: 'Navigation difficile sur mobile',
    fix: 'Implémenter sidebar mobile avec Sheet',
    priority: 3,
    estimation: '3h'
  },
  
  // Composants généraux
  {
    id: 'general-responsive-classes',
    page: 'All',
    component: 'Multiple',
    description: 'Classes responsive manquantes',
    breakpoint: 'all',
    severity: 'Medium',
    impact: 'Affichage non adaptatif',
    fix: 'Ajouter sm:, md:, lg:, xl: classes',
    priority: 4,
    estimation: '4h'
  },
  {
    id: 'general-image-srcset',
    page: 'All',
    component: 'Images',
    description: 'Images sans srcset pour responsive',
    breakpoint: 'all',
    severity: 'Medium',
    impact: 'Performance dégradée',
    fix: 'Implémenter srcset et picture elements',
    priority: 5,
    estimation: '3h'
  }
];

// Fonction pour générer le CSV
function generateCSV() {
  const csvPath = path.join(__dirname, '..', 'issues.csv');
  
  let csvContent = 'ID,Page,Component,Description,Breakpoint,Severity,Impact,Fix,Priority,Estimation\n';
  
  issues.forEach(issue => {
    csvContent += `"${issue.id}","${issue.page}","${issue.component}","${issue.description}","${issue.breakpoint}","${issue.severity}","${issue.impact}","${issue.fix}",${issue.priority},"${issue.estimation}"\n`;
  });
  
  fs.writeFileSync(csvPath, csvContent);
  console.log(`📄 Rapport CSV généré: ${csvPath}`);
}

// Fonction pour générer le rapport JSON détaillé
function generateDetailedReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'Critical').length,
      highIssues: issues.filter(i => i.severity === 'High').length,
      mediumIssues: issues.filter(i => i.severity === 'Medium').length,
      totalEstimation: issues.reduce((sum, issue) => {
        const hours = parseInt(issue.estimation.replace('h', ''));
        return sum + hours;
      }, 0)
    },
    issues: issues,
    recommendations: {
      phase1: issues.filter(i => i.priority <= 2),
      phase2: issues.filter(i => i.priority === 3),
      phase3: issues.filter(i => i.priority >= 4)
    },
    comeupSpecifications: {
      desktop: {
        gridColumns: 3,
        gap: '24px',
        cardHeight: '560px',
        borderRadius: '12px',
        shadow: 'shadow-md',
        hoverEffect: 'translateY(-6px) scale(1.02) + shadow-xl'
      },
      tablet: {
        gridColumns: 2,
        gap: '20px',
        cardHeight: '520px',
        borderRadius: '10px',
        shadow: 'shadow-md',
        hoverEffect: 'translateY(-4px) scale(1.01) + shadow-lg'
      },
      mobile: {
        gridColumns: 1,
        width: '94-98%',
        cardHeight: '480px',
        borderRadius: '8px',
        shadow: 'shadow-sm',
        touchTargets: '44x44px minimum'
      }
    }
  };
  
  const reportPath = path.join(__dirname, '..', 'detailed-responsivity-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Rapport détaillé généré: ${reportPath}`);
}

// Fonction pour générer les snippets de correction
function generateFixSnippets() {
  const fixesDir = path.join(__dirname, '..', 'fixes');
  if (!fs.existsSync(fixesDir)) {
    fs.mkdirSync(fixesDir);
  }
  
  // Snippet pour la grille responsive ComeUp-style
  const responsiveGridSnippet = `// src/components/ui/ResponsiveGrid.tsx
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
}

export const ResponsiveGrid = ({ 
  children, 
  className, 
  loading = false, 
  skeletonCount = 12 
}: ResponsiveGridProps) => {
  // Skeleton optimisé ComeUp-style
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-xl aspect-[16/9] mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        "gap-4 sm:gap-6 lg:gap-8",
        "px-4 sm:px-6 lg:px-8",
        className
      )}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      "gap-4 sm:gap-6 lg:gap-8", 
      "px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  );
};`;

  // Snippet pour les cartes produits ComeUp-style
  const productCardSnippet = `// src/components/marketplace/ProductCardComeUp.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Percent, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";

interface ProductCardComeUpProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    price: number;
    promo_price?: number;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    category?: string;
  };
  storeSlug: string;
}

const ProductCardComeUp = ({ product, storeSlug }: ProductCardComeUpProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  const price = product.promo_price ?? product.price;
  const hasPromo = product.promo_price && product.promo_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promo_price!) / product.price) * 100)
    : 0;

  return (
    <article 
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105"
      role="article"
      aria-labelledby={\`product-title-\${product.id}\`}
    >
      {/* Image avec ratio 16:9 ComeUp-style */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <ProductBanner
          src={product.image_url}
          alt={\`Image du produit \${product.name}\`}
          className="w-full h-full"
          fallbackIcon={<ShoppingCart className="h-12 w-12 text-muted-foreground" />}
          badges={
            hasPromo ? (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1 animate-pulse">
                  <Percent className="h-3 w-3 mr-1" /> -{discountPercent}%
                </Badge>
              </div>
            ) : undefined
          }
        />
        
        {/* Actions overlay ComeUp-style */}
        <div className="absolute top-3 left-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px]"
            onClick={() => setIsFavorite(!isFavorite)}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart className={\`h-4 w-4 \${isFavorite ? "fill-red-500 text-red-500" : ""}\`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 touch-manipulation min-h-[44px] min-w-[44px]"
            aria-label="Partager le produit"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="flex-1 flex flex-col justify-between p-4">
        <div className="flex-1">
          {product.category && (
            <span className="text-xs font-medium text-primary uppercase tracking-wide mb-2 block">
              {product.category}
            </span>
          )}

          <h3 
            id={\`product-title-\${product.id}\`}
            className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors"
          >
            {product.name}
          </h3>

          {product.rating ? (
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={\`h-3 w-3 sm:h-4 sm:w-4 \${
                    star <= product.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }\`}
                />
              ))}
              <span className="text-xs text-muted-foreground">
                ({product.reviews_count ?? 0})
              </span>
            </div>
          ) : (
            <div className="h-5 mb-3" />
          )}

          <div className="flex items-baseline gap-2 mb-3">
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through">
                {product.price.toLocaleString()} {product.currency ?? "FCFA"}
              </span>
            )}
            <span className="text-lg font-bold text-primary">
              {price.toLocaleString()} {product.currency ?? "FCFA"}
            </span>
          </div>
        </div>

        {/* Actions ComeUp-style */}
        <div className="flex gap-2">
          <Link to={\`/stores/\${storeSlug}/products/\${product.slug}\`} className="flex-1">
            <Button 
              variant="outline" 
              className="w-full text-xs sm:text-sm py-2 px-3 touch-manipulation min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
            >
              Voir
            </Button>
          </Link>

          <Button
            className="flex-1 text-xs sm:text-sm py-2 px-3 touch-manipulation min-h-[44px] focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Acheter</span>
            <span className="sm:hidden">Achat</span>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCardComeUp;`;

  // Snippet pour les utilitaires responsive
  const responsiveUtilsSnippet = `// src/lib/responsive-utils.ts
export const responsiveClasses = {
  // Grilles responsive ComeUp-style
  productGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8",
  
  // Espacements responsive
  container: "px-4 sm:px-6 lg:px-8",
  section: "py-6 sm:py-8 lg:py-12",
  
  // Typographie responsive
  heading: "text-2xl sm:text-3xl lg:text-4xl font-bold",
  subheading: "text-lg sm:text-xl lg:text-2xl font-semibold",
  body: "text-sm sm:text-base lg:text-lg",
  
  // Boutons responsive
  button: "min-h-[44px] touch-manipulation focus-visible:ring-2 focus-visible:ring-primary",
  buttonSmall: "h-8 w-8 min-h-[44px] min-w-[44px] touch-manipulation",
  
  // Images responsive
  image: "w-full aspect-[16/9] object-cover rounded-xl",
  imageSmall: "w-full aspect-square object-cover rounded-lg",
  
  // Cartes responsive
  card: "rounded-xl border border-border bg-card shadow-md hover:shadow-xl transition-all duration-300",
  cardHover: "hover:-translate-y-2 hover:scale-105",
  
  // Focus states
  focus: "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
  
  // Animations
  transition: "transition-all duration-300 ease-out",
  hover: "hover:translate-x-1 hover:scale-105"
};

export const breakpoints = {
  mobile: 'max-width: 640px',
  tablet: 'min-width: 641px and max-width: 1023px',
  desktop: 'min-width: 1024px'
};

export const getResponsiveValue = (mobile: string, tablet: string, desktop: string) => {
  return \`\${mobile} sm:\${tablet} lg:\${desktop}\`;
};`;

  // Écriture des fichiers
  fs.writeFileSync(path.join(fixesDir, 'ResponsiveGrid.tsx'), responsiveGridSnippet);
  fs.writeFileSync(path.join(fixesDir, 'ProductCardComeUp.tsx'), productCardSnippet);
  fs.writeFileSync(path.join(fixesDir, 'responsive-utils.ts'), responsiveUtilsSnippet);
  
  console.log(`📁 Snippets de correction générés dans: ${fixesDir}`);
}

// Fonction principale
function main() {
  console.log('📊 Génération des rapports...');
  
  generateCSV();
  generateDetailedReport();
  generateFixSnippets();
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 RAPPORTS GÉNÉRÉS');
  console.log('='.repeat(80));
  
  console.log(`\n📊 RÉSUMÉ:`);
  console.log(`   📄 Total issues: ${issues.length}`);
  console.log(`   🚨 Critiques: ${issues.filter(i => i.severity === 'Critical').length}`);
  console.log(`   ⚠️  Importantes: ${issues.filter(i => i.severity === 'High').length}`);
  console.log(`   📝 Moyennes: ${issues.filter(i => i.severity === 'Medium').length}`);
  console.log(`   ⏱️  Estimation totale: ${issues.reduce((sum, issue) => sum + parseInt(issue.estimation.replace('h', '')), 0)}h`);
  
  console.log(`\n📁 Fichiers générés:`);
  console.log(`   📄 issues.csv - Export CSV des problèmes`);
  console.log(`   📊 detailed-responsivity-report.json - Rapport détaillé`);
  console.log(`   📁 fixes/ - Snippets de correction`);
  
  console.log(`\n🎯 PHASES DE CORRECTION:`);
  console.log(`   🔥 Phase 1 (Critique): ${issues.filter(i => i.priority <= 2).length} issues`);
  console.log(`   ⚡ Phase 2 (Haute): ${issues.filter(i => i.priority === 3).length} issues`);
  console.log(`   📋 Phase 3 (Moyenne): ${issues.filter(i => i.priority >= 4).length} issues`);
  
  console.log('\n✅ Génération terminée!');
}

// Exécution
main();
