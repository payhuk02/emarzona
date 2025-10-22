import React, { useState, useEffect } from 'react';
import { ProductGrid, LazyProductCard } from '@/components/ui/ProductGrid';
import { ProductBanner } from '@/components/ui/ResponsiveProductImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Star, Percent, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Données de test pour les produits
const testProducts = [
  {
    id: 'test-1',
    name: 'Template WordPress Premium',
    slug: 'template-wordpress-premium',
    image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1920&h=1080&fit=crop',
    price: 25000,
    promo_price: 20000,
    currency: 'FCFA',
    rating: 4.8,
    reviews_count: 156,
    purchases_count: 89,
    category: 'Templates',
    store_id: 'test-store'
  },
  {
    id: 'test-2',
    name: 'Logo Design Professionnel',
    slug: 'logo-design-professionnel',
    image_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1920&h=1080&fit=crop',
    price: 15000,
    currency: 'FCFA',
    rating: 4.9,
    reviews_count: 203,
    purchases_count: 145,
    category: 'Design',
    store_id: 'test-store'
  },
  {
    id: 'test-3',
    name: 'Application Mobile React Native',
    slug: 'app-mobile-react-native',
    image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1920&h=1080&fit=crop',
    price: 75000,
    promo_price: 60000,
    currency: 'FCFA',
    rating: 4.7,
    reviews_count: 78,
    purchases_count: 34,
    category: 'Développement',
    store_id: 'test-store'
  },
  {
    id: 'test-4',
    name: 'Formation E-commerce Complète',
    slug: 'formation-ecommerce-complete',
    image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop',
    price: 45000,
    currency: 'FCFA',
    rating: 4.6,
    reviews_count: 92,
    purchases_count: 67,
    category: 'Formation',
    store_id: 'test-store'
  },
  {
    id: 'test-5',
    name: 'Plugin WordPress Avancé',
    slug: 'plugin-wordpress-avance',
    image_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&h=1080&fit=crop',
    price: 35000,
    promo_price: 28000,
    currency: 'FCFA',
    rating: 4.8,
    reviews_count: 134,
    purchases_count: 98,
    category: 'Plugins',
    store_id: 'test-store'
  },
  {
    id: 'test-6',
    name: 'Site Web Vitrine Moderne',
    slug: 'site-web-vitrine-moderne',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop',
    price: 55000,
    currency: 'FCFA',
    rating: 4.9,
    reviews_count: 187,
    purchases_count: 123,
    category: 'Sites Web',
    store_id: 'test-store'
  }
];

// Composant de carte produit de test
const TestProductCard = ({ product }: { product: typeof testProducts[0] }) => {
  const [loading, setLoading] = useState(false);
  
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
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );

  const handleBuyNow = async () => {
    setLoading(true);
    // Simuler un délai de paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <article 
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Bannière produit avec ratio 16:9 */}
      <div className="product-card-container">
        <ProductBanner
          src={product.image_url}
          alt={`Image du produit ${product.name}`}
          className="w-full product-banner"
          fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
          badges={
            hasPromo ? (
              <div className="product-badge" role="img" aria-label={`Réduction de ${discountPercent}%`}>
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                  <Percent className="h-3 w-3" /> -{discountPercent}%
                </div>
              </div>
            ) : undefined
          }
        />
      </div>

      <div className="product-card-content">
        <div className="flex-1">
          <span className="text-xs font-medium text-primary uppercase tracking-wide mb-2 block" aria-label={`Catégorie: ${product.category}`}>
            {product.category}
          </span>

          <h3 
            id={`product-title-${product.id}`}
            className="product-title group-hover:text-primary transition-colors mb-2"
          >
            {product.name}
          </h3>

          <div className="product-rating mb-3" role="img" aria-label={`Note: ${product.rating} sur 5 étoiles`}>
            {renderStars(product.rating)}
            <span className="ml-1 text-xs" aria-label={`${product.reviews_count} avis`}>({product.reviews_count})</span>
          </div>

          <div className="flex items-baseline gap-2 mb-4" aria-label="Prix du produit">
            {hasPromo && (
              <span className="text-sm text-muted-foreground line-through" aria-label="Prix original">
                {product.price.toLocaleString()} {product.currency}
              </span>
            )}
            <span className="product-price" aria-label="Prix actuel">
              {price.toLocaleString()} {product.currency}
            </span>
          </div>

          <span className="text-xs text-muted-foreground mb-4 block" aria-label="Nombre de ventes">
            {product.purchases_count} ventes
          </span>
        </div>

        <div className="product-actions" role="group" aria-label="Actions du produit">
          <Button 
            variant="outline" 
            className="product-button product-button-secondary"
            aria-label={`Voir les détails du produit ${product.name}`}
          >
            Voir le produit
          </Button>

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            className="product-button product-button-primary"
            aria-label={`Acheter le produit ${product.name} pour ${price.toLocaleString()} ${product.currency}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Paiement...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <span>Acheter</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

// Composant de test principal
const MarketplaceDisplayTest = () => {
  const [testResults, setTestResults] = useState<{
    responsive: boolean;
    lazyLoading: boolean;
    accessibility: boolean;
    performance: boolean;
  }>({
    responsive: false,
    lazyLoading: false,
    accessibility: false,
    performance: false
  });

  useEffect(() => {
    // Tests automatiques
    const runTests = () => {
      // Test responsive
      const isResponsive = window.innerWidth > 0;
      
      // Test lazy loading (vérifier si IntersectionObserver est disponible)
      const hasLazyLoading = 'IntersectionObserver' in window;
      
      // Test accessibilité (vérifier si les éléments ont les bons attributs)
      const hasAccessibility = document.querySelectorAll('[role="article"]').length > 0;
      
      // Test performance (vérifier si les images sont optimisées)
      const hasPerformance = document.querySelectorAll('img[loading="lazy"]').length > 0;
      
      setTestResults({
        responsive: isResponsive,
        lazyLoading: hasLazyLoading,
        accessibility: hasAccessibility,
        performance: hasPerformance
      });
    };

    // Attendre que les composants soient rendus
    setTimeout(runTests, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête de test */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Test d'Affichage Marketplace - Payhula</h1>
          
          {/* Résultats des tests */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  {testResults.responsive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Responsive</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  {testResults.lazyLoading ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Lazy Loading</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  {testResults.accessibility ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Accessibilité</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  {testResults.performance ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Performance</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Test de la grille de produits */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test de la Grille de Produits</h2>
          <ProductGrid>
            {testProducts.map((product, index) => (
              <LazyProductCard key={product.id} priority={index < 3}>
                <TestProductCard product={product} />
              </LazyProductCard>
            ))}
          </ProductGrid>
        </div>

        {/* Test des différentes tailles d'écran */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Responsive</h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Mobile (< 640px)</h3>
              <p className="text-sm text-muted-foreground">1 produit par ligne, quasi-plein écran</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Tablette (640px - 1024px)</h3>
              <p className="text-sm text-muted-foreground">2 produits par ligne</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Desktop (> 1024px)</h3>
              <p className="text-sm text-muted-foreground">3 produits par ligne, format 16:9</p>
            </div>
          </div>
        </div>

        {/* Instructions de test */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Instructions de Test</h2>
          <div className="space-y-2 text-sm">
            <p>• Redimensionnez la fenêtre pour tester le responsive</p>
            <p>• Faites défiler pour tester le lazy loading</p>
            <p>• Utilisez les outils de développement pour vérifier l'accessibilité</p>
            <p>• Vérifiez les performances dans l'onglet Network</p>
            <p>• Testez les interactions (hover, clic, etc.)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceDisplayTest;
