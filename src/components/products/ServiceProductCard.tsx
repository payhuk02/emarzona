/**
 * ServiceProductCard - Carte spécialisée pour les services
 * Mise en avant des informations spécifiques : durée, localisation, calendrier
 *
 * Date: 31 Janvier 2025
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ShoppingCart, Eye, CheckCircle2, Users } from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { ServiceProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice, formatDuration } from '@/lib/product-helpers';
import { cn } from '@/lib/utils';

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
  const priceInfo = useMemo(() => getDisplayPrice(product), [product]);

  // URL du produit
  const productUrl = useMemo(
    () =>
      product.store?.slug
        ? `/stores/${product.store.slug}/products/${product.slug}`
        : `/products/${product.slug}`,
    [product.store?.slug, product.slug]
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
        'bg-transparent border border-gray-200 dark:border-gray-700',
        'rounded-xl overflow-hidden',
        'min-h-[480px] sm:min-h-[520px] lg:min-h-[560px]',
        'hover:shadow-lg transition-all duration-300',
        className
      )}
      role="article"
      aria-labelledby={`service-title-${product.id}`}
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <Calendar className="h-16 w-16 text-gray-400 opacity-30" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          <Badge variant="default" className="bg-purple-600 text-white font-semibold shadow-lg">
            {serviceTypeLabels[product.service_type || 'other'] || 'Service'}
          </Badge>

          {product.calendar_available && (
            <Badge
              variant="default"
              className="bg-green-600 text-white flex items-center gap-1 shadow-lg"
            >
              <Calendar className="h-3 w-3" />
              Calendrier
            </Badge>
          )}

          {product.booking_required && (
            <Badge variant="secondary" className="bg-blue-600 text-white shadow-lg">
              Réservation requise
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
        {/* Titre */}
        <h3
          id={`service-title-${product.id}`}
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
          {/* Durée */}
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">{durationDisplay}</span>
          </div>

          {/* Localisation */}
          {product.location_type && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>{locationLabels[product.location_type] || product.location_type}</span>
            </div>
          )}

          {/* Staff requis */}
          {product.staff_required && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>Équipe requise</span>
            </div>
          )}
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
              >
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Voir
              </Button>
            </Link>
            {product.calendar_available ? (
              <Button
                size="sm"
                className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => onAction?.('buy', product)}
              >
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Réserver
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onAction?.('buy', product)}
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                Contacter
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Optimisation avec React.memo
export const MemoizedServiceProductCard = React.memo(ServiceProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.variant === nextProps.variant
  );
});

MemoizedServiceProductCard.displayName = 'ServiceProductCard';

export default ServiceProductCard;
