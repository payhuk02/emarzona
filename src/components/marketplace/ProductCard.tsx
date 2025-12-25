import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Star,
  Percent,
  Shield,
  MessageSquare,
  Eye,
  Store,
  CheckCircle2,
  TrendingUp,
  Loader2,
} from '@/components/icons';
import { Heart, Play, ZoomIn } from 'lucide-react';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { safeRedirect } from '@/lib/url-validator';
// import { ProductBanner } from '@/components/ui/ResponsiveProductImage';
import { logger } from '@/lib/logger';
import { PriceStockAlertButton } from './PriceStockAlertButton';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
    price: number;
    promo_price?: number;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    purchases_count?: number;
    hide_purchase_count?: boolean | null;
    hide_rating?: boolean | null;
    hide_reviews_count?: boolean | null;
    category?: string;
    store_id?: string;
    product_type?: 'digital' | 'physical' | 'service' | 'course';
    stock_quantity?: number | null;
    licensing_type?: 'plr' | 'copyrighted' | 'standard';
    product_affiliate_settings?: Array<{
      commission_rate: number;
      affiliate_enabled: boolean;
    }> | null;
    stores?: {
      id: string;
      name: string;
      slug: string;
      logo_url?: string | null;
    } | null;
  };
  storeSlug: string;
}

