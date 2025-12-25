/**
 * PhysicalProductCard - Carte spécialisée pour les produits physiques
 * Mise en avant des informations spécifiques : stock, livraison, dimensions
 * Améliorée avec les mêmes éléments que DigitalProductCard (Featured, Rating, Favoris, etc.)
 * Style identique à la carte produit digitale
 *
 * Date: 31 Janvier 2025
 * Dernière mise à jour: 2 Février 2025
 */

import React, { useMemo, useState, useCallback } from 'react';
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
  Star,
  Heart,
  TrendingUp,
  Sparkles,
  Store,
  CheckCircle,
  MessageSquare,
  Zap,
  FileText,
  Shield,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { PhysicalProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { useToast } from '@/hooks/use-toast';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import { PhysicalSizeChartBadge } from '@/components/products/PhysicalInfoBadges';

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
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);
  const imageSizes =
    variant === 'compact'
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw';

  // Vérifier si le produit est nouveau (< 7 jours)
  const isNew = useMemo(() => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff < 7;
  }, [product.created_at]);

  // Gérer les favoris
  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFavorite(prev => {
        const newValue = !prev;
        toast({
          title: prev ? 'Retiré des favoris' : 'Ajouté aux favoris',
          description: prev
            ? `${product.name} a été retiré de vos favoris`
            : `${product.name} a été ajouté à vos favoris`,
        });
        return newValue;
      });
    },
    [product.name, toast]
  );

  // Rendre les étoiles pour le rating
  const renderStars = useCallback(
    (rating: number) => (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-3 w-3 sm:h-4 sm:w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    ),
    []
  );

  // Gestion du taux d'affiliation
  const affiliateSettings = useMemo(() => {
    if (product.product_affiliate_settings) {
      if (Array.isArray(product.product_affiliate_settings)) {
        return product.product_affiliate_settings[0] || null;
      }
      return product.product_affiliate_settings;
    }
    return null;
  }, [product.product_affiliate_settings]);

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
        'hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
        'cursor-pointer',
        product.is_featured && 'border-primary border-2',
        className
      )}
      style={{ willChange: 'transform' }}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-price-${product.id}`}
    >
      {/* Image - Ratio 3:2 aligné avec le format produit 1536×1024 */}
      <div className="relative w-full overflow-hidden bg-muted/30 aspect-[3/2]">
        <Link to={productUrl} className="block w-full h-full">
          {product.image_url ? (
            <ResponsiveProductImage
              src={product.image_url}
              alt={product.name}
              sizes={imageSizes}
              className="w-full h-full product-image group-hover:scale-110 transition-transform duration-300"
              fit="contain"
              fill={true}
              context="grid"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <Package className="h-16 w-16 text-gray-400 opacity-30" />
            </div>
          )}
        </Link>

        {/* Overlay gradient au hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link to={productUrl}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Link>
          </Button>
          {product.stock !== 0 && (
            <Button size="sm" asChild>
              <Link to={productUrl}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Acheter
              </Link>
            </Button>
          )}
        </div>

        {/* Badge promotion en haut à droite - Optimisé mobile */}
        {priceInfo.originalPrice && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
            <Badge
              variant="destructive"
              className="shadow-lg text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1"
            >
              -{priceInfo.discount}%
            </Badge>
          </div>
        )}

        {/* Bouton favori en bas à droite - Touch target optimisé mobile */}
        <button
          onClick={handleFavorite}
          className="absolute bottom-2 right-2 p-2.5 sm:p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 z-10 touch-manipulation active:scale-90 transition-transform min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          aria-label={
            isFavorite
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          aria-pressed={isFavorite}
        >
          <Heart
            className={`h-5 w-5 sm:h-4 sm:w-4 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-5 gap-2 sm:gap-3">
        {/* Logo et nom de la boutique (pour variant marketplace) */}
        {variant === 'marketplace' && product.store && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            {product.store.logo_url ? (
              <img
                src={product.store.logo_url}
                alt={`Logo de ${product.store.name}`}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {product.store.name}
            </span>
            <CheckCircle
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 -ml-2"
              aria-label="Vendeur vérifié"
            />
          </div>
        )}

        {/* Titre */}
        <Link to={productUrl}>
          <h3
            id={`product-title-${product.id}`}
            className={cn(
              'font-semibold leading-tight line-clamp-2 mb-3',
              'text-sm sm:text-base lg:text-lg',
              'text-white',
              'hover:text-primary transition-colors',
              isCompact && 'text-sm'
            )}
          >
            {product.name}
          </h3>
        </Link>

        {/* Badges d'information - Placés après le titre de manière professionnelle */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {/* Badge Nouveau */}
          {isNew && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5 shadow-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Nouveau
            </Badge>
          )}

          {/* Badge Featured/Vedette */}
          {product.is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5 shadow-sm">
              <Star className="h-3 w-3 mr-1 fill-white" />
              Vedette
            </Badge>
          )}

          {/* Badge Type */}
          <Badge
            variant="default"
            className="bg-green-600 text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5"
          >
            Physique
          </Badge>

          {/* Badge Stock */}
          {stockStatus.badge === 'destructive' && (
            <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 py-0.5">
              Rupture
            </Badge>
          )}

          {stockStatus.badge === 'warning' &&
            product.stock !== undefined &&
            product.stock !== null &&
            product.stock > 0 && (
              <Badge
                variant="outline"
                className="bg-orange-500 text-white border-orange-600 text-[10px] sm:text-xs px-2 py-0.5"
              >
                Stock faible
              </Badge>
            )}

          {/* Badge Livraison gratuite */}
          {'free_shipping' in product && product.free_shipping && (
            <Badge
              variant="default"
              className="bg-blue-600 text-white flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5"
            >
              <Truck className="h-3 w-3" />
              Livraison gratuite
            </Badge>
          )}

          {/* Badge Modèle de tarification */}
          <PricingModelBadge
            pricingModel={(product as { pricing_model?: string | null }).pricing_model}
            size="sm"
          />

          {/* Badge Options de paiement */}
          <PaymentOptionsBadge
            paymentOptions={getPaymentOptions(
              product as {
                payment_options?: {
                  payment_type?: 'full' | 'percentage' | 'delivery_secured';
                  percentage_rate?: number;
                } | null;
              }
            )}
            size="sm"
          />

          {/* Badge Guide des tailles */}
          <PhysicalSizeChartBadge
            sizeChartId={(product as { size_chart_id?: string | null }).size_chart_id}
            sizeChartName={(product as { size_chart_name?: string | null }).size_chart_name}
            productSlug={product.slug}
            storeSlug={product.store?.slug}
            size="sm"
          />
        </div>

        {/* Rating et avis */}
        {!product.hide_rating && (product.rating || product.reviews_count) && (
          <div className="flex items-center gap-2 mb-2">
            {product.rating && product.rating > 0 ? (
              <>
                {renderStars(product.rating)}
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {product.rating.toFixed(1)}
                </span>
                {!product.hide_reviews_count && product.reviews_count && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({product.reviews_count})
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                <span className="text-xs sm:text-sm">Vérifié</span>
              </div>
            )}
          </div>
        )}

        {/* Détails/Badges avec icônes - Style identique à la carte digitale */}
        <div className="flex flex-wrap gap-2 mb-2 text-xs sm:text-sm">
          {/* Badge "Instantané" ou "En préparation" - Toujours disponible pour physique */}
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Instantanée</span>
          </div>

          {/* Statut stock */}
          <div className={cn('flex items-center gap-1.5 font-medium', stockStatus.color)}>
            <StockIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>{stockStatus.label}</span>
          </div>

          {/* Dimensions */}
          {dimensionsDisplay && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Ruler className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{dimensionsDisplay}</span>
            </div>
          )}

          {/* Poids */}
          {product.weight && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Weight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{product.weight} kg</span>
            </div>
          )}

          {/* Localisation livraison */}
          {product.shipping_required !== false && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Livraison requise</span>
            </div>
          )}

          {/* Badge Type de licence - Style comme DigitalProductCard */}
          {product.licensing_type && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                product.licensing_type === 'plr' &&
                  'border-emerald-500 text-emerald-600 dark:text-emerald-400',
                product.licensing_type === 'copyrighted' &&
                  'border-red-500 text-red-600 dark:text-red-400',
                product.licensing_type === 'standard' &&
                  'border-blue-500 text-blue-600 dark:text-blue-400'
              )}
            >
              {product.licensing_type === 'plr'
                ? 'PLR'
                : product.licensing_type === 'copyrighted'
                  ? "Droit d'auteur"
                  : 'Standard'}
            </Badge>
          )}

          {/* Badge commission affiliation - Style comme dans l'image */}
          {affiliateSettings?.affiliate_enabled && affiliateSettings?.commission_rate > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
              title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {affiliateSettings.commission_rate}% commission
            </Badge>
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

        {/* Prix et Actions - Style identique à la carte digitale */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Prix - Style exact de l'image */}
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
              {priceInfo.originalPrice && (
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                  {formatPrice(priceInfo.originalPrice, product.currency)}
                </span>
              )}
              <span
                id={`product-price-${product.id}`}
                className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap"
              >
                {priceInfo.price === 0 ? 'Gratuit' : formatPrice(priceInfo.price, product.currency)}
              </span>
            </div>
            <PriceStockAlertButton
              productId={product.id}
              productName={product.name}
              currentPrice={priceInfo.price}
              currency={product.currency || 'XOF'}
              productType="physical"
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            />
          </div>

          {/* Boutons d'action - 3 boutons horizontaux comme dans l'image */}
          <div className="flex gap-2">
            {/* Bouton JAUNE "Voir" */}
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-amber-500 text-white font-medium"
              asChild
              disabled={product.stock === 0}
            >
              <Link
                to={productUrl}
                aria-label={`Voir les détails de ${product.name}`}
                onClick={() => onAction?.('view', product)}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Voir
              </Link>
            </Button>

            {/* Bouton VIOLET "Contacter" */}
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium"
              asChild
            >
              <Link
                to={
                  product.store_id
                    ? `/vendor/messaging/${product.store_id}?productId=${product.id}`
                    : productUrl
                }
                aria-label={`Contacter le vendeur pour ${product.name}`}
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Contacter
              </Link>
            </Button>

            {/* Bouton BLEU "Acheter" */}
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              asChild
              disabled={product.stock === 0}
            >
              <Link
                to={productUrl}
                aria-label={
                  product.stock === 0 ? `${product.name} est épuisé` : `Acheter ${product.name}`
                }
                onClick={() => product.stock !== 0 && onAction?.('buy', product)}
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                {product.stock === 0 ? 'Épuisé' : 'Acheter'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const MemoizedPhysicalProductCard = React.memo(
  PhysicalProductCard,
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter re-renders inutiles
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.is_featured === nextProps.product.is_featured &&
      prevProps.product.image_url === nextProps.product.image_url &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.rating === nextProps.product.rating &&
      prevProps.product.reviews_count === nextProps.product.reviews_count &&
      prevProps.product.stock === nextProps.product.stock &&
      prevProps.product.free_shipping === nextProps.product.free_shipping &&
      prevProps.product.created_at === nextProps.product.created_at &&
      prevProps.variant === nextProps.variant &&
      prevProps.onAction === nextProps.onAction
    );
  }
);

MemoizedPhysicalProductCard.displayName = 'PhysicalProductCard';

/**
 * Skeleton pour loading state
 */
export const PhysicalProductCardSkeleton = () => {
  return (
    <Card>
      <div className="aspect-[3/2] bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
        </div>
        <div className="h-8 bg-muted rounded animate-pulse w-32" />
      </div>
    </Card>
  );
};

export default PhysicalProductCard;
