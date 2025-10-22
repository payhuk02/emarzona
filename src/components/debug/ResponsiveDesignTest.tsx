import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductBanner } from '@/components/ui/ResponsiveProductImage';
import { ShoppingCart, Star, Percent, Monitor, Tablet, Smartphone } from 'lucide-react';

interface ResponsiveTestProps {
  className?: string;
}

export const ResponsiveDesignTest = ({ className }: ResponsiveTestProps) => {
  const [currentViewport, setCurrentViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
      
      if (window.innerWidth < 640) {
        setCurrentViewport('mobile');
      } else if (window.innerWidth < 1024) {
        setCurrentViewport('tablet');
      } else {
        setCurrentViewport('desktop');
      }
    };

    updateScreenWidth();
    window.addEventListener('resize', updateScreenWidth);
    
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  // Données de test pour les produits
  const testProducts = [
    {
      id: '1',
      name: 'Formation Complète en Marketing Digital',
      image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop&crop=center',
      price: 25000,
      promo_price: 15000,
      category: 'Formation',
      rating: 4.8,
      reviews_count: 156,
      purchases_count: 89
    },
    {
      id: '2',
      name: 'Template PowerPoint Professionnel',
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center',
      price: 15000,
      promo_price: null,
      category: 'Template',
      rating: 4.5,
      reviews_count: 78,
      purchases_count: 45
    },
    {
      id: '3',
      name: 'E-book Guide Complet du E-commerce',
      image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1920&h=1080&fit=crop&crop=center',
      price: 8000,
      promo_price: 5000,
      category: 'E-book',
      rating: 4.9,
      reviews_count: 203,
      purchases_count: 127
    },
    {
      id: '4',
      name: 'Logiciel de Gestion de Projet',
      image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop&crop=center',
      price: 45000,
      promo_price: null,
      category: 'Logiciel',
      rating: 4.7,
      reviews_count: 92,
      purchases_count: 34
    }
  ];

  const getViewportIcon = () => {
    switch (currentViewport) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getViewportInfo = () => {
    switch (currentViewport) {
      case 'mobile':
        return { name: 'Mobile', width: '< 640px', cols: '1 colonne' };
      case 'tablet':
        return { name: 'Tablette', width: '640px - 1024px', cols: '2 colonnes' };
      case 'desktop':
        return { name: 'Desktop', width: '> 1024px', cols: '3-4 colonnes' };
    }
  };

  const viewportInfo = getViewportInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec informations sur le viewport */}
      <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            {getViewportIcon()}
            Test Responsive Design - Bannières Produits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Viewport Actuel
              </Badge>
              <p className="text-sm font-medium">{viewportInfo.name}</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Largeur Écran
              </Badge>
              <p className="text-sm font-medium">{screenWidth}px ({viewportInfo.width})</p>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Grille
              </Badge>
              <p className="text-sm font-medium">{viewportInfo.cols}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test des bannières avec ratio 16:9 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test des Bannières Produits (Ratio 16:9)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Vérifiez que les bannières conservent le ratio 16:9 sur tous les écrans
          </p>
        </CardHeader>
        <CardContent>
          <div className="products-grid-mobile sm:products-grid-tablet lg:products-grid-desktop gap-4">
            {testProducts.map((product) => {
              const hasPromo = product.promo_price && product.promo_price < product.price;
              const discountPercent = hasPromo
                ? Math.round(((product.price - product.promo_price!) / product.price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop"
                >
                  {/* Bannière produit avec ratio 16:9 */}
                  <div className="product-card-container">
                    <ProductBanner
                      src={product.image_url}
                      alt={product.name}
                      className="w-full product-banner"
                      fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
                      badges={
                        hasPromo ? (
                          <div className="product-badge">
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                              <Percent className="h-3 w-3" /> -{discountPercent}%
                            </div>
                          </div>
                        ) : undefined
                      }
                    />
                  </div>

                  <div className="flex-1 flex flex-col p-4 space-y-2 product-card-content-mobile sm:product-card-content-tablet lg:product-card-content-desktop">
                    <span className="text-xs font-medium text-primary uppercase tracking-wide">
                      {product.category}
                    </span>

                    <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= product.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-xs">({product.reviews_count})</span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      {hasPromo && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.price.toLocaleString()} FCFA
                        </span>
                      )}
                      <span className="text-lg font-bold text-primary">
                        {(product.promo_price || product.price).toLocaleString()} FCFA
                      </span>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {product.purchases_count} ventes
                    </span>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" className="flex-1 product-button-mobile">
                        Voir le produit
                      </Button>
                      <Button className="bg-primary text-primary-foreground flex items-center gap-1 product-button-mobile">
                        <ShoppingCart className="h-4 w-4" />
                        <span>Acheter</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Instructions de test */}
      <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-300">
            Instructions de Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">✅ Tests à Effectuer :</h4>
              <ul className="text-sm space-y-1">
                <li>• Redimensionnez la fenêtre pour tester les breakpoints</li>
                <li>• Vérifiez que les bannières gardent le ratio 16:9</li>
                <li>• Testez l'affichage mobile (marges minimales)</li>
                <li>• Vérifiez les transitions fluides</li>
                <li>• Testez le lazy loading des images</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📱 Breakpoints :</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Mobile:</strong> &lt; 640px (1 colonne)</li>
                <li>• <strong>Tablet:</strong> 640px - 1024px (2 colonnes)</li>
                <li>• <strong>Desktop:</strong> &gt; 1024px (3-4 colonnes)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
