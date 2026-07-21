/**
 * BundleCard — achat direct via checkout mono-produit.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, TrendingDown, Star } from '@/components/icons';
import { buildCheckoutUrl } from '@/lib/checkout/checkout-route';
import { useToast } from '@/hooks/use-toast';
import type { DigitalProductBundle } from '@/hooks/digital/useDigitalBundles';

interface BundleCardProps {
  bundle: DigitalProductBundle;
  storeSlug: string;
}

const BundleCardComponent = ({ bundle, storeSlug: _storeSlug }: BundleCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const productId = bundle.product_id || bundle.id;
    if (!bundle.store_id || !productId) {
      toast({
        title: 'Erreur',
        description: 'Bundle non disponible',
        variant: 'destructive',
      });
      return;
    }

    navigate(
      buildCheckoutUrl({
        productId,
        storeId: bundle.store_id,
      })
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  return (
    <Card
      className="group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary transition-all duration-300 hover:shadow-xl rounded-lg"
      style={{ willChange: 'transform' }}
    >
      {/* Badge Bundle */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <Package className="h-3 w-3 mr-1" />
          Bundle
        </Badge>
      </div>

      {/* Badge Économie */}
      {(bundle.savings_percentage || bundle.discount_percentage) &&
        (bundle.savings_percentage || bundle.discount_percentage || 0) > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="destructive" className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />-
              {((bundle.savings_percentage || bundle.discount_percentage || 0) as number).toFixed(
                0
              )}
              %
            </Badge>
          </div>
        )}

      <Link to={`/bundles/${bundle.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {bundle.image_url ? (
            <img
              src={bundle.image_url}
              alt={bundle.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {bundle.name}
            </h3>
            {bundle.short_description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {bundle.short_description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(bundle.bundle_price)} {bundle.currency || 'XOF'}
              </p>
              {bundle.original_price && bundle.original_price > bundle.bundle_price && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(bundle.original_price)} {bundle.currency || 'XOF'}
                </p>
              )}
            </div>
            {bundle.is_featured && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                Populaire
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>

      <div className="px-4 pb-4">
        <Button onClick={handleBuyNow} className="w-full" size="sm">
          <ShoppingBag className="h-4 w-4 mr-2" />
          Acheter
        </Button>
      </div>
    </Card>
  );
};

export const BundleCard = React.memo(BundleCardComponent);
export default BundleCard;
