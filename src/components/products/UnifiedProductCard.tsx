/**
 * UnifiedProductCard - Carte produit unifiée pour tous les types
 * S'adapte dynamiquement selon le type de produit (digital, physical, service, course)
 * Gère les fallbacks intelligents et l'affiliation
 * 
 * Inspiré de: ComeUp, Gumroad, Lemonsqueezy
 * Optimisé pour mobile avec React.memo et LazyImage
 */

import React, { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, Eye, Percent, MessageSquare, Store, CheckCircle, TrendingUp, Shield } from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { LazyImage } from '@/components/ui/lazy-image';
import { UnifiedProductCardProps, DigitalProduct } from '@/types/unified-product';
import {
  getProductKeyInfo,
  getProductTypeBadge,
  getDisplayPrice,
  formatPrice,
  getProductImage,
  getRatingDisplay,
  hasPromotion,
} from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';

const UnifiedProductCardComponent: React.FC<UnifiedProductCardProps> = ({
  product,
  variant = 'marketplace',
  showAffiliate = true,
  showActions = true,
  onAction,
  className,
}) => {
  const isCompact = variant === 'compact';

  // Mémoriser les données formatées pour éviter les recalculs
  const typeBadge = useMemo(() => getProductTypeBadge(product), [product]);
  const keyInfo = useMemo(() => getProductKeyInfo(product), [product]);
  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);
  const ratingInfo = useMemo(
    () => getRatingDisplay(product.rating, product.review_count),
    [product.rating, product.review_count]
  );
  const productImage = useMemo(() => getProductImage(product), [product]);

  // Mémoriser l'URL du produit
  const productUrl = useMemo(
    () =>
      product.store?.slug
        ? `/stores/${product.store.slug}/products/${product.slug}`
        : `/products/${product.slug}`,
    [product.store?.slug, product.slug]
  );

  // Mémoriser les handlers pour éviter les re-renders
  const handleAction = useCallback(
    (action: 'view' | 'buy' | 'favorite', e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      onAction?.(action, product);
    },
    [onAction, product]
  );

  return (
    <Card
      className={cn(
        // Base structure
        'group relative flex flex-col h-full',
        'bg-transparent border border-gray-200',
        'rounded-xl overflow-hidden',
        
        
        // Height responsive
        'min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]',
        
        className
      )}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-price-${product.id}`}
      tabIndex={0}
    >
      {/* Image Section - Prend plus d'espace, contenu repoussé en bas */}
      <div className="relative w-full overflow-hidden bg-muted/30 flex-grow min-h-[250px] sm:min-h-[300px]">
        {productImage ? (
          <ResponsiveProductImage
            src={productImage}
            alt={product.name}
            className="w-full h-full object-cover product-image"
            priority={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-transparent">
            <ShoppingCart className="h-16 w-16 text-gray-400 opacity-20" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {/* Type Badge */}
          <Badge
            variant="default"
            className={cn('text-white font-semibold bg-blue-600', typeBadge.color)}
          >
            {typeBadge.label}
          </Badge>

          {/* Promotion Badge */}
          {hasPromotion(product) && priceInfo.discount && (
            <Badge variant="destructive" className="flex items-center gap-1" aria-label={`Réduction de ${priceInfo.discount}%`}>
              <Percent className="h-3 w-3" aria-hidden="true" />
              -{priceInfo.discount}%
            </Badge>
          )}
        </div>

      </div>

      {/* Content Section - Spacing professionnel responsive - Optimisé mobile */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6">
        {/* Logo et nom de la boutique */}
        {product.store && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {product.store.logo_url ? (
              <LazyImage
                src={product.store.logo_url}
                alt={`Logo de ${product.store.name}`}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                skeletonClassName="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {product.store.name}
            </span>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 -ml-2" aria-label="Vendeur vérifié" />
          </div>
        )}

        {/* Title - Typographie hiérarchisée */}
        <h3
          id={`product-title-${product.id}`}
          className={cn(
            'font-semibold leading-tight line-clamp-2 mb-2',
            'text-base sm:text-lg',
            'text-white',
            isCompact && 'text-sm'
          )}
        >
          {product.name}
        </h3>

        {/* Rating - Spacing cohérent */}
        {ratingInfo.hasRating && (
          <div className="flex items-center gap-1.5 mb-3" role="img" aria-label={`Note: ${ratingInfo.rating} sur 5 étoiles, ${product.review_count || 0} avis`}>
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors',
                    star <= Math.round(ratingInfo.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-400'
                  )}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-gray-600">
              {ratingInfo.display}
            </span>
          </div>
        )}

        {/* Key Info - Spacing vertical cohérent */}
        {!isCompact && (keyInfo.length > 0 || (() => {
          // Vérifier si on doit afficher le badge d'affiliation
          let affiliateSettings = null;
          if (product.product_affiliate_settings) {
            if (Array.isArray(product.product_affiliate_settings)) {
              affiliateSettings = product.product_affiliate_settings.length > 0 
                ? product.product_affiliate_settings[0] 
                : null;
            } else {
              affiliateSettings = product.product_affiliate_settings;
            }
          }
          return affiliateSettings?.affiliate_enabled && affiliateSettings?.commission_rate > 0;
        })()) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {keyInfo.slice(0, 2).map((info, index) => {
              const Icon = info.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-1.5 text-xs sm:text-sm',
                    info.badge ? 'text-blue-600 font-medium' : 'text-gray-600'
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span className="truncate">{info.value}</span>
                </div>
              );
            })}
            
            {/* Badge taux d'affiliation - Aligné avec "En préparation" et "Instantanée" */}
            {(() => {
              // Gérer le cas où Supabase retourne un objet, un tableau, ou null
              let affiliateSettings = null;
              
              if (product.product_affiliate_settings) {
                if (Array.isArray(product.product_affiliate_settings)) {
                  affiliateSettings = product.product_affiliate_settings.length > 0 
                    ? product.product_affiliate_settings[0] 
                    : null;
                } else {
                  affiliateSettings = product.product_affiliate_settings;
                }
              }
              
              // Afficher le badge si l'affiliation est activée et le taux > 0
              if (affiliateSettings?.affiliate_enabled && affiliateSettings?.commission_rate > 0) {
                return (
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                    <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 text-white" />
                    <span className="text-white font-medium truncate">
                      {affiliateSettings.commission_rate}% commission
                    </span>
                  </div>
                );
              }
              
              return null;
            })()}
            
            {/* Badge PLR - Après le badge de commission */}
            {product.type === 'digital' && (product as DigitalProduct).licensing_type === 'plr' && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Shield className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                <span className="text-emerald-500 font-medium truncate">
                  PLR
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price et Actions - Séparateur élégant */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1" id={`product-price-${product.id}`}>
              {priceInfo.originalPrice && (
                <span className="text-xs sm:text-sm md:text-base text-gray-600 line-through flex-shrink-0 whitespace-nowrap" aria-label={`Prix original: ${formatPrice(priceInfo.originalPrice, product.currency)}`}>
                  {formatPrice(priceInfo.originalPrice, product.currency)}
                </span>
              )}
              <span className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-blue-600 whitespace-nowrap" aria-label={`Prix: ${formatPrice(priceInfo.price, product.currency)}`}>
                {formatPrice(priceInfo.price, product.currency)}
              </span>
            </div>
            <PriceStockAlertButton
              productId={product.id}
              productName={product.name}
              currentPrice={priceInfo.price}
              currency={product.currency || 'XOF'}
              productType={product.type}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            />
          </div>

          {/* Actions - Boutons premium - Touch targets optimisés mobile */}
          {showActions && (
            <div className="flex gap-2 sm:gap-2 md:gap-3">
              <Link to={productUrl} className="flex-1" aria-label={`Voir les détails de ${product.name}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-11 sm:h-8 md:h-9 text-xs sm:text-xs text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-amber-500 transition-all duration-200 px-3 sm:px-3 touch-manipulation active:scale-95"
                  onClick={() => handleAction('view')}
                  aria-label={`Voir les détails de ${product.name}`}
                >
                  <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-white" aria-hidden="true" />
                  <span className="whitespace-nowrap text-white">Voir</span>
                </Button>
              </Link>
              {product.store?.id && (
                <Link to={`/vendor/messaging/${product.store.id}?productId=${product.id}`} className="flex-1" aria-label={`Contacter le vendeur pour ${product.name}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-11 sm:h-8 md:h-9 text-xs sm:text-xs text-white bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 border-purple-700 transition-all duration-200 px-3 sm:px-3 touch-manipulation active:scale-95"
                    aria-label={`Contacter le vendeur pour ${product.name}`}
                  >
                    <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0 text-white" aria-hidden="true" />
                    <span className="hidden sm:inline whitespace-nowrap text-white">Contacter</span>
                    <span className="sm:hidden text-white">Msg</span>
                  </Button>
                </Link>
              )}
              <Button
                size="sm"
                className="flex-1 h-11 sm:h-8 md:h-9 text-xs sm:text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-[1.02] px-3 sm:px-3 touch-manipulation active:scale-95"
                onClick={(e) => handleAction('buy', e)}
                aria-label={`Acheter ${product.name} pour ${formatPrice(priceInfo.price, product.currency)}`}
              >
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1 sm:mr-1.5 md:mr-2 flex-shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Acheter</span>
              </Button>
            </div>
          )}

        </div>
      </div>
    </Card>
  );
};

// Optimisation avec React.memo
export const UnifiedProductCard = React.memo(UnifiedProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.variant === nextProps.variant &&
    prevProps.showAffiliate === nextProps.showAffiliate
  );
});

UnifiedProductCard.displayName = 'UnifiedProductCard';

export default UnifiedProductCard;


