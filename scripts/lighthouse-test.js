#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SCRIPT DE TEST LIGHTHOUSE POUR AUDIT RESPONSIVITÉ
 * Analyse les performances et l'accessibilité des pages critiques
 */

console.log('🔍 TEST LIGHTHOUSE - AUDIT RESPONSIVITÉ PAYHULA\n');

// Pages à tester avec Lighthouse
const pagesToTest = [
  { name: 'Landing', url: 'http://localhost:5173/', priority: 'High' },
  { name: 'Marketplace', url: 'http://localhost:5173/marketplace', priority: 'Critical' },
  { name: 'Storefront', url: 'http://localhost:5173/stores/test-store', priority: 'Critical' },
  { name: 'ProductDetail', url: 'http://localhost:5173/stores/test-store/products/test-product', priority: 'Critical' },
  { name: 'Auth', url: 'http://localhost:5173/auth', priority: 'High' }
];

// Fonction pour exécuter Lighthouse
function runLighthouse(page) {
  try {
    console.log(`📊 Test Lighthouse pour ${page.name}...`);
    
    const command = `npx lighthouse ${page.url} --output=json --output-path=./lighthouse-${page.name.toLowerCase()}.json --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo`;
    
    execSync(command, { stdio: 'pipe' });
    
    // Lire le rapport généré
    const reportPath = `./lighthouse-${page.name.toLowerCase()}.json`;
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      return {
        page: page.name,
        url: page.url,
        priority: page.priority,
        scores: {
          performance: Math.round(report.categories.performance.score * 100),
          accessibility: Math.round(report.categories.accessibility.score * 100),
          bestPractices: Math.round(report.categories['best-practices'].score * 100),
          seo: Math.round(report.categories.seo.score * 100)
        },
        audits: extractCriticalAudits(report.audits),
        opportunities: extractOpportunities(report.audits)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Erreur Lighthouse pour ${page.name}:`, error.message);
    return {
      page: page.name,
      url: page.url,
      priority: page.priority,
      error: error.message
    };
  }
}

// Fonction pour extraire les audits critiques
function extractCriticalAudits(audits) {
  const criticalAudits = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'cumulative-layout-shift',
    'total-blocking-time',
    'speed-index',
    'color-contrast',
    'tap-targets',
    'viewport'
  ];
  
  const results = {};
  criticalAudits.forEach(auditId => {
    if (audits[auditId]) {
      results[auditId] = {
        score: audits[auditId].score,
        displayValue: audits[auditId].displayValue,
        description: audits[auditId].description,
        details: audits[auditId].details
      };
    }
  });
  
  return results;
}

// Fonction pour extraire les opportunités d'amélioration
function extractOpportunities(audits) {
  const opportunityAudits = [
    'unused-css-rules',
    'unused-javascript',
    'render-blocking-resources',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'modern-image-formats',
    'uses-responsive-images'
  ];
  
  const results = {};
  opportunityAudits.forEach(auditId => {
    if (audits[auditId] && audits[auditId].score < 0.9) {
      results[auditId] = {
        score: audits[auditId].score,
        displayValue: audits[auditId].displayValue,
        description: audits[auditId].description,
        details: audits[auditId].details
      };
    }
  });
  
  return results;
}

// Fonction pour générer le rapport CSV
function generateCSVReport(results) {
  const csvPath = path.join(__dirname, '..', 'issues.csv');
  let csvContent = 'Page,Priority,Performance,Accessibility,Best Practices,SEO,Issues\n';
  
  results.forEach(result => {
    if (result.scores) {
      const issues = Object.keys(result.audits).length + Object.keys(result.opportunities).length;
      csvContent += `${result.page},${result.priority},${result.scores.performance},${result.scores.accessibility},${result.scores.bestPractices},${result.scores.seo},${issues}\n`;
    } else {
      csvContent += `${result.page},${result.priority},ERROR,ERROR,ERROR,ERROR,1\n`;
    }
  });
  
  fs.writeFileSync(csvPath, csvContent);
  console.log(`📄 Rapport CSV généré: ${csvPath}`);
}

// Fonction pour générer les snippets de correction
function generateFixSnippets(results) {
  const fixesDir = path.join(__dirname, '..', 'fixes');
  if (!fs.existsSync(fixesDir)) {
    fs.mkdirSync(fixesDir);
  }
  
  // Snippet pour les grilles de produits
  const productGridSnippet = `// src/components/ui/ProductGrid.tsx
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  skeletonCount?: number;
}

export const ProductGrid = ({ 
  children, 
  className, 
  loading = false, 
  skeletonCount = 12 
}: ProductGridProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Skeleton optimisé
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[16/9] mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div 
        ref={gridRef}
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8",
          "px-4 sm:px-6 lg:px-8",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={gridRef}
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8",
        "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {isVisible ? children : (
        Array.from({ length: Math.min(skeletonCount, 6) }).map((_, index) => (
          <SkeletonCard key={index} />
        ))
      )}
    </div>
  );
};`;

  fs.writeFileSync(path.join(fixesDir, 'ProductGrid.tsx'), productGridSnippet);
  
  // Snippet pour les cartes produits
  const productCardSnippet = `// src/components/marketplace/ProductCard.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Percent, Loader2, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductBanner } from "@/components/ui/ResponsiveProductImage";

