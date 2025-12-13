/**
 * PhysicalProductCard - Carte spécialisée pour les produits physiques
 * Mise en avant des informations spécifiques : stock, livraison, dimensions
 *
 * Date: 31 Janvier 2025
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  ShoppingCart,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Ruler,
  Weight,
  MapPin,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { PhysicalProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';

interface PhysicalProductCardProps {
  product: PhysicalProduct;
  variant?: 'marketplace' | 'store' | 'compact';
  onAction?: (action: 'view' | 'buy', product: PhysicalProduct) => void;
  className?: string;
}

export function PhysicalProductCard({
  product,
  variant = 'marketplace',
  onAction,
  className,
}: PhysicalProductCardProps) {
  const isCompact = variant === 'compact';
  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);

  // URL du produit
  const productUrl = useMemo(
    () =>
      product.store?.slug
        ? `/stores/${product.store.slug}/products/${product.slug}`
        : `/products/${product.slug}`,
    [product.store?.slug, product.slug]
  );

  // Statut du stock
  const stockStatus = useMemo(() => {
    if (product.stock === undefined || product.stock === null) {
      return {
        label: 'Stock limité',
        color: 'text-yellow-600',
        icon: AlertTriangle,
        badge: 'warning',
      };
    }
    if (product.stock === 0) {
      return {
        label: 'Rupture de stock',
        color: 'text-red-600',
        icon: AlertTriangle,
        badge: 'destructive',
      };
    }
    if (product.stock < 10) {
      return {
        label: `Stock faible (${product.stock})`,
        color: 'text-orange-600',
        icon: AlertTriangle,
        badge: 'warning',
      };
    }
    return {
      label: `En stock (${product.stock})`,
      color: 'text-green-600',
      icon: CheckCircle2,
      badge: 'default',
    };
  }, [product.stock]);

  // Dimensions formatées
  const dimensionsDisplay = useMemo(() => {
    if (!product.dimensions) return null;
    const { length, width, height } = product.dimensions;
    return `${length} × ${width} × ${height} cm`;
  }, [product.dimensions]);

  const StockIcon = stockStatus.icon;

  return (
    <Card
      className={cn(
        'group relative flex flex-col h-full',
        'bg-transparent border border-gray-200 dark:border-gray-700',
        'rounded-xl overflow-hidden',
        'min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]',
        'hover:shadow-lg transition-all duration-300',
        className
      )}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-muted/30 flex-grow min-h-[280px] sm:min-h-[320px]">
        {product.image_url ? (
          <ResponsiveProductImage
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover product-image group-hover:scale-105 transition-transform duration-500"
            priority={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <Package className="h-16 w-16 text-gray-400 opacity-30" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          <Badge variant="default" className="bg-green-600 text-white font-semibold shadow-lg">
            Physique
          </Badge>

          {stockStatus.badge === 'destructive' && (
            <Badge variant="destructive" className="shadow-lg">
              Rupture
            </Badge>
          )}

          {stockStatus.badge === 'warning' &&
            product.stock !== undefined &&
            product.stock !== null &&
            product.stock > 0 && (
              <Badge
                variant="outline"
                className="bg-orange-500 text-white border-orange-600 shadow-lg"
              >
                Stock faible
              </Badge>
            )}
        </div>

        {/* Badge promotion si applicable */}
        {priceInfo.originalPrice && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="destructive" className="shadow-lg">
              -{priceInfo.discount}%
            </Badge>
          </div>
        )}

        {/* Badge livraison gratuite */}
        {'free_shipping' in product && product.free_shipping && (
          <div className="absolute bottom-2 right-2 z-10">
            <Badge
              variant="default"
              className="bg-blue-600 text-white shadow-lg flex items-center gap-1"
            >
              <Truck className="h-3 w-3" />
              Livraison gratuite
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6">
        {/* Titre */}
        <h3
          id={`product-title-${product.id}`}
          className={cn(
            'font-semibold leading-tight line-clamp-2 mb-2',
            'text-base sm:text-lg lg:text-xl',
            'text-gray-900 dark:text-white',
            isCompact && 'text-sm'
          )}
        >
          {product.name}
        </h3>

        {/* Informations spécifiques */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs sm:text-sm">
          {/* Statut stock */}
          <div className={cn('flex items-center gap-1.5 font-medium', stockStatus.color)}>
            <StockIcon className="h-3.5 w-3.5" />
            <span>{stockStatus.label}</span>
          </div>

          {/* Dimensions */}
          {dimensionsDisplay && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Ruler className="h-3.5 w-3.5" />
              <span>{dimensionsDisplay}</span>
            </div>
          )}

          {/* Poids */}
          {product.weight && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Weight className="h-3.5 w-3.5" />
              <span>{product.weight} kg</span>
            </div>
          )}

          {/* Localisation livraison */}
          {product.shipping_required !== false && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>Livraison requise</span>
            </div>
          )}
        </div>

        {/* Variations disponibles */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              {product.variants.length} variation{product.variants.length > 1 ? 's' : ''} disponible
              {product.variants.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* SKU si disponible */}
        {product.sku && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Réf: {product.sku}</div>
        )}

        {/* Prix et Actions */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-baseline gap-2">
              {priceInfo.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(priceInfo.originalPrice, product.currency)}
                </span>
              )}
              <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatPrice(priceInfo.price, product.currency)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              to={productUrl}
              className="flex-1"
              aria-label={`Voir les détails de ${product.name}`}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-amber-500 text-white"
                onClick={() => onAction?.('view', product)}
                disabled={product.stock === 0}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Voir
              </Button>
            </Link>
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onAction?.('buy', product)}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              {product.stock === 0 ? 'Épuisé' : 'Acheter'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Optimisation avec React.memo
export const MemoizedPhysicalProductCard = React.memo(
  PhysicalProductCard,
  (prevProps, nextProps) => {
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.updated_at === nextProps.product.updated_at &&
      prevProps.variant === nextProps.variant
    );
  }
);

MemoizedPhysicalProductCard.displayName = 'PhysicalProductCard';

export default PhysicalProductCard;
