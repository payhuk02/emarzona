import React, { useState, useEffect, useMemo } from 'react';
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
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { safeRedirect } from '@/lib/url-validator';
import { ProductBanner } from '@/components/ui/ResponsiveProductImage';
import { logger } from '@/lib/logger';
import { PriceStockAlertButton } from './PriceStockAlertButton';
import { supabase } from '@/integrations/supabase/client';

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
  };
  storeSlug: string;
}

const ProductCardComponent = ({ product, storeSlug }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const [_userId, setUserId] = useState<string | null>(null);
  const [storeInfo, setStoreInfo] = useState<{ name: string; logo_url?: string | null } | null>(
    null
  );
  const { toast } = useToast();

  // Récupérer l'utilisateur pour les alertes
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // Récupérer les informations de la boutique
  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (product.store_id) {
        try {
          const { data, error } = await supabase
            .from('stores')
            .select('name, logo_url')
            .eq('id', product.store_id)
            .single();

          if (!error && data) {
            setStoreInfo(data);
          }
        } catch (error) {
          logger.error('Error fetching store info', { error });
        }
      }
    };
    fetchStoreInfo();
  }, [product.store_id]);

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
      <div className="product-card-container flex-[0.6] min-h-[240px] xs:min-h-[270px] sm:min-h-[300px] md:min-h-[360px] lg:min-h-[420px] relative overflow-hidden w-full">
        <ProductBanner
          src={product.image_url}
          alt={`Image du produit ${product.name}`}
          className="w-full h-full product-banner"
          fallbackIcon={<ShoppingCart className="h-16 w-16 opacity-20" />}
          badges={
            <div className="flex flex-col gap-1">
              {hasPromo && (
                <div
                  className="product-badge"
                  role="img"
                  aria-label={`Réduction de ${discountPercent}%`}
                >
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Percent className="h-3 w-3" aria-hidden="true" /> -{discountPercent}%
                  </div>
                </div>
              )}
              {product.licensing_type === 'plr' && (
                <div className="product-badge">
                  <div
                    className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"
                    aria-label="Licence PLR"
                    title="PLR (Private Label Rights) : peut être modifié et revendu selon conditions"
                  >
                    <Shield className="h-3 w-3" aria-hidden="true" /> PLR
                  </div>
                </div>
              )}
              {product.licensing_type === 'copyrighted' && (
                <div className="product-badge">
                  <div
                    className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1"
                    aria-label="Protégé par droit d'auteur"
                    title="Protégé par droit d'auteur : revente/modification non autorisées"
                  >
                    <Shield className="h-3 w-3" aria-hidden="true" /> Droit d'auteur
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>

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
                />
              ) : (
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
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

          {/* Badge taux d'affiliation */}
          {(() => {
            // Gérer le cas où Supabase retourne un objet ou un tableau
            const affiliateSettings = Array.isArray(product.product_affiliate_settings)
              ? product.product_affiliate_settings[0]
              : product.product_affiliate_settings;

            return affiliateSettings?.affiliate_enabled &&
              affiliateSettings?.commission_rate > 0 ? (
              <div className="mb-2">
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2 py-1 rounded-md"
                  title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
                >
                  <TrendingUp className="h-3 w-3" />
                  {affiliateSettings.commission_rate}% commission
                </span>
              </div>
            ) : null;
          })()}

          <h3
            id={`product-title-${product.id}`}
            className="product-title group-hover:text-primary transition-colors mb-2"
          >
            {product.name}
          </h3>

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
