/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import React, { useMemo, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateProductUrl } from '@/lib/store-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Star,
  ShoppingCart,
  Eye,
  Percent,
  MessageSquare,
  Store,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  Shield,
  Heart,
  Play,
  ZoomIn,
  Loader2,
  Palette,
  Award,
  Package,
  User,
  Ruler,
  Calendar,
  Video,
  Zap,
  FileText,
  Truck,
  AlertTriangle,
  Weight,
  MapPin,
  Clock,
  Users,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { UnifiedProductCardProps } from '@/types/unified-product';
import {
  getProductKeyInfo,
  getProductTypeBadge,
  getDisplayPrice,
  formatPrice,
  getProductImage,
  getRatingDisplay,
  hasPromotion,
} from '@/lib/product-helpers';
import { formatDuration as formatDurationSeconds } from '@/lib/time-utils';
import { formatDuration } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMarketplaceGuestBuy } from '@/hooks/marketplace/useMarketplaceGuestBuy';
import { MarketplaceGuestBuyDialogs } from '@/components/marketplace/MarketplaceGuestBuyDialogs';
import {
  MarketplaceProductCardActions,
  MarketplaceProductCardPriceRow,
} from '@/components/marketplace/MarketplaceProductCardActions';

// Vertical-specific imports
import { ArtistImageCarousel } from '@/components/products/ArtistImageCarousel';
import { EditionLimitedBadge } from '@/components/artist/EditionLimitedBadge';
import {
  ArtistHandlingTimeBadge,
  ArtistSignatureBadge,
} from '@/components/products/ArtistInfoBadges';
import { PhysicalCheckoutMethodBadge } from '@/components/products/PhysicalCheckoutMethodBadge';
import { PhysicalSizeChartBadge } from '@/components/products/PhysicalInfoBadges';
import { PhysicalQuickOrderDialog } from '@/components/physical/PhysicalQuickOrderDialog';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import {
  ServicePricingTypeBadge,
  ServiceDepositBadge,
  ServiceCancellationBadge,
  ServiceMaxParticipantsBadge,
} from '@/components/products/ServicePricingBadges';
import {
  CourseDifficultyBadge,
  CourseLanguageBadge,
  CourseDurationBadge,
  CourseModulesBadge,
} from '@/components/products/CourseInfoBadges';

function isPremiumProductCardVariant(variant: UnifiedProductCardProps['variant']): boolean {
  return variant === 'marketplace' || variant === 'store';
}

