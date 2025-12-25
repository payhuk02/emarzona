import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from '@/hooks/useProducts';
import type { UnifiedProduct } from '@/types/unified-product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Type étendu pour Product avec propriétés optionnelles supplémentaires
 */
interface ExtendedProduct extends Product {
  is_featured?: boolean;
  pricing_model?: 'subscription' | 'one-time';
  downloadable_files?: string[];
  licensing_type?: 'plr' | 'copyrighted' | 'standard';
  stock_quantity?: number;
  purchases_count?: number;
  hide_purchase_count?: boolean | null;
  hide_rating?: boolean | null;
  hide_reviews_count?: boolean | null;
}
import {
  ShoppingCart,
  Star,
  Download,
  Crown,
  Sparkles,
  Package,
  Zap,
  RefreshCw,
  DollarSign,
  Gift,
  Heart,
  Eye,
  TrendingUp,
  CheckCircle,
  Loader2,
  Shield,
  MessageSquare,
  Play,
  ZoomIn,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { safeRedirect } from '@/lib/url-validator';
import { PriceStockAlertButton } from '@/components/marketplace/PriceStockAlertButton';
import { stripHtmlTags as safeStripHtml } from '@/lib/utils';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import '@/styles/product-grid-professional.css';

interface ProductCardProps {
  product: ExtendedProduct & Partial<UnifiedProduct>;
  storeSlug: string;
}

const ProductCardComponent = ({ product, storeSlug }: ProductCardProps) => {
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [_userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const isDigital = product.product_type === 'digital';

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

  // Mémoriser les calculs de prix pour éviter les recalculs
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

  // Vérifier si le produit est nouveau (< 7 jours) - mémorisé
  const isNew = useMemo(() => {
    if (!product.created_at) return false;
    const createdDate = new Date(product.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff < 7;
  }, [product.created_at]);

  // Formater le prix - mémorisé
  const formatPrice = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }, []);

  // Nettoyer les balises HTML de la description - mémorisé
  const stripHtmlTags = useCallback((html: string): string => {
    // SÉCURISÉ : Extraire le texte sans utiliser innerHTML (évite XSS)
    if (!html.includes('<')) {
      // Pas de HTML, retourner directement
      return html;
    }

    // Utiliser la fonction sécurisée de utils
    try {
      return safeStripHtml(html);
    } catch (_e) {
      // Fallback : utiliser textContent (plus sûr que innerHTML)
      const temp = document.createElement('div');
      temp.textContent = html; // textContent échappe automatiquement
      return temp.textContent || '';
    }
  }, []);

  // Générer une description courte - mémorisé
  const _shortDescription = useMemo((): string | undefined => {
    let rawText = '';

    const extendedProduct = product as Product & Partial<UnifiedProduct>;
    if (extendedProduct.short_description && extendedProduct.short_description.trim()) {
      rawText = extendedProduct.short_description;
    } else if (product.description && product.description.trim()) {
      rawText = product.description;
    } else {
      return undefined;
    }

    const cleanText = stripHtmlTags(rawText).trim();

    if (cleanText.length > 120) {
      return cleanText.substring(0, 117) + '...';
    }

    return cleanText;
  }, [product, product.description, product.short_description, stripHtmlTags]);

  // Gérer les favoris - mémorisé
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

  // Gérer l'achat - mémorisé
  const handleBuyNow = useCallback(async () => {
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
        currency: product.currency ?? 'XOF',
        description: `Achat de ${product.name}`,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email.split('@')[0],
        metadata: {
          productName: product.name,
          storeSlug,
          userId: user.id,
        },
      });

      if (result.success && result.checkout_url) {
        safeRedirect(result.checkout_url, () => {
          toast({
            title: 'Erreur',
            description: 'URL de paiement invalide. Veuillez réessayer.',
            variant: 'destructive',
          });
        });
      } else {
        throw new Error("Échec de l'initialisation du paiement");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible d'initier le paiement",
        variant: 'destructive',
      });
      setLoading(false);
    }
  }, [product.store_id, product.id, product.name, product.currency, price, storeSlug, toast]);

  // Rendre les étoiles - mémorisé
  const renderStars = useCallback(
    (rating: number) => (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    ),
    []
  );

  return (
    <Card
      className="product-card-professional group relative overflow-hidden bg-transparent rounded-lg flex flex-col min-h-[400px] xs:min-h-[450px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
      role="article"
      aria-labelledby={`product-title-${product.id}`}
      aria-describedby={`product-price-${product.id}`}
      tabIndex={0}
    >
      {/* Image avec overlay et badges - Prend plus d'espace, contenu repoussé en bas */}
      <div className="product-image-container relative overflow-hidden bg-muted/30 flex-grow group">
        <Link to={`/stores/${storeSlug}/products/${product.slug}`} className="block w-full h-full">
          <ResponsiveProductImage
            src={product.image_url || '/placeholder.svg'}
            loading="lazy"
            alt={product.name}
            className="w-full h-full product-image transition-transform duration-300 group-hover:scale-110"
            priority={false}
            // ✅ Évite que l'image soit rognée (souvent en bas) dans les cartes produits
            fit="contain"
            fill={true}
            context="grid"
          />
        </Link>
        <div className="product-image-overlay" aria-hidden="true"></div>

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
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsZoomOpen(true);
                }}
                className="relative z-10"
              >
                <ZoomIn className="h-4 w-4 mr-2" />
                Zoom
              </Button>
            )}
          </div>
        )}

        {/* Overlay avec badge promotionnel */}
        {hasPromo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-yellow-500 text-white font-bold text-sm px-3 py-1 rounded-full inline-block">
                -{discountPercent}% OFF
              </div>
            </div>
          </div>
        )}

        {/* Licensing badges - Position après les badges Nouveau/Vedette pour éviter conflit */}
        {extendedProduct.licensing_type && (
          <div
            className="absolute top-3 left-3 flex flex-col gap-1 z-10"
            style={{ marginTop: isNew() || extendedProduct.is_featured ? '48px' : '0px' }}
          >
            {extendedProduct.licensing_type === 'plr' && (
              <Badge
                className="bg-emerald-500 text-white border-0 hover:bg-emerald-600"
                title="PLR (Private Label Rights) : peut être modifié et revendu selon conditions"
                aria-label="Licence PLR - Droits de label privé"
              >
                <Shield className="h-3 w-3 mr-1" /> PLR
              </Badge>
            )}
            {extendedProduct.licensing_type === 'copyrighted' && (
              <Badge
                className="bg-red-500 text-white border-0 hover:bg-red-600"
                title="Protégé par droit d'auteur : revente/modification non autorisées"
                aria-label="Protégé par droit d'auteur"
              >
                <Shield className="h-3 w-3 mr-1" /> Droit d'auteur
              </Badge>
            )}
            {extendedProduct.licensing_type === 'standard' && (
              <Badge
                className="bg-blue-500 text-white border-0 hover:bg-blue-600"
                title="Licence standard : utilisation personnelle uniquement"
                aria-label="Licence standard"
              >
                <Shield className="h-3 w-3 mr-1" /> Standard
              </Badge>
            )}
          </div>
        )}

        {/* Bouton favori - Position optimisée pour produits digitaux */}
        <button
          onClick={handleFavorite}
          className={`absolute ${
            isDigital ? 'bottom-2 right-2' : 'top-3 right-3'
          } p-2.5 sm:p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none z-10 touch-manipulation active:scale-90 transition-transform min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center`}
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

      {/* Contenu de la carte - Repoussé en bas pour laisser plus d'espace à l'image */}
      <CardContent className="p-4 sm:p-5 flex-shrink-0 flex flex-col gap-2 sm:gap-3">
        {/* Titre du produit */}
        <Link to={`/stores/${storeSlug}/products/${product.slug}`}>
          <h3 className="font-semibold text-lg text-white mb-3 line-clamp-2 leading-tight">
            {product.name}
          </h3>
        </Link>

        {/* Rating et avis */}
        {!extendedProduct.hide_rating && (
          <div className="flex items-center gap-2 mb-3">
            {product.rating > 0 ? (
              <>
                {renderStars(product.rating)}
                <span className="text-sm font-medium text-gray-700">
                  {product.rating.toFixed(1)}
                </span>
                {!extendedProduct.hide_reviews_count && (
                  <span className="text-sm text-gray-600">({product.reviews_count || 0})</span>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Vérifié</span>
              </div>
            )}
          </div>
        )}

        {/* Badges type, catégorie et pricing model */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.category && (
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 border-0">
              <Package className="h-3 w-3 mr-1" />
              {product.category}
            </Badge>
          )}

          {product.product_type && (
            <Badge
              variant="secondary"
              className={`text-xs border-0 ${
                product.product_type === 'digital'
                  ? 'bg-blue-100 text-blue-800'
                  : product.product_type === 'physical'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
              }`}
            >
              <Zap className="h-3 w-3 mr-1" />
              {product.product_type === 'digital'
                ? 'Numérique'
                : product.product_type === 'physical'
                  ? 'Physique'
                  : 'Service'}
            </Badge>
          )}

          {/* Badges Type de licence et Commission */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge Type de licence - Style comme DigitalProductCard */}
            {extendedProduct.licensing_type && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  extendedProduct.licensing_type === 'plr'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : extendedProduct.licensing_type === 'copyrighted'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-blue-500 text-blue-600 dark:text-blue-400'
                }`}
              >
                <Shield className="h-3 w-3 mr-1" />
                {extendedProduct.licensing_type === 'plr'
                  ? 'PLR'
                  : extendedProduct.licensing_type === 'copyrighted'
                    ? "Droit d'auteur"
                    : 'Standard'}
              </Badge>
            )}

            {/* Badge taux d'affiliation */}
            {(() => {
              // Gérer le cas où Supabase retourne un objet, un tableau, ou null
              let affiliateSettings = null;

              if (product.product_affiliate_settings) {
                if (Array.isArray(product.product_affiliate_settings)) {
                  // Tableau : prendre le premier élément s'il existe
                  affiliateSettings =
                    product.product_affiliate_settings.length > 0
                      ? product.product_affiliate_settings[0]
                      : null;
                } else {
                  // Objet direct
                  affiliateSettings = product.product_affiliate_settings;
                }
              }

              // Afficher le badge si l'affiliation est activée et le taux > 0
              if (affiliateSettings?.affiliate_enabled && affiliateSettings?.commission_rate > 0) {
                return (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
                    title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {affiliateSettings.commission_rate}% commission
                  </Badge>
                );
              }

              return null;
            })()}

            {/* Badge Modèle de tarification */}
            <PricingModelBadge pricingModel={extendedProduct.pricing_model} size="sm" />

            {/* Badge Options de paiement */}
            <PaymentOptionsBadge
              paymentOptions={getPaymentOptions(
                extendedProduct as {
                  payment_options?: {
                    payment_type?: 'full' | 'percentage' | 'delivery_secured';
                    percentage_rate?: number;
                  } | null;
                }
              )}
              size="sm"
            />
          </div>

          {extendedProduct.pricing_model && (
            <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 border-0">
              {extendedProduct.pricing_model === 'subscription' && (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Abonnement
                </>
              )}
              {extendedProduct.pricing_model === 'one-time' && (
                <>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Achat unique
                </>
              )}
              {extendedProduct.pricing_model === 'free' && (
                <>
                  <Gift className="h-3 w-3 mr-1" />
                  Gratuit
                </>
              )}
              {extendedProduct.pricing_model === 'pay-what-you-want' && (
                <>
                  <DollarSign className="h-3 w-3 mr-1" />
                  Prix libre
                </>
              )}
            </Badge>
          )}
        </div>

        {/* Badge fichiers téléchargeables */}
        {extendedProduct.downloadable_files &&
          Array.isArray(extendedProduct.downloadable_files) &&
          extendedProduct.downloadable_files.length > 0 && (
            <div className="mb-3">
              <Badge
                variant="secondary"
                className="text-xs bg-green-500/10 text-green-700 border-green-500/20"
              >
                <Download className="h-3 w-3 mr-1" />
                {extendedProduct.downloadable_files.length} fichier
                {extendedProduct.downloadable_files.length > 1 ? 's' : ''}
              </Badge>
            </div>
          )}

        {/* Licensing details (amélioré) */}
        {extendedProduct.licensing_type && (
          <div className="mb-3 flex items-center gap-2">
            <Shield
              className={`h-3.5 w-3.5 flex-shrink-0 ${
                extendedProduct.licensing_type === 'plr'
                  ? 'text-emerald-500'
                  : extendedProduct.licensing_type === 'copyrighted'
                    ? 'text-red-500'
                    : 'text-blue-500'
              }`}
            />
            <span
              className={`text-xs font-medium ${
                extendedProduct.licensing_type === 'plr'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : extendedProduct.licensing_type === 'copyrighted'
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-blue-700 dark:text-blue-400'
              }`}
            >
              {extendedProduct.licensing_type === 'plr'
                ? 'Licence PLR (droits de label privé)'
                : extendedProduct.licensing_type === 'copyrighted'
                  ? "Protégé par droit d'auteur"
                  : 'Licence standard'}
            </span>
          </div>
        )}

        {/* Prix et ventes */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-1">
              {hasPromo && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.price)} {product.currency || 'XOF'}
                </span>
              )}
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(price)} {product.currency || 'XOF'}
              </span>
              <PriceStockAlertButton
                productId={product.id}
                productName={product.name}
                currentPrice={price}
                currency={product.currency || 'XOF'}
                productType={product.product_type || 'digital'}
                stockQuantity={extendedProduct.stock_quantity}
                variant="outline"
                size="sm"
                className="flex-shrink-0 h-7"
              />
            </div>
            {!extendedProduct.hide_purchase_count &&
              extendedProduct.purchases_count !== undefined && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>{extendedProduct.purchases_count || 0}</span>
                </div>
              )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="product-action-button flex-1 h-10 text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 border-amber-500 transition-all duration-200"
            asChild
          >
            <Link
              to={`/stores/${storeSlug}/products/${product.slug}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Eye className="h-4 w-4 text-white" />
              <span className="font-medium text-white">Voir</span>
            </Link>
          </Button>

          {product.store_id && (
            <Button
              variant="outline"
              size="sm"
              className="product-action-button flex-1 h-10 text-white bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 border-purple-700 transition-all duration-200"
              asChild
            >
              <Link
                to={`/vendor/messaging/${product.store_id}?productId=${product.id}`}
                className="flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4 text-white" />
                <span className="font-medium hidden sm:inline text-white">Contacter</span>
              </Link>
            </Button>
          )}

          <Button
            onClick={handleBuyNow}
            disabled={loading}
            size="sm"
            className="product-action-button flex-1 h-10 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium"
            aria-label={
              loading
                ? `Traitement de l'achat de ${product.name} en cours`
                : `Acheter ${product.name} pour ${formatPrice(price)} ${product.currency || 'XOF'}`
            }
          >
            <div className="flex items-center justify-center gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Paiement...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Acheter</span>
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
const ProductCard = React.memo(ProductCardComponent, (prevProps, nextProps) => {
  const prevProduct = prevProps.product as ExtendedProduct;
  const nextProduct = nextProps.product as ExtendedProduct;

  return (
    prevProduct.id === nextProduct.id &&
    prevProduct.price === nextProduct.price &&
    prevProduct.promo_price === nextProduct.promo_price &&
    prevProduct.image_url === nextProduct.image_url &&
    prevProduct.name === nextProduct.name &&
    prevProduct.rating === nextProduct.rating &&
    prevProduct.reviews_count === nextProduct.reviews_count &&
    prevProduct.is_featured === nextProduct.is_featured &&
    prevProduct.pricing_model === nextProduct.pricing_model &&
    prevProduct.licensing_type === nextProduct.licensing_type &&
    prevProduct.stock_quantity === nextProduct.stock_quantity &&
    prevProduct.purchases_count === nextProduct.purchases_count &&
    prevProps.storeSlug === nextProps.storeSlug
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
