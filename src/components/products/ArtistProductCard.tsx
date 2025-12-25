/**
 * ArtistProductCard - Carte spécialisée pour les œuvres d'artistes
 * Mise en avant des informations spécifiques aux œuvres d'art
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
  Palette,
  Award,
  Shield,
  Package,
  User,
  ShoppingCart,
  Eye,
  Ruler,
  Calendar,
  CheckCircle2,
  Video,
  Star,
  Heart,
  TrendingUp,
  Sparkles,
  Store,
  CheckCircle,
  MessageSquare,
  Zap,
  FileText,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { ArtistProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { ArtistImageCarousel } from './ArtistImageCarousel';
import { EditionLimitedBadge } from '@/components/artist/EditionLimitedBadge';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { useToast } from '@/hooks/use-toast';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import {
  ArtistHandlingTimeBadge,
  ArtistSignatureBadge,
} from '@/components/products/ArtistInfoBadges';

interface ArtistProductCardProps {
  product: ArtistProduct;
  variant?: 'marketplace' | 'store' | 'compact';
  onAction?: (action: 'view' | 'buy', product: ArtistProduct) => void;
  className?: string;
}

export function ArtistProductCard({
  product,
  variant = 'marketplace',
  onAction,
  className,
}: ArtistProductCardProps) {
  const isCompact = variant === 'compact';
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
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
            ? `${product.artwork_title || product.name} a été retiré de vos favoris`
            : `${product.artwork_title || product.name} a été ajouté à vos favoris`,
        });
        return newValue;
      });
    },
    [product.artwork_title, product.name, toast]
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

  const artistTypeLabels: Record<string, string> = {
    writer: 'Écrivain',
    musician: 'Musicien',
    visual_artist: 'Artiste visuel',
    designer: 'Designer',
    multimedia: 'Multimédia',
    other: 'Artiste',
  };

  const editionLabels: Record<string, string> = {
    original: 'Original',
    limited_edition: 'Édition limitée',
    print: 'Tirage',
    reproduction: 'Reproduction',
  };

  // Helper pour obtenir le label de type d'artiste
  const getArtistTypeLabel = (artistType?: string): string => {
    if (!artistType) return artistTypeLabels.other;
    return artistTypeLabels[artistType as keyof typeof artistTypeLabels] || artistTypeLabels.other;
  };

  // Helper pour obtenir le label de type d'édition
  const getEditionTypeLabel = (editionType?: string): string => {
    if (!editionType) return '';
    const label = editionLabels[editionType as keyof typeof editionLabels];
    return label || editionType;
  };

  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);

  // URL du produit
  const productUrl = useMemo(
    () =>
      product.store?.slug
        ? `/stores/${product.store.slug}/products/${product.slug}`
        : `/products/${product.slug}`,
    [product.store?.slug, product.slug]
  );

  // Dimensions formatées
  const dimensionsDisplay = useMemo(() => {
    if (!product.artwork_dimensions) return null;
    const { width, height, depth, unit = 'cm' } = product.artwork_dimensions;
    const parts: string[] = [];
    if (width) parts.push(`${width}`);
    if (height) parts.push(`${height}`);
    if (depth) parts.push(`${depth}`);
    if (parts.length === 0) return null;
    return `${parts.join(' × ')} ${unit}`;
  }, [product.artwork_dimensions]);

  // Composant d'image mémorisé
  const imageComponent = useMemo(() => {
    // Récupérer toutes les images disponibles
    const allImages =
      product.images && product.images.length > 0
        ? product.images
        : product.image_url
          ? [product.image_url]
          : [];

    // Si plusieurs images, utiliser le carrousel
    if (allImages.length > 1) {
      return (
        <ArtistImageCarousel
          images={allImages}
          alt={product.artwork_title || product.name}
          className="w-full h-full product-image group-hover:scale-110 transition-transform duration-300"
          priority={false}
        />
      );
    }

    // Sinon, image simple
    if (allImages.length === 1) {
      return (
        <ResponsiveProductImage
          src={allImages[0]}
          alt={product.artwork_title || product.name}
          sizes={imageSizes}
          className="w-full h-full product-image group-hover:scale-110 transition-transform duration-300"
          fit="contain"
          fill={true}
          context="grid"
        />
      );
    }

    // Placeholder si aucune image
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
        <Palette className="h-16 w-16 text-gray-400 opacity-30" />
      </div>
    );
  }, [product.images, product.image_url, product.artwork_title, product.name, imageSizes]);

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
      aria-labelledby={`artwork-title-${product.id}`}
      aria-describedby={`artwork-price-${product.id}`}
    >
      {/* Image avec galerie ou carrousel - Ratio 3:2 aligné avec le format produit 1536×1024 */}
      <div className="relative w-full overflow-hidden bg-muted/30 aspect-[3/2]">
        <Link to={productUrl} className="block w-full h-full">
          {imageComponent}
        </Link>

        {/* Overlay gradient au hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link to={productUrl}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={productUrl}>
              <Palette className="h-4 w-4 mr-2" />
              Découvrir
            </Link>
          </Button>
        </div>

        {/* Badges spécifiques Artist - Délai préparation et Signature - Positionnés en absolu */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-2">
          <ArtistHandlingTimeBadge handlingTimeDays={product.shipping_handling_time} size="sm" />
          <ArtistSignatureBadge
            signatureAuthenticated={product.signature_authenticated}
            size="sm"
          />
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
              ? `Retirer ${product.artwork_title || product.name} des favoris`
              : `Ajouter ${product.artwork_title || product.name} aux favoris`
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

        {/* Nom de l'artiste - Mise en avant */}
        {product.artist_name && (
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white">
              {product.artist_name}
            </span>
            <CheckCircle2
              className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 flex-shrink-0 -ml-2"
              aria-label="Artiste vérifié"
            />
          </div>
        )}

        {/* Titre de l'œuvre */}
        <Link to={productUrl}>
          <h3
            id={`artwork-title-${product.id}`}
            className={cn(
              'font-semibold leading-tight line-clamp-2 mb-3',
              'text-sm sm:text-base lg:text-lg',
              'text-white',
              'hover:text-primary transition-colors',
              isCompact && 'text-sm'
            )}
          >
            {product.artwork_title || product.name}
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

          {/* Badge Type artiste */}
          <Badge
            variant="default"
            className="bg-pink-600 text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5"
          >
            {getArtistTypeLabel(product.artist_type)}
          </Badge>

          {/* Badge Type d'édition */}
          {product.edition_type ? (
            <Badge
              variant="secondary"
              className="bg-purple-600 text-white text-[10px] sm:text-xs px-2 py-0.5"
            >
              {getEditionTypeLabel(product.edition_type)}
            </Badge>
          ) : null}

          {/* Badge Certifié */}
          {product.certificate_of_authenticity && (
            <Badge
              variant="default"
              className="bg-green-600 text-white flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5"
            >
              <Shield className="h-3 w-3" />
              Certifié
            </Badge>
          )}

          {/* Badge Édition limitée */}
          {product.edition_type === 'limited_edition' &&
            product.edition_number &&
            product.total_editions && (
              <Badge
                variant="default"
                className="bg-yellow-600 text-white flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5"
              >
                <Award className="h-3 w-3" />
                {product.edition_number}/{product.total_editions}
              </Badge>
            )}

          {/* Badge Preview vidéo */}
          {product.artist_type === 'multimedia' && product.video_url && (
            <Badge
              variant="default"
              className="bg-blue-600 text-white flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5"
            >
              <Video className="h-3 w-3" />
              Preview vidéo
            </Badge>
          )}

          {/* Badge Modèle de tarification */}
          <PricingModelBadge pricingModel={product.pricing_model} size="sm" />

          {/* Badge Options de paiement */}
          <PaymentOptionsBadge paymentOptions={getPaymentOptions(product)} size="sm" />
        </div>

        {/* Rating et avis */}
        {!product.hide_rating && (product.rating || product.review_count) && (
          <div className="flex items-center gap-2 mb-2">
            {product.rating && product.rating > 0 ? (
              <>
                {renderStars(product.rating)}
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {product.rating.toFixed(1)}
                </span>
                {!product.hide_reviews_count && product.review_count && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({product.review_count})
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
          {/* Badge "Instantané" ou "En préparation" */}
          {product.artist_type === 'multimedia' && product.video_url ? (
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

          {/* Année */}
          {product.artwork_year && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{product.artwork_year}</span>
            </div>
          )}

          {/* Medium */}
          {product.artwork_medium && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{product.artwork_medium}</span>
            </div>
          )}

          {/* Dimensions */}
          {dimensionsDisplay && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Ruler className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{dimensionsDisplay}</span>
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

        {/* Édition limitée - Mise en avant */}
        {product.edition_type === 'limited_edition' &&
          product.edition_number &&
          product.total_editions && (
            <EditionLimitedBadge
              productId={product.id}
              editionNumber={product.edition_number}
              totalEditions={product.total_editions}
            />
          )}

        {/* Informations de livraison */}
        <div className="flex flex-wrap gap-2 mb-3">
          {product.shipping_fragile && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700"
            >
              <Package className="h-3 w-3 mr-1" />
              Fragile
            </Badge>
          )}

          {product.shipping_insurance_required && (
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700"
            >
              <Shield className="h-3 w-3 mr-1" />
              Assurance requise
            </Badge>
          )}
        </div>

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
                id={`artwork-price-${product.id}`}
                className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap"
              >
                {priceInfo.price === 0 ? 'Gratuit' : formatPrice(priceInfo.price, product.currency)}
              </span>
            </div>
            <PriceStockAlertButton
              productId={product.id}
              productName={product.artwork_title || product.name}
              currentPrice={priceInfo.price}
              currency={product.currency || 'XOF'}
              productType="artist"
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
            >
              <Link
                to={productUrl}
                aria-label={`Voir les détails de ${product.artwork_title || product.name}`}
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
                aria-label={`Contacter le vendeur pour ${product.artwork_title || product.name}`}
              >
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Contacter
              </Link>
            </Button>

            {/* Bouton BLEU "Acheter" */}
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium"
              asChild
            >
              <Link
                to={productUrl}
                aria-label={`Acheter ${product.artwork_title || product.name}`}
                onClick={() => onAction?.('buy', product)}
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Acheter
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const MemoizedArtistProductCard = React.memo(ArtistProductCard, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  const prev = prevProps.product;
  const next = nextProps.product;

  return (
    prevProps.variant === nextProps.variant &&
    prevProps.onAction === nextProps.onAction &&
    prevProps.className === nextProps.className &&
    prev.id === next.id &&
    prev.price === next.price &&
    prev.promo_price === next.promo_price &&
    prev.currency === next.currency &&
    prev.is_featured === next.is_featured &&
    prev.image_url === next.image_url &&
    JSON.stringify(prev.images) === JSON.stringify(next.images) &&
    prev.artwork_title === next.artwork_title &&
    prev.name === next.name &&
    prev.rating === next.rating &&
    prev.review_count === next.review_count &&
    prev.artist_type === next.artist_type &&
    prev.artist_name === next.artist_name &&
    prev.edition_type === next.edition_type &&
    prev.edition_number === next.edition_number &&
    prev.total_editions === next.total_editions &&
    prev.artwork_year === next.artwork_year &&
    prev.artwork_medium === next.artwork_medium &&
    JSON.stringify(prev.artwork_dimensions) === JSON.stringify(next.artwork_dimensions) &&
    prev.shipping_handling_time === next.shipping_handling_time &&
    prev.signature_authenticated === next.signature_authenticated &&
    prev.certificate_of_authenticity === next.certificate_of_authenticity &&
    prev.pricing_model === next.pricing_model &&
    JSON.stringify(prev.payment_options) === JSON.stringify(next.payment_options) &&
    prev.licensing_type === next.licensing_type &&
    prev.video_url === next.video_url &&
    prev.created_at === next.created_at &&
    prev.store?.id === next.store?.id &&
    prev.store?.slug === next.store?.slug &&
    prev.store?.name === next.store?.name &&
    prev.store?.logo_url === next.store?.logo_url
  );
});

MemoizedArtistProductCard.displayName = 'ArtistProductCard';

/**
 * Skeleton pour loading state
 */
export const ArtistProductCardSkeleton = () => {
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

export default ArtistProductCard;
