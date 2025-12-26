/**
 * Digital Product Card - Professional
 * Date: 27 octobre 2025
 *
 * Inspiré de: Gumroad, Lemonsqueezy
 * Optimisé avec React.memo et LazyImage pour performance mobile
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Download,
  Star,
  FileText,
  TrendingUp,
  Eye,
  Heart,
  Play,
  ZoomIn,
  CheckSquare,
  Square,
  Edit,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import { DigitalDownloadLimitBadge } from '@/components/products/DigitalInfoBadges';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { htmlToPlainText } from '@/lib/html-sanitizer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DigitalProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    is_active?: boolean | null;
    price: number;
    currency: string;
    image_url?: string;
    digital_type: string;
    license_type: string;
    total_downloads: number;
    average_rating: number;
    total_reviews: number;
    version?: string;
    pricing_model?: string | null;
    payment_options?: {
      payment_type?: 'full' | 'percentage' | 'delivery_secured';
      percentage_rate?: number;
    } | null;
    hide_downloads_count?: boolean | null;
    hide_rating?: boolean | null;
    hide_reviews_count?: boolean | null;
    product_affiliate_settings?: Array<{
      commission_rate: number;
      affiliate_enabled: boolean;
    }> | null;
  };
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onDownload?: () => void;
  selectable?: boolean;
  isSelected?: boolean;
  onSelect?: (productId: string, selected: boolean) => void;
}

const DIGITAL_TYPE_ICONS = {
  software: '💻',
  ebook: '📚',
  template: '🎨',
  plugin: '🔌',
  music: '🎵',
  video: '🎬',
  graphic: '🖼️',
  game: '🎮',
  app: '📱',
  document: '📄',
  data: '📊',
  other: '📦',
};

const LICENSE_TYPE_LABELS = {
  single: 'License Unique',
  multi: 'Multi-Devices',
  unlimited: 'Illimitée',
  subscription: 'Abonnement',
  lifetime: 'À vie',
};

const DigitalProductCardComponent = ({
  product,
  variant = 'default',
  showActions = true,
  onDownload,
  selectable = false,
  isSelected = false,
  onSelect,
}: DigitalProductCardProps) => {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';
  const { toast } = useToast();
  const { store } = useStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const imageSizes =
    variant === 'compact'
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw';

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

  // Gérer le zoom
  const handleZoomClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsZoomOpen(true);
  }, []);

  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSelect) {
      onSelect(product.id, !isSelected);
    }
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.02]',
        isFeatured && 'border-primary border-2',
        selectable && isSelected && 'ring-2 ring-primary',
        'cursor-pointer'
      )}
      style={{ willChange: 'transform' }}
    >
      {/* Image/Icon - Ratio 3:2 aligné avec le format produit 1536×1024 */}
      <div className="relative aspect-[3/2] bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          <ResponsiveProductImage
            src={product.image_url}
            alt={product.name}
            sizes={imageSizes}
            context="grid"
            // ✅ Pas de rognage (images coupées en bas) dans les cartes
            fit="contain"
            fill={true}
            className="h-full w-full transition-transform duration-300 group-hover:scale-110"
            fallbackIcon={
              <div className="flex items-center justify-center h-full w-full">
                <span className="text-6xl">
                  {DIGITAL_TYPE_ICONS[product.digital_type as keyof typeof DIGITAL_TYPE_ICONS] ||
                    DIGITAL_TYPE_ICONS.other}
                </span>
              </div>
            }
          />
        </Link>

        {/* Overlay gradient au hover - Style comme CourseProductCard */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" asChild>
            <Link to={`/products/${product.slug}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={`/products/${product.slug}`}>
              <Play className="h-4 w-4 mr-2" />
              Découvrir
            </Link>
          </Button>
          {product.image_url && (
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
        </div>

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

        {/* Selection checkbox */}
        {selectable && (
          <div className="absolute top-2 left-2 z-10">
            <button
              onClick={handleSelect}
              className="p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md hover:bg-white dark:hover:bg-gray-800 transition-colors"
              aria-label={isSelected ? 'Désélectionner' : 'Sélectionner'}
            >
              {isSelected ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        )}

        {/* Version badge */}
        {product.version && (
          <div className={cn('absolute top-2 z-10', selectable ? 'right-2' : 'left-2')}>
            <Badge variant="secondary" className="text-xs shadow-lg">
              v{product.version}
            </Badge>
          </div>
        )}
      </div>

      {/* Dialog pour zoom de l'image */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Zoom - {product.name}</DialogTitle>
            <DialogDescription>Vue agrandie de l'image du produit</DialogDescription>
          </DialogHeader>
          {product.image_url && (
            <div className="relative w-full aspect-[3/2] bg-muted">
              <ResponsiveProductImage
                src={product.image_url}
                alt={product.name}
                sizes="100vw"
                context="detail"
                fit="contain"
                fill={true}
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              to={
                store?.slug && product.slug
                  ? `/stores/${store.slug}/products/${product.slug}`
                  : `/products/${product.slug}`
              }
            >
              <h3
                className={cn(
                  'font-semibold truncate hover:text-primary transition-colors mb-3',
                  isCompact ? 'text-base' : 'text-lg'
                )}
              >
                {product.name}
              </h3>
            </Link>

            {/* Badge Featured - Placé après le titre */}
            {isFeatured && (
              <Badge className="bg-primary text-primary-foreground mb-2">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Populaire
              </Badge>
            )}

            {!isCompact && product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {htmlToPlainText(product.description)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* License & Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {LICENSE_TYPE_LABELS[product.license_type as keyof typeof LICENSE_TYPE_LABELS]}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {product.digital_type}
          </Badge>

          {/* Badge Modèle de tarification */}
          <PricingModelBadge pricingModel={product.pricing_model} size="sm" />

          {/* Badge Options de paiement */}
          <PaymentOptionsBadge paymentOptions={getPaymentOptions(product)} size="sm" />

          {/* Badge taux d'affiliation */}
          {(() => {
            // Gérer le cas où Supabase retourne un objet ou un tableau
            const affiliateSettings = Array.isArray(product.product_affiliate_settings)
              ? product.product_affiliate_settings[0]
              : product.product_affiliate_settings;

            return affiliateSettings?.affiliate_enabled &&
              affiliateSettings?.commission_rate > 0 ? (
              <Badge
                variant="secondary"
                className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
                title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {affiliateSettings.commission_rate}% commission
              </Badge>
            ) : null;
          })()}

          {/* Badge Limite de téléchargements */}
          <DigitalDownloadLimitBadge
            downloadLimit={(product as { download_limit?: number }).download_limit}
            size="sm"
          />
        </div>

        {/* Stats */}
        {!isCompact && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Downloads */}
            {!product.hide_downloads_count && (
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span className="font-medium">{product.total_downloads.toLocaleString()}</span>
              </div>
            )}

            {/* Rating */}
            {!product.hide_rating && product.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.average_rating.toFixed(1)}</span>
                {!product.hide_reviews_count && (
                  <span className="text-xs">({product.total_reviews})</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
            <span className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-primary whitespace-nowrap">
              {product.price === 0 ? 'Gratuit' : `${product.price} ${product.currency}`}
            </span>
          </div>
          <PriceStockAlertButton
            productId={product.id}
            productName={product.name}
            currentPrice={product.price}
            currency={product.currency}
            productType="digital"
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          />
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/dashboard/products/${product.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link
                to={
                  store?.slug && product.slug
                    ? `/stores/${store.slug}/products/${product.slug}`
                    : `/products/${product.slug}`
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                Détails
              </Link>
            </Button>
            {onDownload ? (
              <Button className="flex-1" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            ) : (
              <Button className="flex-1" asChild>
                <Link
                  to={
                    store?.slug && product.slug
                      ? `/stores/${store.slug}/products/${product.slug}`
                      : `/products/${product.slug}`
                  }
                >
                  Acheter
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const DigitalProductCard = React.memo(
  DigitalProductCardComponent,
  (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter re-renders inutiles
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.is_active === nextProps.product.is_active &&
      prevProps.product.image_url === nextProps.product.image_url &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.total_downloads === nextProps.product.total_downloads &&
      prevProps.product.average_rating === nextProps.product.average_rating &&
      prevProps.variant === nextProps.variant &&
      prevProps.showActions === nextProps.showActions &&
      prevProps.onDownload === nextProps.onDownload
    );
  }
);

DigitalProductCard.displayName = 'DigitalProductCard';

/**
 * Skeleton pour loading state
 */
export const DigitalProductCardSkeleton = () => {
  return (
    <Card>
      <div className="aspect-video bg-muted animate-pulse" />
      <CardHeader>
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
        </div>
        <div className="h-8 bg-muted rounded animate-pulse w-32" />
      </CardContent>
    </Card>
  );
};

/**
 * Grid de cards avec loading
 */
export const DigitalProductsGrid = ({
  products,
  loading,
  variant,
}: {
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    image_url?: string;
    digital_type: string;
    license_type: string;
    total_downloads: number;
    average_rating: number;
    total_reviews: number;
    hide_downloads_count?: boolean | null;
    hide_rating?: boolean | null;
    hide_reviews_count?: boolean | null;
  }>;
  loading?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <DigitalProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit digital</h3>
          <p className="text-muted-foreground">
            Créez votre premier produit digital pour commencer
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        variant === 'compact'
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      )}
    >
      {products.map(product => (
        <DigitalProductCard key={product.id} product={product} variant={variant} />
      ))}
    </div>
  );
};
