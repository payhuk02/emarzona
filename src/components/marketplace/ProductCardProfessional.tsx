import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Star,
  Heart,
  Eye,
  CheckCircle,
  TrendingUp,
  Loader2,
  BarChart3,
  Download,
  Shield,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { safeRedirect } from '@/lib/url-validator';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useCart } from '@/hooks/cart/useCart';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import '@/styles/product-grid-professional.css';

interface ProductCardProfessionalProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    image_url?: string;
    price: number;
    promotional_price?: number;
    currency?: string;
    rating?: number;
    reviews_count?: number;
    purchases_count?: number;
    hide_purchase_count?: boolean | null;
    hide_rating?: boolean | null;
    hide_reviews_count?: boolean | null;
    category?: string;
    product_type?: 'digital' | 'physical' | 'service' | 'course';
    stock_quantity?: number | null;
    store_id?: string;
    stores?: {
      id: string;
      name: string;
      slug: string;
      logo_url?: string;
    };
    tags?: string[];
    created_at?: string;
    licensing_type?: 'plr' | 'copyrighted' | 'standard';
    license_terms?: string;
    downloadable_files?: string[];
    product_affiliate_settings?: Array<{
      commission_rate: number;
      affiliate_enabled: boolean;
    }> | null;
  };
  storeSlug: string;
  onAddToComparison?: () => void;
  isInComparison?: boolean;
}