const ProductCardComponent = ({ product, storeSlug }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const { toast } = useToast();
  const isDigital = product.product_type === 'digital';

  // Extraire les infos de boutique depuis product.stores (déjà joint dans la requête)
  const storeInfo = useMemo(() => {
    if (!product.stores) return null;
    // Gérer le cas où Supabase retourne un tableau ou un objet
    const store = Array.isArray(product.stores) ? product.stores[0] : product.stores;
    return store || null;
  }, [product.stores]);

  // ✅ PHASE 5: Mémoriser les calculs de prix pour éviter recalculs à chaque render
  const { price, hasPromo, discountPercent } = useMemo(() => {
    const calculatedPrice = product.promo_price ?? product.price;
    const calculatedHasPromo = product.promo_price && product.promo_price < product.price;
    const calculatedDiscountPercent = calculatedHasPromo
      ? Math.round(((product.price - product.promo_price!) / product.price) * 100)
      : 0;
    return {
      price: calculatedPrice,
      hasPromo: calculatedHasPromo,
      discountPercent: calculatedDiscountPercent,
    };
  }, [product.promo_price, product.price]);

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

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          }`}
        />
      ))}
    </div>
  );

  const handleBuyNow = async () => {
    if (!product.store_id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non disponible',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: product.currency ?? 'XOF',
        description: `Achat de ${product.name}`,
        customerEmail: 'client@example.com',
        metadata: { productName: product.name, storeSlug },
      });

      if (result.checkout_url) {
        safeRedirect(result.checkout_url, () => {
          toast({
            title: 'Erreur de paiement',
            description: 'URL de paiement invalide. Veuillez réessayer.',
            variant: 'destructive',
          });
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible d'initialiser le paiement";
      logger.error('Erreur Moneroo', { error, productId: product.id });
      toast({
        title: 'Erreur de paiement',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className="group relative flex flex-col rounded-2xl bg-card overflow-hidden product-card product-card-mobile sm:product-card-tablet lg:product-card-desktop min-h-[400px] xs:min-h-[450px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-description-${product.id}`}
    >
      {/* Bannière produit - 60% de la hauteur de la carte */}
      <div className="product-card-container flex-[0.6] relative overflow-hidden w-full group">
        {/* ✅ Ratio 3:2 (1536×1024) aligné avec le format produit, évite les hauteurs variables / CLS */}
        <div className="relative w-full aspect-[3/2] overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl bg-muted/30">
          <Link
            to={`/stores/${storeSlug}/products/${product.slug}`}
            className="block w-full h-full"
          >
            <ResponsiveProductImage
              src={product.image_url}
              alt={`Image du produit ${product.name}`}
              className="w-full h-full transition-transform duration-300 group-hover:scale-110"
              fit="contain"
              fill={true}
              context="grid"
              priority={false}
            />
          </Link>

          {/* Fallback icon (si pas d'image) */}
          {!product.image_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingCart className="h-16 w-16 opacity-20" />
            </div>
          )}

          {/* Overlay gradient au hover pour produits digitaux - Style comme CourseProductCard */}
          {isDigital && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" asChild>
                <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
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
          )}

          {/* Bouton favori en bas à droite pour produits digitaux */}
          {isDigital && (
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
          )}
        </div>
      </div>

      {/* Dialog pour zoom de l'image (produits digitaux uniquement) */}
      {isDigital && (
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
      )}

      <div className="product-card-content flex-[0.4] flex flex-col">
        <div className="flex-1">
          {/* Logo et nom de la boutique */}
          {storeInfo && (
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              {storeInfo.logo_url ? (
                <img
                  src={storeInfo.logo_url}
                  alt={`Logo de ${storeInfo.name}`}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    // Fallback si l'image ne charge pas
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.store-logo-fallback') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 store-logo-fallback ${storeInfo.logo_url ? 'hidden' : ''}`}
              >
                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                {storeInfo.name}
              </span>
              <CheckCircle2
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 -ml-2"
                aria-label="Vendeur vérifié"
                aria-hidden="true"
              />
            </div>
          )}
          {product.category && (
            <span
              className="text-xs font-medium text-primary uppercase tracking-wide mb-2 block"
              aria-label={`Catégorie: ${product.category}`}
            >
              {product.category}
            </span>
          )}

          {/* Badges Type de licence et Commission */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {/* Badge Type de licence - Style comme DigitalProductCard */}
            {product.licensing_type && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border ${
                  product.licensing_type === 'plr'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : product.licensing_type === 'copyrighted'
                      ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                      : 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <Shield className="h-3 w-3" />
                {product.licensing_type === 'plr'
                  ? 'PLR'
                  : product.licensing_type === 'copyrighted'
                    ? "Droit d'auteur"
                    : 'Standard'}
              </span>
            )}

            {/* Badge taux d'affiliation */}
            {(() => {
              // Gérer le cas où Supabase retourne un objet ou un tableau
              const affiliateSettings = Array.isArray(product.product_affiliate_settings)
                ? product.product_affiliate_settings[0]
                : product.product_affiliate_settings;

              return affiliateSettings?.affiliate_enabled &&
                affiliateSettings?.commission_rate > 0 ? (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-md"
                  title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {affiliateSettings.commission_rate}% commission
                </span>
              ) : null;
            })()}

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

          <h3
            id={`product-title-${product.id}`}
            className="product-title text-white group-hover:text-primary transition-colors mb-3"
          >
            {product.name}
          </h3>

          {/* Badges d'information - Placés après le titre de manière professionnelle */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {hasPromo && (
              <Badge className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5">
                <Percent className="h-3 w-3 mr-1" />-{discountPercent}%
              </Badge>
            )}
            {product.licensing_type === 'plr' && (
              <Badge className="bg-emerald-500 text-white text-[10px] sm:text-xs px-2 py-0.5">
                <Shield className="h-3 w-3 mr-1" />
                PLR
              </Badge>
            )}
            {product.licensing_type === 'copyrighted' && (
              <Badge className="bg-red-600 text-white text-[10px] sm:text-xs px-2 py-0.5">
                <Shield className="h-3 w-3 mr-1" />
                Droit d'auteur
              </Badge>
            )}
          </div>

          {!product.hide_rating && product.rating ? (
            <div
              className="product-rating mb-3"
              role="img"
              aria-label={`Note: ${product.rating} sur 5 étoiles`}
            >
              {renderStars(product.rating)}
              {!product.hide_reviews_count && (
                <span className="ml-1 text-xs" aria-label={`${product.reviews_count ?? 0} avis`}>
                  ({product.reviews_count ?? 0})
                </span>
              )}
            </div>
          ) : !product.hide_rating ? (
            <div className="h-5 mb-3" />
          ) : null}

          <div
            className="flex items-center justify-between gap-2 mb-2"
            aria-label="Prix du produit"
          >
            <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
              {hasPromo && (
                <span
                  className="text-xs sm:text-sm text-gray-600 line-through flex-shrink-0 whitespace-nowrap"
                  aria-label="Prix original"
                >
                  {product.price.toLocaleString()} {product.currency ?? 'FCFA'}
                </span>
              )}
              <span
                className="product-price text-sm sm:text-base md:text-lg font-bold whitespace-nowrap"
                aria-label="Prix actuel"
              >
                {price.toLocaleString()} {product.currency ?? 'FCFA'}
              </span>
            </div>
            <PriceStockAlertButton
              productId={product.id}
              productName={product.name}
              currentPrice={price}
              currency={product.currency || 'XOF'}
              productType={product.product_type || 'digital'}
              stockQuantity={product.stock_quantity}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            />
          </div>

          {/* Licensing details (amélioré) */}
          {product.licensing_type && (
            <div className="mb-4 flex items-center gap-2">
              <Shield
                className={`h-3.5 w-3.5 flex-shrink-0 ${
                  product.licensing_type === 'plr'
                    ? 'text-emerald-500'
                    : product.licensing_type === 'copyrighted'
                      ? 'text-red-500'
                      : 'text-blue-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  product.licensing_type === 'plr'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : product.licensing_type === 'copyrighted'
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-blue-700 dark:text-blue-400'
                }`}
              >
                {product.licensing_type === 'plr'
                  ? 'Licence PLR (droits de label privé)'
                  : product.licensing_type === 'copyrighted'
                    ? "Protégé par droit d'auteur"
                    : 'Licence standard'}
              </span>
            </div>
          )}

          {!product.hide_purchase_count && (
            <span
              className="text-xs text-muted-foreground mb-4 block"
              aria-label="Nombre de ventes"
            >
              {product.purchases_count ? `${product.purchases_count} ventes` : 'Aucune vente'}
            </span>
          )}
        </div>

        <div
          className="product-actions flex gap-1.5 sm:gap-2"
          role="group"
          aria-label="Actions du produit"
        >
          <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="product-button product-button-secondary min-h-[44px] h-11 text-xs sm:text-sm px-2 sm:px-3"
              aria-label={`Voir les détails du produit ${product.name}`}
            >
              <Eye
                className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 flex-shrink-0"
                aria-hidden="true"
              />
              <span className="whitespace-nowrap">Voir</span>
            </Button>
          </Link>

          {product.store_id && (
            <Link
              to={`/vendor/messaging/${product.store_id}?productId=${product.id}`}
              className="flex-1"
            >
              <Button
                variant="outline"
                size="sm"
                className="product-button product-button-secondary min-h-[44px] h-11 text-xs sm:text-sm px-2 sm:px-3"
                aria-label={`Contacter le vendeur pour ${product.name}`}
              >
                <MessageSquare
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline whitespace-nowrap">Contacter</span>
                <span className="sm:hidden whitespace-nowrap">Msg</span>
              </Button>
            </Link>
          )}

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="sm"
            className="product-button product-button-primary min-h-[44px] h-11 text-xs sm:text-sm px-2 sm:px-3"
            aria-label={`Acheter le produit ${product.name} pour ${price.toLocaleString()} ${product.currency ?? 'FCFA'}`}
          >
            {loading ? (
              <>
                <Loader2
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin mr-1 sm:mr-1.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap">Paiement...</span>
              </>
            ) : (
              <>
                <ShoppingCart
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap">Acheter</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.promo_price === nextProps.product.promo_price &&
    prevProps.product.image_url === nextProps.product.image_url &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.rating === nextProps.product.rating &&
    prevProps.product.reviews_count === nextProps.product.reviews_count &&
    prevProps.storeSlug === nextProps.storeSlug
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