const UnifiedProductCardComponent: React.FC<UnifiedProductCardProps> = ({
  product,
  variant = 'marketplace',
  showAffiliate = true,
  showActions = true,
  onAction,
  className,
  productCardStyle,
}) => {
  const { favorites, toggleFavorite } = useMarketplaceFavorites();
  const isFavorite = favorites.has(product.id);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [quickOrderOpen, setQuickOrderOpen] = useState(false);

  const isDigital = product.type === 'digital';
  const isArtist = product.type === 'artist';
  const isPhysical = product.type === 'physical';
  const isService = product.type === 'service';
  const isCourse = product.type === 'course';

  const typeBadge = useMemo(() => getProductTypeBadge(product), [product]);
  const keyInfo = useMemo(() => getProductKeyInfo(product), [product]);
  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);

  // Custom logic for different types
  const productImage = useMemo(() => getProductImage(product), [product]);
  const allArtistImages = useMemo(() => {
    if (product.type !== 'artist') return [];
    return product.images && product.images.length > 0
      ? product.images
      : product.image_url
        ? [product.image_url]
        : [];
  }, [product]);

  const isNew = useMemo(() => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff < 7;
  }, [product.created_at]);

  const productName =
    product.type === 'artist' ? product.artwork_title || product.name : product.name;

  const marketplaceBuy = useMarketplaceGuestBuy({
    product: {
      id: product.id,
      slug: product.slug,
      name: productName,
      store_id: product.store_id,
      product_type: product.type,
      currency: product.currency,
      payment_options:
        product.type === 'physical' || product.type === 'artist'
          ? product.payment_options
          : undefined,
    },
    price: priceInfo.price,
    storeSlug: product.store?.slug,
  });

  const productUrl = useMemo(
    () =>
      product.store?.slug
        ? generateProductUrl(product.store.slug, product.slug, product.store?.subdomain)
        : `/products/${product.slug}`,
    [product.store?.slug, product.store?.subdomain, product.slug]
  );

  const handleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleFavorite(product.id);
      onAction?.('favorite', product);
    },
    [product, toggleFavorite, onAction]
  );

  const handleZoomClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZoomOpen(true);
  }, []);

  const handleAction = useCallback(
    (action: 'view' | 'buy' | 'favorite', e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      onAction?.(action, product);
    },
    [onAction, product]
  );

  const isCompact = variant === 'compact';
  const isPremiumCard = isPremiumProductCardVariant(variant);
  const imageSizes =
    variant === 'compact'
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw';

  // --- Specific Helpers ---
  const physicalCheckoutDisplay = useMemo(
    () =>
      product.type === 'physical' ? parsePhysicalCheckoutOptions(product.payment_options) : null,
    [product]
  );

  const stockStatus = useMemo(() => {
    if (product.type !== 'physical') return null;
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
  }, [product]);

  const StockIcon = stockStatus?.icon || AlertTriangle;

  const affiliateSettings = useMemo(() => {
    if (product.product_affiliate_settings) {
      if (Array.isArray(product.product_affiliate_settings)) {
        return product.product_affiliate_settings.length > 0
          ? product.product_affiliate_settings[0]
          : null;
      }
      return product.product_affiliate_settings;
    }
    return null;
  }, [product.product_affiliate_settings]);

  const hasAffiliate =
    showAffiliate &&
    affiliateSettings?.affiliate_enabled &&
    (affiliateSettings?.commission_rate || 0) > 0;

  const storeCardStyleClass =
    variant === 'store' && productCardStyle
      ? `store-product-card store-product-card-${productCardStyle}`
      : variant === 'store'
        ? 'store-product-card'
        : undefined;

  return (
    <Card
      className={cn(
        'group relative flex flex-col h-full',
        storeCardStyleClass,
        isPremiumCard
          ? 'mp-product-card border-0'
          : 'bg-transparent border border-gray-200 dark:border-gray-700',
        'rounded-xl overflow-hidden',
        'min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]',
        'hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer',
        (product as any).is_featured && 'border-primary border-2',
        className
      )}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-price-${product.id}`}
      tabIndex={0}
    >
      {/* Image Section */}
      <div
        className={cn(
          'relative w-full overflow-hidden aspect-[3/2]',
          isPremiumCard ? 'mp-product-card__image' : 'bg-muted/30'
        )}
      >
        <Link to={productUrl} className="block w-full h-full">
          {product.type === 'artist' && allArtistImages.length > 1 ? (
            <ArtistImageCarousel
              images={allArtistImages}
              alt={productName}
              className="w-full h-full product-image group-hover:scale-110 transition-transform duration-300"
              priority={false}
            />
          ) : productImage ? (
            <ResponsiveProductImage
              src={productImage}
              alt={productName}
              sizes={imageSizes}
              context="grid"
              fit={variant === 'marketplace' || variant === 'store' ? 'contain' : 'cover'}
              fill={variant === 'marketplace' || variant === 'store' ? false : true}
              className={cn(
                'w-full transition-transform duration-300',
                variant === 'marketplace' || variant === 'store'
                  ? 'h-auto max-h-[320px] sm:max-h-[360px] group-hover:scale-110'
                  : 'h-full group-hover:scale-110'
              )}
              fallbackIcon={<ShoppingCart className="h-16 w-16 text-gray-400 opacity-20" />}
            />
          ) : (
            <div
              className={cn(
                'w-full h-full flex items-center justify-center',
                product.type === 'artist' &&
                  'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20',
                product.type === 'physical' &&
                  'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
                product.type === 'service' &&
                  'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
                product.type === 'course' &&
                  'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
                product.type === 'digital' && 'bg-muted'
              )}
            >
              {product.type === 'artist' && (
                <Palette className="h-16 w-16 text-gray-400 opacity-30" />
              )}
              {product.type === 'physical' && (
                <Package className="h-16 w-16 text-gray-400 opacity-30" />
              )}
              {product.type === 'service' && (
                <Calendar className="h-16 w-16 text-gray-400 opacity-30" />
              )}
              {product.type === 'course' && (
                <GraduationCap className="h-16 w-16 text-gray-400 opacity-30" />
              )}
              {product.type === 'digital' && (
                <ShoppingCart className="h-16 w-16 text-gray-400 opacity-20" />
              )}
            </div>
          )}
        </Link>

        {/* Absolute top-left artist badges */}
        {product.type === 'artist' && (
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-2">
            <ArtistHandlingTimeBadge handlingTimeDays={product.shipping_handling_time} size="sm" />
            <ArtistSignatureBadge
              signatureAuthenticated={product.signature_authenticated}
              size="sm"
            />
          </div>
        )}

        {/* Overlay gradient au hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link to={productUrl}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Link>
          </Button>

          {(isDigital || isArtist || isCourse) && (
            <Button size="sm" asChild>
              <Link to={productUrl}>
                {isArtist ? (
                  <Palette className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Découvrir
              </Link>
            </Button>
          )}

          {isDigital && productImage && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleZoomClick}
              className="relative z-10"
            >
              <ZoomIn className="h-4 w-4 mr-2" />
              Zoom
            </Button>
          )}

          {product.type === 'physical' && product.stock !== 0 && (
            <Button
              size="sm"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setQuickOrderOpen(true);
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Acheter
            </Button>
          )}

          {product.type === 'service' && product.calendar_available && (
            <Button size="sm" asChild>
              <Link to={productUrl}>
                <Calendar className="h-4 w-4 mr-2" />
                Réserver
              </Link>
            </Button>
          )}
        </div>

        {/* Discount Badge */}
        {hasPromotion(product) && priceInfo.discount && (
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-10">
            <Badge
              variant="destructive"
              className="shadow-lg text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1"
            >
              -{priceInfo.discount}%
            </Badge>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute bottom-2 right-2 p-2.5 sm:p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 z-10 touch-manipulation active:scale-90 transition-transform min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
        >
          <Heart
            className={`h-5 w-5 sm:h-4 sm:w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
          />
        </button>
      </div>

      {isDigital && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-4xl w-full p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Zoom</DialogTitle>
              <DialogDescription>Agrandie</DialogDescription>
            </DialogHeader>
            {productImage && (
              <div className="relative w-full aspect-[3/2] bg-muted">
                <ResponsiveProductImage
                  src={productImage}
                  alt={productName}
                  sizes="100vw"
                  context="detail"
                  fit="contain"
                  fill={true}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 gap-2">
        {/* Store Logo */}
        {product.store && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            {product.store.logo_url ? (
              <OptimizedImage
                src={product.store.logo_url}
                alt={product.store.name}
                width={28}
                height={28}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                placeholder="empty"
              />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Store className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
            <span className="text-xs sm:text-sm font-semibold text-white truncate">
              {product.store.name}
            </span>
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 -ml-2" />
          </div>
        )}

        {/* Artist specific: Artist Name */}
        {product.type === 'artist' && product.artist_name && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {product.artist_name}
            </span>
            <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0 -ml-2" />
          </div>
        )}

        {/* Title */}
        <Link to={productUrl}>
          <h3
            id={`product-title-${product.id}`}
            className={cn(
              'font-semibold leading-tight line-clamp-2 transition-colors',
              isPremiumCard
                ? 'mp-product-title text-white hover:text-primary'
                : 'text-white hover:text-primary',
              isCompact ? 'text-sm' : 'text-base sm:text-lg'
            )}
          >
            {productName}
          </h3>
        </Link>

        {product.type === 'physical' && physicalCheckoutDisplay && (
          <PhysicalCheckoutMethodBadge paymentOptions={product.payment_options} className="mb-2" />
        )}

        {/* Badges d'information */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
          {isNew && (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5">
              <Sparkles className="h-3 w-3 mr-1" /> Nouveau
            </Badge>
          )}
          {(product as any).is_featured && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5">
              <Star className="h-3 w-3 mr-1 fill-white" /> Vedette
            </Badge>
          )}

          {/* Type Badges */}
          {product.type === 'artist' ? (
            <>
              <Badge className="bg-pink-600 text-white text-[10px] sm:text-xs px-2 py-0.5">
                {product.artist_type || 'Artiste'}
              </Badge>
              {product.edition_type && (
                <Badge
                  variant="secondary"
                  className="bg-purple-600 text-white text-[10px] sm:text-xs px-2 py-0.5"
                >
                  {product.edition_type}
                </Badge>
              )}
              {product.certificate_of_authenticity && (
                <Badge className="bg-green-600 text-white flex items-center text-[10px] sm:text-xs px-2 py-0.5">
                  <Shield className="h-3 w-3 mr-1" /> Certifié
                </Badge>
              )}
              {product.artist_type === 'multimedia' && product.video_url && (
                <Badge className="bg-blue-600 text-white flex items-center text-[10px] sm:text-xs px-2 py-0.5">
                  <Video className="h-3 w-3 mr-1" /> Preview vidéo
                </Badge>
              )}
            </>
          ) : product.type === 'physical' ? (
            <>
              <Badge className="bg-green-600 text-white text-[10px] sm:text-xs px-2 py-0.5">
                Physique
              </Badge>
              {stockStatus?.badge === 'destructive' && (
                <Badge variant="destructive" className="text-[10px] sm:text-xs px-2 py-0.5">
                  Rupture
                </Badge>
              )}
              {stockStatus?.badge === 'warning' && (product.stock || 0) > 0 && (
                <Badge
                  variant="outline"
                  className="bg-orange-500 text-white border-orange-600 text-[10px] sm:text-xs px-2 py-0.5"
                >
                  Stock faible
                </Badge>
              )}
              {(product as any).free_shipping && (
                <Badge className="bg-blue-600 text-white flex items-center text-[10px] sm:text-xs px-2 py-0.5">
                  <Truck className="h-3 w-3 mr-1" /> Livraison gratuite
                </Badge>
              )}
              {/* Note: size chart is not part of PhysicalProduct by default, but we will pass it if it exists */}
              {(product as any).size_chart_id && (
                <PhysicalSizeChartBadge
                  sizeChartId={(product as any).size_chart_id}
                  sizeChartName={(product as any).size_chart_name}
                  productSlug={product.slug}
                  storeSlug={product.store?.slug}
                  size="sm"
                />
              )}
            </>
          ) : product.type === 'service' ? (
            <>
              <Badge className="bg-purple-600 text-white text-[10px] sm:text-xs px-2 py-0.5">
                {product.service_type || 'Service'}
              </Badge>
              {product.calendar_available && (
                <Badge className="bg-green-600 text-white flex items-center text-[10px] sm:text-xs px-2 py-0.5">
                  <Calendar className="h-3 w-3 mr-1" /> Calendrier
                </Badge>
              )}
              {product.booking_required && !product.calendar_available && (
                <Badge
                  variant="secondary"
                  className="bg-blue-600 text-white text-[10px] sm:text-xs px-2 py-0.5"
                >
                  Réservation requise
                </Badge>
              )}
            </>
          ) : product.type === 'course' ? (
            <>
              <Badge className="bg-orange-600 text-white text-[10px] sm:text-xs px-2 py-0.5">
                Cours en ligne
              </Badge>
              {product.access_type && (
                <Badge className="bg-green-600 text-white flex items-center text-[10px] sm:text-xs px-2 py-0.5">
                  <Award className="h-3 w-3 mr-1" /> {product.access_type}
                </Badge>
              )}
            </>
          ) : (
            <Badge className={cn('text-white text-[10px] sm:text-xs px-2 py-0.5', typeBadge.color)}>
              {typeBadge.label}
            </Badge>
          )}

          <PricingModelBadge pricingModel={(product as any).pricing_model} size="sm" />
          <PaymentOptionsBadge paymentOptions={getPaymentOptions(product as any)} size="sm" />
        </div>

        {/* Rating */}
        {!product.hide_rating && (product.rating || product.review_count) && (
          <div className="flex items-center gap-2 mb-2">
            {product.rating && product.rating > 0 ? (
              <>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={cn(
                        'h-3 w-3',
                        star <= product.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-300">
                  {product.rating.toFixed(1)}
                </span>
                {!product.hide_reviews_count && product.review_count && (
                  <span className="text-xs text-gray-500">({product.review_count})</span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span className="text-xs sm:text-sm">Vérifié</span>
              </div>
            )}
          </div>
        )}

        {/* Info Icons Section */}
        <div
          className={cn(
            'flex flex-wrap gap-2 mb-2 text-xs sm:text-sm',
            isPremiumCard && 'mp-product-meta'
          )}
        >
          {/* Instant vs Preparation */}
          {product.type === 'digital' ||
          (product.type === 'artist' &&
            product.artist_type === 'multimedia' &&
            product.video_url) ||
          (product.type === 'service' && product.calendar_available) ||
          (product.type === 'course' && product.video_preview) ? (
            <div className="flex items-center gap-1.5 text-blue-400">
              <Zap className="h-3 w-3" />
              <span>Instantanée</span>
            </div>
          ) : product.type === 'artist' ||
            product.type === 'service' ||
            product.type === 'course' ? (
            <div className="flex items-center gap-1.5 text-gray-400">
              <FileText className="h-3 w-3" />
              <span>En préparation</span>
            </div>
          ) : null}

          {/* Physical specific */}
          {product.type === 'physical' && (
            <>
              <div className={cn('flex items-center gap-1.5 font-medium', stockStatus?.color)}>
                <StockIcon className="h-3 w-3" />
                <span>{stockStatus?.label}</span>
              </div>
              {product.weight && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Weight className="h-3 w-3" />
                  <span>{product.weight} kg</span>
                </div>
              )}
              {product.shipping_required !== false && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span>Livraison requise</span>
                </div>
              )}
            </>
          )}

          {/* Service specific */}
          {product.type === 'service' && (
            <>
              <div className="flex items-center gap-1.5 text-gray-400">
                <Clock className="h-3 w-3" />
                <span className="font-medium">
                  {product.duration
                    ? formatDuration(product.duration, product.duration_unit)
                    : 'Sur mesure'}
                </span>
              </div>
              {product.location_type && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span>{product.location_type}</span>
                </div>
              )}
            </>
          )}

          {/* Course specific */}
          {product.type === 'course' && (
            <>
              {product.modules && product.modules.length > 0 && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <FileText className="h-3 w-3" />
                  <span className="font-medium">{product.modules.length} modules</span>
                </div>
              )}
              {product.total_duration && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>{formatDurationSeconds(product.total_duration, 'short')}</span>
                </div>
              )}
              {product.enrollment_count && product.enrollment_count > 0 && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>{product.enrollment_count} inscrits</span>
                </div>
              )}
            </>
          )}

          {/* Artist specific */}
          {product.type === 'artist' && (
            <>
              {product.artwork_year && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{product.artwork_year}</span>
                </div>
              )}
              {product.artwork_medium && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Palette className="h-3 w-3" />
                  <span>{product.artwork_medium}</span>
                </div>
              )}
            </>
          )}

          {/* Digital generic key info */}
          {product.type === 'digital' &&
            !isCompact &&
            keyInfo.slice(0, 2).map((info, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-1.5',
                  info.badge ? 'text-blue-400 font-medium' : 'text-gray-400'
                )}
              >
                {info.icon && <info.icon className="h-3 w-3" />}
                <span>{info.value}</span>
              </div>
            ))}

          {/* License */}
          {product.type === 'digital' && product.licensing_type && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                product.licensing_type === 'plr'
                  ? 'border-emerald-500 text-emerald-400'
                  : product.licensing_type === 'copyrighted'
                    ? 'border-red-500 text-red-400'
                    : 'border-blue-500 text-blue-400'
              )}
            >
              {product.licensing_type === 'plr'
                ? 'PLR'
                : product.licensing_type === 'copyrighted'
                  ? "Droit d'auteur"
                  : 'Standard'}
            </Badge>
          )}
          {product.type === 'artist' && product.licensing_type && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                product.licensing_type === 'plr'
                  ? 'border-emerald-500 text-emerald-400'
                  : product.licensing_type === 'copyrighted'
                    ? 'border-red-500 text-red-400'
                    : 'border-blue-500 text-blue-400'
              )}
            >
              {product.licensing_type === 'plr'
                ? 'PLR'
                : product.licensing_type === 'copyrighted'
                  ? "Droit d'auteur"
                  : 'Standard'}
            </Badge>
          )}

          {/* Affiliate */}
          {hasAffiliate && (
            <Badge
              variant="secondary"
              className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {affiliateSettings!.commission_rate}% commission
            </Badge>
          )}
        </div>

        {/* Edition limited artist */}
        {product.type === 'artist' &&
          product.edition_type === 'limited_edition' &&
          product.edition_number &&
          product.total_editions && (
            <EditionLimitedBadge
              productId={product.id}
              editionNumber={product.edition_number}
              totalEditions={product.total_editions}
            />
          )}

        {/* Service Badges */}
        {product.type === 'service' && (
          <div className="flex flex-wrap gap-2 mb-2">
            <ServicePricingTypeBadge pricingType={(product as any).pricing_type} size="sm" />
            <ServiceDepositBadge
              depositRequired={(product as any).deposit_required}
              depositAmount={(product as any).deposit_amount}
              depositType={(product as any).deposit_type}
              currency={product.currency || 'XOF'}
              size="sm"
            />
            <ServiceCancellationBadge
              allowCancellation={(product as any).allow_booking_cancellation}
              cancellationDeadlineHours={(product as any).cancellation_deadline_hours}
              size="sm"
            />
            <ServiceMaxParticipantsBadge
              maxParticipants={(product as any).max_participants}
              size="sm"
            />
          </div>
        )}

        {/* Course Badges */}
        {product.type === 'course' && (
          <div className="flex flex-wrap gap-2 mb-2">
            <CourseDifficultyBadge difficulty={product.difficulty} size="sm" />
            {/* language is not typed in CourseProduct by default, fallback to any */}
            <CourseLanguageBadge language={(product as any).language} size="sm" />
            <CourseDurationBadge
              totalDuration={
                product.total_duration ? Math.round(product.total_duration / 3600) : null
              }
              durationUnit="hours"
              size="sm"
            />
            {/* lessons_count is inside modules in CourseProduct, or maybe top-level */}
            <CourseModulesBadge
              modulesCount={product.modules?.length}
              lessonsCount={(product as any).lessons_count}
              size="sm"
            />
          </div>
        )}

        {/* Physical variations */}
        {product.type === 'physical' && product.variants && product.variants.length > 0 && (
          <div className="mb-2 p-2 bg-blue-900/20 rounded-lg border border-blue-800">
            <span className="text-xs font-medium text-blue-200">
              {product.variants.length} variations
            </span>
          </div>
        )}

        {/* Price and Actions */}
        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-700">
          <MarketplaceProductCardPriceRow
            priceId={`product-price-${product.id}`}
            alertSlot={
              <PriceStockAlertButton
                productId={product.id}
                productName={productName}
                currentPrice={priceInfo.price}
                currency={product.currency || 'XOF'}
                productType={product.type}
                stockQuantity={product.type === 'physical' ? product.stock : undefined}
                variant="outline"
                size="sm"
              />
            }
          >
            {priceInfo.originalPrice && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                {formatPrice(priceInfo.originalPrice, product.currency)}
              </span>
            )}
            <span className="text-base sm:text-lg md:text-xl font-bold text-blue-400 whitespace-nowrap">
              {priceInfo.price === 0 ? 'Gratuit' : formatPrice(priceInfo.price, product.currency)}
            </span>
          </MarketplaceProductCardPriceRow>

          {showActions && (
            <MarketplaceProductCardActions
              productId={product.id}
              productName={productName}
              productUrl={productUrl}
              storeId={product.store?.id}
              buyLabel={
                product.type === 'physical' && product.stock === 0
                  ? 'Épuisé'
                  : product.type === 'physical' && physicalCheckoutDisplay
                    ? physicalCheckoutDisplay.cta_button_label
                    : marketplaceBuy.cta.buyLabel
              }
              buyAriaLabel={`${marketplaceBuy.cta.buyAriaVerb} ${productName}`}
              buyLoading={marketplaceBuy.loading}
              buyDisabled={product.type === 'physical' && product.stock === 0}
              buyIcon={
                product.type === 'service' && product.calendar_available ? 'calendar' : 'cart'
              }
              onView={() => handleAction('view')}
              onBuy={e => {
                e.preventDefault();
                e.stopPropagation();
                if (product.type === 'physical' && product.stock === 0) return;
                if (product.type === 'physical') {
                  setQuickOrderOpen(true);
                  return;
                }
                void marketplaceBuy.handleBuyClick();
              }}
            />
          )}
        </div>
      </div>

      <MarketplaceGuestBuyDialogs
        product={marketplaceBuy.product as any}
        price={priceInfo.price}
        guestOpen={marketplaceBuy.guestOpen}
        setGuestOpen={marketplaceBuy.setGuestOpen}
        physicalOpen={marketplaceBuy.physicalOpen}
        setPhysicalOpen={marketplaceBuy.setPhysicalOpen}
        loading={marketplaceBuy.loading}
        onGuestConfirm={marketplaceBuy.proceedWithCustomer}
      />

      {product.type === 'physical' && product.store_id && (
        <PhysicalQuickOrderDialog
          open={quickOrderOpen}
          onOpenChange={setQuickOrderOpen}
          product={{
            productId: product.id,
            storeId: product.store_id,
            name: product.name,
            price: priceInfo.price,
            currency: product.currency || 'XOF',
            payment_options: product.payment_options,
          }}
        />
      )}
    </Card>
  );
};

export const UnifiedProductCard = React.memo(
  UnifiedProductCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.updated_at === nextProps.product.updated_at &&
      prevProps.variant === nextProps.variant &&
      prevProps.showAffiliate === nextProps.showAffiliate
    );
  }
);

UnifiedProductCard.displayName = 'UnifiedProductCard';
export default UnifiedProductCard;
