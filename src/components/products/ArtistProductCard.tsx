/**
 * ArtistProductCard - Carte spécialisée pour les œuvres d'artistes
 * Mise en avant des informations spécifiques aux œuvres d'art
 *
 * Date: 31 Janvier 2025
 */

import React, { useMemo } from 'react';
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
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { ArtistProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';
import { ArtistImageCarousel } from './ArtistImageCarousel';

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
      aria-labelledby={`artwork-title-${product.id}`}
    >
      {/* Image avec galerie ou carrousel */}
      <div className="relative w-full overflow-hidden bg-muted/30 flex-grow min-h-[280px] sm:min-h-[320px]">
        {(() => {
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
                className="w-full h-full product-image group-hover:scale-105 transition-transform duration-500"
                priority={true}
              />
            );
          }

          // Sinon, image simple
          if (allImages.length === 1) {
            return (
              <ResponsiveProductImage
                src={allImages[0]}
                alt={product.artwork_title || product.name}
                className="w-full h-full object-cover product-image group-hover:scale-105 transition-transform duration-500"
                priority={true}
              />
            );
          }

          // Placeholder si aucune image
          return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
              <Palette className="h-16 w-16 text-gray-400 opacity-30" />
            </div>
          );
        })()}

        {/* Badge vidéo preview pour œuvres multimédias */}
        {product.artist_type === 'multimedia' && 'video_url' in product && product.video_url && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="default"
              className="bg-blue-600 text-white flex items-center gap-1 shadow-lg"
            >
              <Video className="h-3 w-3" />
              Preview vidéo
            </Badge>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          <Badge variant="default" className="bg-pink-600 text-white font-semibold shadow-lg">
            {artistTypeLabels[product.artist_type || 'other'] || 'Artiste'}
          </Badge>

          {product.edition_type && (
            <Badge variant="secondary" className="bg-purple-600 text-white shadow-lg">
              {editionLabels[product.edition_type] || product.edition_type}
            </Badge>
          )}

          {product.certificate_of_authenticity && (
            <Badge
              variant="default"
              className="bg-green-600 text-white flex items-center gap-1 shadow-lg"
            >
              <Shield className="h-3 w-3" />
              Certifié
            </Badge>
          )}

          {product.edition_type === 'limited_edition' &&
            product.edition_number &&
            product.total_editions && (
              <Badge
                variant="default"
                className="bg-yellow-600 text-white flex items-center gap-1 shadow-lg"
              >
                <Award className="h-3 w-3" />
                {product.edition_number}/{product.total_editions}
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
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6">
        {/* Nom de l'artiste - Mise en avant */}
        {product.artist_name && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {product.artist_name}
            </span>
            <CheckCircle2
              className="h-4 w-4 text-green-500 flex-shrink-0"
              aria-label="Artiste vérifié"
            />
          </div>
        )}

        {/* Titre de l'œuvre */}
        <h3
          id={`artwork-title-${product.id}`}
          className={cn(
            'font-semibold leading-tight line-clamp-2 mb-2',
            'text-base sm:text-lg lg:text-xl',
            'text-gray-900 dark:text-white',
            isCompact && 'text-sm'
          )}
        >
          {product.artwork_title || product.name}
        </h3>

        {/* Informations spécifiques */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {product.artwork_year && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{product.artwork_year}</span>
            </div>
          )}

          {product.artwork_medium && (
            <div className="flex items-center gap-1">
              <Palette className="h-3.5 w-3.5" />
              <span>{product.artwork_medium}</span>
            </div>
          )}

          {dimensionsDisplay && (
            <div className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              <span>{dimensionsDisplay}</span>
            </div>
          )}
        </div>

        {/* Édition limitée - Mise en avant */}
        {product.edition_type === 'limited_edition' &&
          product.edition_number &&
          product.total_editions && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Award className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Édition limitée {product.edition_number}/{product.total_editions}
              </span>
            </div>
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
              aria-label={`Voir les détails de ${product.artwork_title || product.name}`}
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 sm:h-11 text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-amber-500 text-white"
                onClick={() => onAction?.('view', product)}
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Voir
              </Button>
            </Link>
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => onAction?.('buy', product)}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Acheter
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Optimisation avec React.memo
export const MemoizedArtistProductCard = React.memo(ArtistProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.variant === nextProps.variant
  );
});

MemoizedArtistProductCard.displayName = 'ArtistProductCard';

export default ArtistProductCard;