const ProductCardProfessionalComponent = ({
  product,
  storeSlug,
  onAddToComparison,
  isInComparison = false,
}: ProductCardProfessionalProps) => {
  const [loading, setLoading] = useState(false);
  const [_userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { addItem } = useCart();

  // Hook centralisé pour favoris synchronisés
  const { favorites, toggleFavorite } = useMarketplaceFavorites();
  const isFavorite = favorites.has(product.id);

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

  // ✅ PHASE 5: Mémoriser les calculs de prix pour éviter recalculs à chaque render
  const { price, hasPromo, discountPercent } = useMemo(() => {
    const calculatedPrice = product.promotional_price ?? product.price;
    const calculatedHasPromo =
      product.promotional_price && product.promotional_price < product.price;
    const calculatedDiscountPercent = calculatedHasPromo
      ? Math.round(((product.price - product.promotional_price!) / product.price) * 100)
      : 0;
    return {
      price: calculatedPrice,
      hasPromo: calculatedHasPromo,
      discountPercent: calculatedDiscountPercent,
    };
  }, [product.promotional_price, product.price]);

  const renderStars = (rating: number) => (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`Note: ${rating.toFixed(1)} sur 5 étoiles`}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          aria-hidden="true"
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

      // Récupérer l'utilisateur authentifié
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour effectuer un achat',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const result = await initiateMonerooPayment({
        storeId: product.store_id,
        productId: product.id,
        amount: price,
        currency: (product.currency ?? 'XOF') as
          | 'XOF'
          | 'EUR'
          | 'USD'
          | 'GBP'
          | 'NGN'
          | 'GHS'
          | 'KES'
          | 'ZAR',
        description: `Achat de ${product.name}`,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: {
          productName: product.name,
          storeSlug,
          userId: user.id,
        },
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
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      logger.error("Erreur lors de l'achat:", { error: errorMessage, productId: product.id });
      toast({
        title: 'Erreur de paiement',
        description: errorMessage || "Impossible d'initialiser le paiement",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product.store_id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non disponible',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addItem({
        product_id: product.id,
        product_type: (product.product_type || 'digital') as
          | 'digital'
          | 'physical'
          | 'service'
          | 'course',
        quantity: 1,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      logger.error("Erreur lors de l'ajout au panier:", {
        error: errorMessage,
        productId: product.id,
      });
      // Error already handled in hook
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(product.id);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      SEO: 'bg-blue-100 text-blue-800',
      Marketing: 'bg-green-100 text-green-800',
      Design: 'bg-purple-100 text-purple-800',
      Développement: 'bg-orange-100 text-orange-800',
      Rédaction: 'bg-pink-100 text-pink-800',
      Traduction: 'bg-indigo-100 text-indigo-800',
      Audio: 'bg-yellow-100 text-yellow-800',
      Vidéo: 'bg-red-100 text-red-800',
      Business: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card
      className="product-card-professional group relative overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 hover:-translate-y-2 rounded-lg flex flex-col min-h-[400px] xs:min-h-[450px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] shadow-sm hover:shadow-lg will-change-transform"
      role="article"
      aria-label={`Produit: ${product.name}`}
    >
      {/* Image avec overlay et badges - Prend plus d'espace, contenu repoussé en bas */}
      <div className="product-image-container relative overflow-hidden bg-muted/30 flex-grow">
        <ResponsiveProductImage
          src={product.image_url || '/placeholder.svg'}
          alt={product.name}
          className="w-full h-full"
          priority={false}
          fit="contain"
          fill={true}
          context="grid"
        />
        <div className="product-image-overlay" aria-hidden="true"></div>

        {/* Overlay avec badge promotionnel seulement */}
        {hasPromo && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            aria-hidden="true"
          >
            <div className="absolute bottom-4 left-4 right-4">
              <div
                className="bg-yellow-500 text-white font-bold text-sm px-3 py-1 rounded-full inline-block"
                role="status"
                aria-label={`Promotion de ${discountPercent}%`}
              >
                -{discountPercent}% OFF
              </div>
            </div>
          </div>
        )}

        {/* Bouton favori */}
        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
          aria-label={
            isFavorite
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
          aria-pressed={isFavorite}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            aria-hidden="true"
          />
        </button>

        {/* Bouton comparer */}
        {onAddToComparison && (
          <button
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              onAddToComparison();
            }}
            disabled={isInComparison}
            className={`absolute top-3 right-14 p-2 backdrop-blur-sm rounded-full transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
              isInComparison ? 'bg-blue-500/90 cursor-not-allowed' : 'bg-white/90 hover:bg-white'
            }`}
            aria-label={
              isInComparison
                ? `${product.name} déjà dans la comparaison`
                : `Ajouter ${product.name} à la comparaison`
            }
            aria-pressed={isInComparison}
          >
            <BarChart3
              className={`h-5 w-5 ${isInComparison ? 'text-white' : 'text-gray-600'}`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Badge de catégorie */}
        {product.category && (
          <div className="absolute top-3 left-3">
            <Badge
              className={`${getCategoryColor(product.category)} border-0`}
              aria-label={`Catégorie: ${product.category}`}
            >
              {product.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Contenu de la carte - 40% de la hauteur de la carte */}
      <CardContent className="p-4 sm:p-5 flex-shrink-0 flex flex-col gap-2 sm:gap-3">
        {/* Logo et nom de la boutique */}
        {product.stores && (
          <div
            className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4"
            role="group"
            aria-label="Informations du vendeur"
          >
            {product.stores.logo_url ? (
              <img
                src={product.stores.logo_url}
                alt={`Logo de ${product.stores.name}`}
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
              {product.stores.name}
            </span>
            <CheckCircle
              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 -ml-2"
              aria-label="Vendeur vérifié"
            />
          </div>
        )}

        {/* Titre du produit */}
        <h3
          className="font-semibold text-lg text-white mb-3 line-clamp-2 leading-tight"
          id={`product-title-${product.id}`}
        >
          {product.name}
        </h3>

        {/* Badges d'information - Placés après le titre de manière professionnelle */}
        {product && product.licensing_type && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {product.licensing_type === 'plr' && (
              <Badge
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5"
                aria-label="Licence: PLR - Private Label Rights"
                title="PLR (Private Label Rights) : peut être modifié et revendu selon conditions"
              >
                <Shield className="h-3 w-3 mr-1" /> PLR
              </Badge>
            )}
            {product.licensing_type === 'copyrighted' && (
              <Badge
                className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5"
                aria-label="Produit protégé par droit d'auteur"
                title="Protégé par droit d'auteur : revente/modification non autorisées"
              >
                <Shield className="h-3 w-3 mr-1" /> Droit d'auteur
              </Badge>
            )}
            {product.licensing_type === 'standard' && (
              <Badge
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 text-[10px] sm:text-xs px-2 py-0.5"
                aria-label="Licence standard"
                title="Licence standard : utilisation personnelle uniquement"
              >
                <Shield className="h-3 w-3 mr-1" /> Standard
              </Badge>
            )}
          </div>
        )}

        {/* Rating et avis */}
        {!product.hide_rating && (
          <div
            className="flex items-center gap-2 mb-4"
            role="group"
            aria-label="Évaluation du produit"
          >
            {product.rating ? (
              <>
                {renderStars(product.rating)}
                <span className="text-sm font-medium text-gray-700" aria-hidden="true">
                  {product.rating.toFixed(1)}
                </span>
                {!product.hide_reviews_count && (
                  <span
                    className="text-sm text-gray-500"
                    aria-label={`${product.reviews_count || 0} avis client${(product.reviews_count || 0) !== 1 ? 's' : ''}`}
                  >
                    ({product.reviews_count || 0})
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                <span className="text-sm">Vérifié</span>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3" role="list" aria-label="Tags du produit">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs" role="listitem">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Badges Type de licence et Commission */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {/* Badge Type de licence - Style comme DigitalProductCard */}
          {product.licensing_type && (
            <Badge
              variant="outline"
              className={`text-xs ${
                product.licensing_type === 'plr'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : product.licensing_type === 'copyrighted'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-blue-500 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {product.licensing_type === 'plr'
                ? 'PLR'
                : product.licensing_type === 'copyrighted'
                  ? "Droit d'auteur"
                  : 'Standard'}
            </Badge>
          )}

          {/* Badge taux d'affiliation */}
          {(() => {
            // Gérer le cas où Supabase retourne un objet ou un tableau
            const productWithAffiliate = product as typeof product & {
              product_affiliate_settings?: Array<{
                commission_rate: number;
                affiliate_enabled: boolean;
              }> | null;
            };
            const affiliateSettings = Array.isArray(productWithAffiliate.product_affiliate_settings)
              ? productWithAffiliate.product_affiliate_settings[0]
              : productWithAffiliate.product_affiliate_settings;

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

        {/* 📎 NOUVEAU: Badge fichiers téléchargeables */}
        {product.downloadable_files &&
          Array.isArray(product.downloadable_files) &&
          product.downloadable_files.length > 0 && (
            <div className="mb-3">
              <Badge
                variant="secondary"
                className="text-xs bg-green-500/10 text-green-700 border-green-500/20"
              >
                <Download className="h-3 w-3 mr-1" />
                {product.downloadable_files.length} fichier
                {product.downloadable_files.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}

        {/* Prix et actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1"
              role="group"
              aria-label="Prix du produit"
            >
              {hasPromo && (
                <span
                  className="text-xs sm:text-sm text-gray-600 line-through flex-shrink-0 whitespace-nowrap"
                  aria-label={`Prix original: ${formatPrice(product.price)} ${product.currency || 'FCFA'}`}
                >
                  {formatPrice(product.price)} {product.currency || 'FCFA'}
                </span>
              )}
              <span className="text-sm sm:text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">
                {formatPrice(price)} {product.currency || 'FCFA'}
              </span>
            </div>
            <PriceStockAlertButton
              productId={product.id}
              productName={product.name}
              currentPrice={price}
              currency={product.currency || 'XOF'}
              productType={product.product_type || 'digital'}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            />
          </div>

          {/* Nombre de ventes */}
          {!product.hide_purchase_count &&
            product.purchases_count !== undefined &&
            product.purchases_count > 0 && (
              <div
                className="flex items-center gap-1 text-xs sm:text-sm text-gray-500"
                aria-label={`${product.purchases_count} vente${product.purchases_count !== 1 ? 's' : ''}`}
              >
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                <span aria-hidden="true">
                  {product.purchases_count} vente{product.purchases_count !== 1 ? 's' : ''}
                </span>
              </div>
            )}
        </div>

        {/* Boutons d'action - OPTIMISÉS SANS DÉBORDEMENT */}
        <div className="flex flex-col gap-2 mt-5" role="group" aria-label="Actions du produit">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="product-action-button flex-1 min-h-[44px] h-11 px-3 text-sm text-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              asChild
            >
              <Link
                to={`/stores/${storeSlug}/products/${product.slug}`}
                aria-label={`Voir les détails de ${product.name}`}
                className="flex items-center justify-center gap-1.5 truncate"
              >
                <Eye className="h-4 w-4 flex-shrink-0 text-white" aria-hidden="true" />
                <span className="hidden lg:inline truncate text-white">Voir</span>
                <span className="lg:hidden truncate text-white">Voir</span>
              </Link>
            </Button>

            <Button
              onClick={handleAddToCart}
              disabled={loading}
              size="sm"
              variant="outline"
              className="product-action-button min-h-[44px] h-11 px-3 text-sm border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label={`Ajouter ${product.name} au panier`}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="sm"
            className="product-action-button w-full min-h-[44px] h-11 px-3 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            aria-label={
              loading
                ? `Traitement de l'achat de ${product.name} en cours`
                : `Acheter ${product.name} pour ${formatPrice(price)} ${product.currency || 'FCFA'}`
            }
          >
            <div className="flex items-center justify-center gap-1.5 truncate w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Paiement...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">Acheter maintenant</span>
                </>
              )}
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ProductCardProfessional = React.memo(
  ProductCardProfessionalComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.product.id === nextProps.product.id &&
      prevProps.product.price === nextProps.product.price &&
      prevProps.product.promotional_price === nextProps.product.promotional_price &&
      prevProps.product.image_url === nextProps.product.image_url &&
      prevProps.product.name === nextProps.product.name &&
      prevProps.product.rating === nextProps.product.rating &&
      prevProps.product.reviews_count === nextProps.product.reviews_count &&
      prevProps.storeSlug === nextProps.storeSlug &&
      prevProps.isInComparison === nextProps.isInComparison &&
      prevProps.onAddToComparison === nextProps.onAddToComparison
    );
  }
);

ProductCardProfessional.displayName = 'ProductCardProfessional';

export default ProductCardProfessional;
