/**
 * ServiceProductCard - Carte spécialisée pour les services
 * Mise en avant des informations spécifiques : durée, localisation, calendrier
 * Améliorée avec les mêmes éléments que DigitalProductCard (Featured, Rating, Favoris, etc.)
 *
 * Date: 31 Janvier 2025
 * Dernière mise à jour: 2 Février 2025
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateProductUrl } from '@/lib/store-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  MapPin,
  ShoppingCart,
  Eye,
  CheckCircle2,
  Users,
  Star,
  Heart,
  TrendingUp,
  Sparkles,
  Store,
  CheckCircle,
  MessageSquare,
  FileText,
  Zap,
  Shield,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { ServiceProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice, formatDuration } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { useToast } from '@/hooks/use-toast';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import {
  ServicePricingTypeBadge,
  ServiceDepositBadge,
  ServiceCancellationBadge,
  ServiceMaxParticipantsBadge,
} from '@/components/products/ServicePricingBadges';
import { useMarketplaceGuestBuy } from '@/hooks/marketplace/useMarketplaceGuestBuy';
import { MarketplaceGuestBuyDialogs } from '@/components/marketplace/MarketplaceGuestBuyDialogs';
import {
  MarketplaceProductCardActions,
  MarketplaceProductCardPriceRow,
} from '@/components/marketplace/MarketplaceProductCardActions';
import { Loader2 } from 'lucide-react';

interface ServiceProductCardProps {
  product: ServiceProduct;
  variant?: 'marketplace' | 'store' | 'compact';
  onAction?: (action: 'view' | 'buy', product: ServiceProduct) => void;
  className?: string;
}

export function ServiceProductCard({
  product,
  variant = 'marketplace',
  onAction,
  className,
}: ServiceProductCardProps) {
  const isCompact = variant === 'compact';
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);
  const marketplaceBuy = useMarketplaceGuestBuy({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      store_id: product.store_id,
      product_type: 'service',
      currency: product.currency,
      payment_options: product.payment_options,
    },
    price: priceInfo.price,
    storeSlug: product.store?.slug,
  });

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
        ? generateProductUrl(product.store.slug, product.slug, product.store?.subdomain)
        : `/products/${product.slug}`,
    [product.store?.slug, product.store?.subdomain, product.slug]
  );

  // Labels de localisation
  const locationLabels: Record<string, string> = {
    online: 'En ligne',
    on_site: 'Sur site',
    customer_location: 'Chez vous',
  };

  // Labels de type de service
  const serviceTypeLabels: Record<string, string> = {
    appointment: 'Rendez-vous',
    class: 'Cours',
    event: 'Événement',
    consultation: 'Consultation',
    other: 'Service',
  };

  // Durée formatée
  const durationDisplay = useMemo(() => {
    if (!product.duration) return 'Sur mesure';
    return formatDuration(product.duration, product.duration_unit);
  }, [product.duration, product.duration_unit]);

  return (
    <Card
      className={cn(
        'group relative flex flex-col h-full',
        variant === 'marketplace'
          ? 'mp-product-card border-0'
          : 'bg-transparent border border-gray-200 dark:border-gray-700',
        'rounded-xl overflow-hidden',
        'min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]',
        'hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
        'cursor-pointer',
        product.is_featured && 'border-primary border-2',
        className
      )}
      style={{ willChange: 'transform' }}
      role="article"
      aria-labelledby={`service-title-${product.id}`}
      aria-describedby={`service-price-${product.id}`}
    >
      {/* Image - Ratio 3:2 aligné avec le format produit 1536×1024 */}
      <div
        className={cn(
          'relative w-full overflow-hidden aspect-[3/2]',
          variant === 'marketplace' ? 'mp-product-card__image' : 'bg-muted/30'
        )}
      >
        <Link to={productUrl} className="block w-full h-full">
          {product.image_url ? (
            <ResponsiveProductImage
              src={product.image_url}
              alt={product.name}
              className="w-full h-full product-image group-hover:scale-110 transition-transform duration-300"
              priority={true}
              fit="contain"
              fill={true}
              context="grid"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <Calendar className="h-16 w-16 text-gray-400 opacity-30" />
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
          {product.calendar_available && (
            <Button size="sm" asChild>
              <Link to={productUrl}>
                <Calendar className="h-4 w-4 mr-2" />
                Réserver
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
            id={`service-title-${product.id}`}
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

          {/* Badge Type de service */}
          <Badge
            variant="default"
            className="bg-purple-600 text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5"
          >
            {serviceTypeLabels[product.service_type || 'other'] || 'Service'}
          </Badge>

          {/* Badge Calendrier */}
          {product.calendar_available && (
            <Badge
              variant="default"
              className="bg-green-600 text-white flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5"
            >
              <Calendar className="h-3 w-3" />
              Calendrier
            </Badge>
          )}

          {/* Badge Réservation requise */}
          {product.booking_required && !product.calendar_available && (
            <Badge
              variant="secondary"
              className="bg-blue-600 text-white text-[10px] sm:text-xs px-2 py-0.5"
            >
              Réservation requise
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
          {/* Badge "En préparation" ou "Instantané" */}
          {product.calendar_available ? (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Instantanée</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>En préparation</span>
            </div>
          )}

          {/* Durée */}
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="font-medium">{durationDisplay}</span>
          </div>

          {/* Localisation */}
          {product.location_type && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{locationLabels[product.location_type] || product.location_type}</span>
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

        {/* Badges spécifiques Service - Tarification et Options */}
        <div className="flex flex-wrap gap-2 mb-2">
          <ServicePricingTypeBadge
            pricingType={(product as { pricing_type?: string | null }).pricing_type}
            size="sm"
          />
          <ServiceDepositBadge
            depositRequired={(product as { deposit_required?: boolean }).deposit_required}
            depositAmount={(product as { deposit_amount?: number | null }).deposit_amount}
            depositType={(product as { deposit_type?: string | null }).deposit_type}
            currency={product.currency || 'XOF'}
            size="sm"
          />
          <ServiceCancellationBadge
            allowCancellation={
              (product as { allow_booking_cancellation?: boolean }).allow_booking_cancellation
            }
            cancellationDeadlineHours={
              (product as { cancellation_deadline_hours?: number | null })
                .cancellation_deadline_hours
            }
            size="sm"
          />
          <ServiceMaxParticipantsBadge
            maxParticipants={(product as { max_participants?: number | null }).max_participants}
            size="sm"
          />
        </div>

        {/* Disponibilité calendrier */}
        {product.calendar_available && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-800 dark:text-green-200">
              Calendrier disponible - Réservez maintenant
            </span>
          </div>
        )}

        {/* Réservation requise */}
        {product.booking_required && !product.calendar_available && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Réservation requise - Contactez le vendeur
            </span>
          </div>
        )}

        {/* Prix et Actions - Style identique à la carte digitale */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <MarketplaceProductCardPriceRow
            priceId={`service-price-${product.id}`}
            alertSlot={
              <PriceStockAlertButton
                productId={product.id}
                productName={product.name}
                currentPrice={priceInfo.price}
                currency={product.currency || 'XOF'}
                productType="service"
                variant="outline"
                size="sm"
              />
            }
          >
            {priceInfo.originalPrice && (
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(priceInfo.originalPrice, product.currency)}
              </span>
            )}
            <span className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              {priceInfo.price === 0 ? 'Gratuit' : formatPrice(priceInfo.price, product.currency)}
            </span>
          </MarketplaceProductCardPriceRow>

          <MarketplaceProductCardActions
            productId={product.id}
            productName={product.name}
            productUrl={productUrl}
            storeId={product.store_id}
            buyLabel={marketplaceBuy.cta.buyLabel}
            buyAriaLabel={`${marketplaceBuy.cta.buyAriaVerb} ${product.name}`}
            buyLoading={marketplaceBuy.loading}
            buyIcon={product.calendar_available ? 'calendar' : 'cart'}
            onView={() => onAction?.('view', product)}
            onBuy={e => {
              e.preventDefault();
              e.stopPropagation();
              onAction?.('buy', product);
              void marketplaceBuy.handleBuyClick();
            }}
          />
        </div>
      </div>

      <MarketplaceGuestBuyDialogs
        product={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          store_id: product.store_id,
          product_type: 'service',
          currency: product.currency,
          payment_options: product.payment_options,
        }}
        price={priceInfo.price}
        guestOpen={marketplaceBuy.guestOpen}
        setGuestOpen={marketplaceBuy.setGuestOpen}
        physicalOpen={marketplaceBuy.physicalOpen}
        setPhysicalOpen={marketplaceBuy.setPhysicalOpen}
        loading={marketplaceBuy.loading}
        onGuestConfirm={marketplaceBuy.proceedWithCustomer}
      />
    </Card>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const MemoizedServiceProductCard = React.memo(ServiceProductCard, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.is_featured === nextProps.product.is_featured &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.rating === nextProps.product.rating &&
    prevProps.product.reviews_count === nextProps.product.reviews_count &&
    prevProps.product.calendar_available === nextProps.product.calendar_available &&
    prevProps.product.booking_required === nextProps.product.booking_required &&
    prevProps.product.created_at === nextProps.product.created_at &&
    prevProps.variant === nextProps.variant &&
    prevProps.onAction === nextProps.onAction
  );
});

MemoizedServiceProductCard.displayName = 'ServiceProductCard';

/**
 * Skeleton pour loading state
 */
export const ServiceProductCardSkeleton = () => {
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

export default ServiceProductCard;