interface ProductCardProps {
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
    purchases_count?: number;
    category?: string;
    store_id?: string;
  };
  storeSlug: string;
  onToggleFavorite?: () => void;
  onShare?: () => void;
  isFavorite?: boolean;
}

const ProductCard = ({ 
  product, 
  storeSlug, 
  onToggleFavorite, 
  onShare, 
  isFavorite = false 
}: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const price = product.promo_price ?? product.price;
  const hasPromo = product.promo_price && product.promo_price < product.price;
  const discountPercent = hasPromo
    ? Math.round(((product.price - product.promo_price!) / product.price) * 100)
    : 0;

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={\`h-3 w-3 sm:h-4 sm:w-4 \${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }\`}
        />
      ))}
    </div>
  );

  const handleBuyNow = async () => {
    if (!product.store_id) {
      toast({
        title: "Erreur",
        description: "Boutique non disponible",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Logique d'achat...
    } catch (error: any) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <article 
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:scale-105"
      role="article"
      aria-labelledby={\`product-title-\${product.id}\`}
    >
      {/* Image produit avec ratio 16:9 */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <ProductBanner
          src={product.image_url}
          alt={\`Image du produit \${product.name}\`}
          className="w-full h-full"
          fallbackIcon={<ShoppingCart className="h-12 w-12 text-muted-foreground" />}
          badges={
            hasPromo ? (
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-red-500 text-white text-xs font-bold px-2 py-1">
                  <Percent className="h-3 w-3 mr-1" /> -{discountPercent}%
                </Badge>
              </div>
            ) : undefined
          }
        />
        
        {/* Actions overlay */}
        <div className="absolute top-3 left-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 touch-manipulation"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Heart className={\`h-4 w-4 \${isFavorite ? "fill-red-500 text-red-500" : ""}\`} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 touch-manipulation"
            onClick={onShare}
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
              {renderStars(product.rating)}
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

          <span className="text-xs text-muted-foreground mb-4 block">
            {product.purchases_count
              ? \`\${product.purchases_count} ventes\`
              : "Aucune vente"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={\`/stores/\${storeSlug}/products/\${product.slug}\`} className="flex-1">
            <Button 
              variant="outline" 
              className="w-full text-xs sm:text-sm py-2 px-3 touch-manipulation min-h-[44px]"
            >
              Voir
            </Button>
          </Link>

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="flex-1 text-xs sm:text-sm py-2 px-3 touch-manipulation min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                <span className="hidden sm:inline">Paiement...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Acheter</span>
                <span className="sm:hidden">Achat</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;`;

  fs.writeFileSync(path.join(fixesDir, 'ProductCard.tsx'), productCardSnippet);
  
  console.log(`📁 Snippets de correction générés dans: ${fixesDir}`);
}

// Fonction principale
function main() {
  console.log('🚀 Démarrage des tests Lighthouse...');
  console.log('⚠️  Assurez-vous que le serveur de développement est démarré (npm run dev)');
  
  const results = [];
  
  pagesToTest.forEach(page => {
    const result = runLighthouse(page);
    if (result) {
      results.push(result);
    }
  });
  
  // Génération des rapports
  console.log('\n📊 Génération des rapports...');
  
  // Rapport JSON
  const reportPath = path.join(__dirname, '..', 'lighthouse-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  // Rapport CSV
  generateCSVReport(results);
  
  // Snippets de correction
  generateFixSnippets(results);
  
  // Affichage des résultats
  console.log('\n' + '='.repeat(80));
  console.log('📈 RÉSULTATS LIGHTHOUSE');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    if (result.scores) {
      console.log(`\n📄 ${result.page} (${result.priority}):`);
      console.log(`   🚀 Performance: ${result.scores.performance}/100`);
      console.log(`   ♿ Accessibilité: ${result.scores.accessibility}/100`);
      console.log(`   ✅ Bonnes pratiques: ${result.scores.bestPractices}/100`);
      console.log(`   🔍 SEO: ${result.scores.seo}/100`);
      
      if (Object.keys(result.audits).length > 0) {
        console.log(`   🚨 Audits critiques: ${Object.keys(result.audits).length}`);
      }
      
      if (Object.keys(result.opportunities).length > 0) {
        console.log(`   💡 Opportunités: ${Object.keys(result.opportunities).length}`);
      }
    } else {
      console.log(`\n❌ ${result.page}: ${result.error}`);
    }
  });
  
  console.log(`\n📁 Rapport complet: ${reportPath}`);
  console.log('\n✅ Tests Lighthouse terminés!');
}

// Exécution
main();
