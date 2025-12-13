/**
 * CourseProductCard - Carte spécialisée pour les cours en ligne
 * Mise en avant des informations spécifiques : modules, niveau, durée, inscrits
 *
 * Date: 31 Janvier 2025
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Clock,
  Users,
  ShoppingCart,
  Eye,
  FileText,
  Award,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { CourseProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice } from '@/lib/product-helpers';
import { formatDuration as formatDurationSeconds } from '@/lib/time-utils';
import { cn } from '@/lib/utils';

interface CourseProductCardProps {
  product: CourseProduct;
  variant?: 'marketplace' | 'store' | 'compact';
  onAction?: (action: 'view' | 'buy', product: CourseProduct) => void;
  className?: string;
}

export function CourseProductCard({
  product,
  variant = 'marketplace',
  onAction,
  className,
}: CourseProductCardProps) {
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

  // Labels de niveau
  const difficultyLabels: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  };

  // Labels de type d'accès
  const accessLabels: Record<string, string> = {
    lifetime: 'Accès à vie',
    subscription: 'Abonnement',
  };

  // Durée totale formatée (en secondes)
  const totalDurationDisplay = useMemo(() => {
    if (!product.total_duration) return null;
    // total_duration est en secondes selon le type CourseProduct
    return formatDurationSeconds(product.total_duration, 'short');
  }, [product.total_duration]);

  // Nombre total de leçons
  const totalLessons = useMemo(() => {
    if (!product.modules || product.modules.length === 0) return 0;
    return product.modules.reduce((total, module) => total + (module.lessons_count || 0), 0);
  }, [product.modules]);

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
      aria-labelledby={`course-title-${product.id}`}
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
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <GraduationCap className="h-16 w-16 text-gray-400 opacity-30" />
          </div>
        )}

        {/* Badge vidéo preview */}
        {product.video_preview && (
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="default"
              className="bg-red-600 text-white flex items-center gap-1 shadow-lg"
            >
              <Play className="h-3 w-3" />
              Preview
            </Badge>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          <Badge variant="default" className="bg-orange-600 text-white font-semibold shadow-lg">
            Cours en ligne
          </Badge>

          {product.difficulty && (
            <Badge variant="secondary" className="bg-blue-600 text-white shadow-lg">
              {difficultyLabels[product.difficulty] || product.difficulty}
            </Badge>
          )}

          {product.access_type && (
            <Badge
              variant="default"
              className="bg-green-600 text-white flex items-center gap-1 shadow-lg"
            >
              <Award className="h-3 w-3" />
              {accessLabels[product.access_type] || product.access_type}
            </Badge>
          )}
        </div>

        {/* Badge promotion si applicable */}
        {priceInfo.originalPrice && (
          <div className="absolute bottom-2 right-2 z-10">
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
          id={`course-title-${product.id}`}
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
          {/* Modules */}
          {product.modules && product.modules.length > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">
                {product.modules.length} module{product.modules.length > 1 ? 's' : ''}
                {totalLessons > 0 && ` • ${totalLessons} leçon${totalLessons > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Durée totale */}
          {totalDurationDisplay && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalDurationDisplay}</span>
            </div>
          )}

          {/* Inscrits */}
          {product.enrollment_count && product.enrollment_count > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span>
                {product.enrollment_count} inscrit{product.enrollment_count > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Accès à vie */}
        {product.access_type === 'lifetime' && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-800 dark:text-green-200">
              Accès à vie - Apprenez à votre rythme
            </span>
          </div>
        )}

        {/* Preview vidéo disponible */}
        {product.video_preview && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-center gap-1">
              <Play className="h-3 w-3" />
              Vidéo de prévisualisation disponible
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
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => onAction?.('buy', product)}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              S'inscrire
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Optimisation avec React.memo
export const MemoizedCourseProductCard = React.memo(CourseProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.updated_at === nextProps.product.updated_at &&
    prevProps.variant === nextProps.variant
  );
});

MemoizedCourseProductCard.displayName = 'CourseProductCard';

export default CourseProductCard;
