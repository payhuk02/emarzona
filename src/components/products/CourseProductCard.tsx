/**
 * CourseProductCard - Carte spécialisée pour les cours en ligne
 * Mise en avant des informations spécifiques : modules, niveau, durée, inscrits
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
  GraduationCap,
  Clock,
  Users,
  ShoppingCart,
  Eye,
  FileText,
  Award,
  Play,
  CheckCircle2,
  Star,
  Heart,
  TrendingUp,
  Sparkles,
  Store,
  CheckCircle,
  MessageSquare,
  Zap,
  Shield,
} from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { CourseProduct } from '@/types/unified-product';
import { formatPrice, getDisplayPrice } from '@/lib/product-helpers';
import { formatDuration as formatDurationSeconds } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { useToast } from '@/hooks/use-toast';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import {
  CourseDifficultyBadge,
  CourseLanguageBadge,
  CourseDurationBadge,
  CourseModulesBadge,
} from '@/components/products/CourseInfoBadges';

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
        'hover:shadow-xl hover:scale-[1.02] transition-all duration-300',
        'cursor-pointer',
        product.is_featured && 'border-primary border-2',
        className
      )}
      style={{ willChange: 'transform' }}
      role="article"
      aria-labelledby={`course-title-${product.id}`}
      aria-describedby={`course-price-${product.id}`}
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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
              <GraduationCap className="h-16 w-16 text-gray-400 opacity-30" />
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
          <Button size="sm" asChild>
            <Link to={productUrl}>
              <Play className="h-4 w-4 mr-2" />
              Découvrir
            </Link>
          </Button>
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
            id={`course-title-${product.id}`}
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
            className="bg-orange-600 text-white font-semibold text-[10px] sm:text-xs px-2 py-0.5"
          >
            Cours en ligne
          </Badge>

          {/* Badge Accès */}
          {product.access_type && (
            <Badge
              variant="default"
              className="bg-green-600 text-white flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5"
            >
              <Award className="h-3 w-3" />
              {accessLabels[product.access_type] || product.access_type}
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
          {/* Badge "Instantané" ou "En préparation" */}
          {product.video_preview ? (
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

          {/* Modules */}
          {product.modules && product.modules.length > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="font-medium">
                {product.modules.length} module{product.modules.length > 1 ? 's' : ''}
                {totalLessons > 0 && ` • ${totalLessons} leçon${totalLessons > 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          {/* Durée totale */}
          {totalDurationDisplay && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{totalDurationDisplay}</span>
            </div>
          )}

          {/* Inscrits */}
          {product.enrollment_count && product.enrollment_count > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>
                {product.enrollment_count} inscrit{product.enrollment_count > 1 ? 's' : ''}
              </span>
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

        {/* Badges spécifiques Course - Niveau, Langue, Durée, Modules */}
        <div className="flex flex-wrap gap-2 mb-2">
          <CourseDifficultyBadge
            difficulty={(product as { difficulty?: string }).difficulty || product.difficulty}
            size="sm"
          />
          <CourseLanguageBadge language={(product as { language?: string }).language} size="sm" />
          <CourseDurationBadge
            totalDuration={
              product.total_duration
                ? Math.round(product.total_duration / 3600) // Convertir secondes en heures
                : null
            }
            durationUnit="hours"
            size="sm"
          />
          <CourseModulesBadge
            modulesCount={product.modules?.length}
            lessonsCount={(product as { lessons_count?: number }).lessons_count}
            size="sm"
          />
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
                id={`course-price-${product.id}`}
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
              productType="course"
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

            {/* Bouton BLEU "S'inscrire" */}
            <Button
              size="sm"
              className="flex-1 h-10 sm:h-11 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium"
              asChild
            >
              <Link
                to={productUrl}
                aria-label={`S'inscrire à ${product.name}`}
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
export const MemoizedCourseProductCard = React.memo(CourseProductCard, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.is_featured === nextProps.product.is_featured &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.rating === nextProps.product.rating &&
    prevProps.product.reviews_count === nextProps.product.reviews_count &&
    prevProps.product.video_preview === nextProps.product.video_preview &&
    prevProps.product.access_type === nextProps.product.access_type &&
    prevProps.product.created_at === nextProps.product.created_at &&
    prevProps.variant === nextProps.variant &&
    prevProps.onAction === nextProps.onAction
  );
});

MemoizedCourseProductCard.displayName = 'CourseProductCard';

/**
 * Skeleton pour loading state
 */
export const CourseProductCardSkeleton = () => {
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

export default CourseProductCard;
