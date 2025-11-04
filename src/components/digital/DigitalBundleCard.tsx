/**
 * Digital Bundle Card Component
 * Date: 27 Janvier 2025
 * 
 * Composant pour afficher une carte de bundle de produits digitaux
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { DigitalProductBundle } from '@/hooks/digital/useDigitalBundles';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface DigitalBundleCardProps {
  bundle: DigitalProductBundle;
  variant?: 'default' | 'featured' | 'compact';
  showActions?: boolean;
  onView?: (bundleId: string) => void;
  onPurchase?: (bundleId: string) => void;
  className?: string;
}

export const DigitalBundleCard = ({
  bundle,
  variant = 'default',
  showActions = true,
  onView,
  onPurchase,
  className,
}: DigitalBundleCardProps) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (onView) {
      onView(bundle.id);
    } else {
      navigate(`/bundles/${bundle.slug}`);
    }
  };

  const handlePurchase = () => {
    if (onPurchase) {
      onPurchase(bundle.id);
    } else {
      navigate(`/bundles/${bundle.slug}?action=purchase`);
    }
  };

  // Calculer le prix individuel total (approximation)
  const individualTotal = bundle.products?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
  const savings = individualTotal - bundle.bundle_price;
  const savingsPercentage = individualTotal > 0 
    ? Math.round((savings / individualTotal) * 100) 
    : bundle.discount_percentage || 0;

  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "group hover:shadow-lg transition-all duration-300 cursor-pointer",
          bundle.is_featured && "border-primary",
          className
        )}
        onClick={handleView}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {bundle.image_url && (
              <img
                src={bundle.image_url}
                alt={bundle.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm line-clamp-1">{bundle.name}</h4>
                {bundle.is_featured && (
                  <Badge variant="default" className="text-xs flex-shrink-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Vedette
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {bundle.short_description || bundle.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    {bundle.promotional_price?.toLocaleString() || bundle.bundle_price.toLocaleString()} {bundle.currency}
                  </span>
                  {bundle.promotional_price && (
                    <span className="text-sm line-through text-muted-foreground">
                      {bundle.bundle_price.toLocaleString()} {bundle.currency}
                    </span>
                  )}
                </div>
                {savingsPercentage > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    -{savingsPercentage}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group hover:shadow-xl transition-all duration-300 overflow-hidden",
        bundle.is_featured && "border-primary border-2",
        variant === 'featured' && "bg-gradient-to-br from-primary/5 to-primary/10",
        className
      )}
    >
      {/* Header avec image */}
      <div className="relative">
        {bundle.image_url ? (
          <img
            src={bundle.image_url}
            alt={bundle.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Package className="h-16 w-16 text-white/50" />
          </div>
        )}
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {bundle.is_featured && (
            <Badge className="bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3 mr-1" />
              Vedette
            </Badge>
          )}
          {savingsPercentage > 0 && (
            <Badge variant="destructive">
              -{savingsPercentage}% OFF
            </Badge>
          )}
        </div>

        {/* Products count badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {bundle.digital_product_ids?.length || 0} produits
          </Badge>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-xl line-clamp-2">{bundle.name}</CardTitle>
        <CardDescription className="line-clamp-2">
          {bundle.short_description || bundle.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {bundle.promotional_price?.toLocaleString() || bundle.bundle_price.toLocaleString()} {bundle.currency}
            </span>
            {bundle.promotional_price && (
              <span className="text-xl line-through text-muted-foreground">
                {bundle.bundle_price.toLocaleString()} {bundle.currency}
              </span>
            )}
          </div>
          
          {savings > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-600" />
              <span>Économisez {savings.toLocaleString()} {bundle.currency}</span>
            </div>
          )}
        </div>

        {/* Products preview */}
        {bundle.products && bundle.products.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Produits inclus :</p>
            <div className="grid grid-cols-2 gap-2">
              {bundle.products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <span className="line-clamp-1 flex-1">{product.name}</span>
                </div>
              ))}
              {bundle.products.length > 4 && (
                <div className="flex items-center justify-center p-2 rounded-lg bg-muted/50 text-sm">
                  +{bundle.products.length - 4} autres
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{bundle.total_sales}</div>
            <div className="text-xs text-muted-foreground">Ventes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {bundle.total_revenue.toLocaleString()} {bundle.currency}
            </div>
            <div className="text-xs text-muted-foreground">Revenus</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{bundle.total_downloads}</div>
            <div className="text-xs text-muted-foreground">Téléchargements</div>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
          >
            Voir détails
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handlePurchase();
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Acheter
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

/**
 * Bundle Grid - Grille de bundles
 */
export const DigitalBundlesGrid = ({
  bundles,
  loading,
  variant = 'default',
  onView,
  onPurchase,
}: {
  bundles: DigitalProductBundle[];
  loading?: boolean;
  variant?: 'default' | 'featured' | 'compact';
  onView?: (bundleId: string) => void;
  onPurchase?: (bundleId: string) => void;
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted" />
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bundles.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun bundle disponible</h3>
          <p className="text-muted-foreground">
            Créez votre premier bundle pour commencer à vendre
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bundles.map((bundle) => (
        <DigitalBundleCard
          key={bundle.id}
          bundle={bundle}
          variant={variant}
          onView={onView}
          onPurchase={onPurchase}
        />
      ))}
    </div>
  );
};

