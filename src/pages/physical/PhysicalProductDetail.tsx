/**
 * Physical Product Detail Page - Professional
 * Date: 29 janvier 2025
 *
 * Page complète de détail pour produits physiques avec variants, stock, shipping
 * Améliorée avec SEO, analytics, recommandations, partage social et wishlist
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatLocaleNumber } from '@/lib/i18n/locale-format';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { SafeHTML } from '@/components/security/SafeHTML';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Package,
  Truck,
  Shield,
  Star,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VariantSelector } from '@/components/physical/VariantSelector';
import { InventoryStockIndicator } from '@/components/physical/InventoryStockIndicator';
import { PhysicalProductShippingDetails } from '@/components/physical/PhysicalProductShippingDetails';
import { ProductReviewsHeroSummary } from '@/components/physical/ProductReviewsHeroSummary';
import { PhysicalProductPreOrderCard } from '@/components/physical/PhysicalProductPreOrderCard';
import { PhysicalProductDeliveryEstimate } from '@/components/physical/PhysicalProductDeliveryEstimate';
import { SizeChartDisplay } from '@/components/physical/SizeChartDisplay';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { AdvancedProductImages } from '@/components/physical/AdvancedProductImages';
import { buildCheckoutUrl } from '@/lib/checkout/checkout-route';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useProductAnalytics';
import { useWishlistToggle } from '@/hooks/wishlist/useWishlistToggle';
import { SEOMeta, ProductSchema } from '@/components/seo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  PhysicalProductRecommendations,
  BoughtTogetherPhysicalRecommendations,
} from '@/components/physical/PhysicalProductRecommendations';
import { PhysicalProductWhatsAppButton } from '@/components/physical/PhysicalProductWhatsAppButton';
import type { PhysicalProductVariant } from '@/types/physical-product';
import {
  formatPhysicalDimensions,
  formatPhysicalWeight,
  getPhysicalSellableQuantity,
  type PhysicalInventoryRow,
} from '@/lib/physical/physical-product-display';
import { usePhysicalProductDetail } from '@/hooks/physical/usePhysicalProductDetail';

// Types pour les APIs externes de tracking
interface WindowWithGtag extends Window {
  gtag?: (...args: unknown[]) => void;
}

interface WindowWithFbq extends Window {
  fbq?: (...args: unknown[]) => void;
}

interface WindowWithTtq extends Window {
  ttq?: {
    track: (event: string, data?: Record<string, unknown>) => void;
  };
}

export default function PhysicalProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState<PhysicalProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Utiliser le hook unifié pour la wishlist
  const {
    isInWishlist,
    toggle: handleWishlistToggle,
    isLoading: isCheckingWishlist,
  } = useWishlistToggle(productId);

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  const { data: product, isLoading } = usePhysicalProductDetail(productId);

  // La vérification de wishlist est gérée par useWishlistToggle via useMarketplaceFavorites

  // Track product view on mount
  useEffect(() => {
    if (productId && product) {
      trackView(productId, {
        product_type: 'physical',
        timestamp: new Date().toISOString(),
      });

      // Track with external pixels (Google Analytics, Facebook, TikTok)
      if (typeof window !== 'undefined') {
        // Google Analytics
        const windowWithGtag = window as WindowWithGtag;
        if (windowWithGtag.gtag) {
          windowWithGtag.gtag('event', 'view_item', {
            items: [
              {
                item_id: productId,
                item_name: product?.name || 'Physical Product',
                item_category: 'physical',
                price: product?.price,
                currency: product?.currency,
              },
            ],
          });
        }

        // Facebook Pixel
        const windowWithFbq = window as WindowWithFbq;
        if (windowWithFbq.fbq) {
          windowWithFbq.fbq('track', 'ViewContent', {
            content_type: 'product',
            content_ids: [productId],
            content_category: 'physical',
            value: product?.price,
            currency: product?.currency,
          });
        }

        // TikTok Pixel
        const windowWithTtq = window as WindowWithTtq;
        if (windowWithTtq.ttq) {
          windowWithTtq.ttq.track('ViewContent', {
            content_type: 'product',
            content_id: productId,
            value: product?.price,
            currency: product?.currency,
          });
        }
      }
    }
  }, [productId, trackView, product]);

  // La gestion de wishlist est gérée par useWishlistToggle (via handleWishlistToggle)

  // Handle social share
  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || 'Produit';
    const text = product?.short_description || '';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        logger.info('Partage annulé ou erreur', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Lien copié',
          description: 'Le lien a été copié dans le presse-papiers',
        });
      } catch (error) {
        logger.error('Erreur lors de la copie', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de copier le lien',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBuyNow = async () => {
    if (!product) {
      toast({
        title: '❌ Erreur',
        description: 'Produit non trouvé',
        variant: 'destructive',
      });
      return;
    }

    const availableStock = getPhysicalSellableQuantity(
      product?.inventory as PhysicalInventoryRow[] | undefined,
      selectedVariant?.id,
      product?.stock
    );

    if (availableStock < quantity) {
      toast({
        title: '❌ Stock insuffisant',
        description: `Il ne reste que ${availableStock} unité(s) en stock`,
        variant: 'destructive',
      });
      return;
    }

    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: '⚠️ Variante requise',
        description: 'Veuillez sélectionner une variante',
        variant: 'destructive',
      });
      return;
    }

    // Invité autorisé : le checkout canonique collecte email + adresse (COD ou en ligne).
    setIsBuying(true);
    try {
      navigate(
        buildCheckoutUrl({
          productId: productId!,
          storeId: product.store_id,
          variantId: selectedVariant?.id,
          quantity,
        })
      );
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <AppPageShell
        mainClassName="p-8"
        hideSidebar={true}
        showUtilityBar={false}
        hideHorizontalNav={true}
      >
        <div className="space-y-8">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppPageShell>
    );
  }

  if (!product) {
    return (
      <AppPageShell
        mainClassName="p-8"
        hideSidebar={true}
        showUtilityBar={false}
        hideHorizontalNav={true}
      >
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Produit non trouvé</p>
            </div>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  const images = product?.images || [product?.image_url] || [];
  const stockQuantity = getPhysicalSellableQuantity(
    product?.inventory as PhysicalInventoryRow[] | undefined,
    selectedVariant?.id,
    product?.stock
  );
  const physicalCheckout = parsePhysicalCheckoutOptions(product?.payment_options);
  const buyLabel = physicalCheckout.cta_button_label;
  const isCod = physicalCheckout.checkout_method === 'cash_on_delivery';
  const physicalWeightLabel = formatPhysicalWeight(product?.physical);
  const physicalDimensionsLabel = formatPhysicalDimensions(product?.physical);
  const availability = stockQuantity > 0 ? 'instock' : 'outofstock';
  const basePrice = product?.promotional_price ?? product?.price;
  const displayPrice = selectedVariant?.price ?? basePrice;
  const compareAtPrice =
    selectedVariant?.compare_at_price ??
    (product?.promotional_price != null && product.promotional_price < product.price
      ? product.price
      : null);
  const productUrl = `${window.location.origin}/physical/${productId}`;

  return (
    <AppPageShell
      mainClassName="p-8"
      hideSidebar={true}
      showUtilityBar={false}
      hideHorizontalNav={true}
    >
      {/* SEO Meta Tags */}
      <SEOMeta
        title={product.name}
        description={
          product.short_description ||
          product.description ||
          `${product.name} - Disponible sur Emarzona`
        }
        keywords={product.category}
        url={productUrl}
        image={images[0]}
        imageAlt={product.name}
        type="product"
        price={displayPrice}
        currency={product.currency}
        availability={availability}
      />

      {/* Product Schema.org */}
      {product.store && (
        <ProductSchema
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description || product.short_description || '',
            price: displayPrice,
            currency: product.currency,
            image_url: images[0],
            images: images.map((url: string) => ({ url })),
            category: product.category,
            is_active: product.is_active,
            created_at: product.created_at,
          }}
          store={{
            name: product.store.name,
            slug: product.store.slug,
            logo_url: product.store.logo_url,
          }}
          url={productUrl}
        />
      )}

      {/* Back Button */}
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left: Images */}
        <AdvancedProductImages
          productId={productId || ''}
          productName={product?.name || 'Produit'}
          standardImages={images}
          selectedVariantId={selectedVariant?.id}
          physicalProductId={product?.physical?.id}
        />

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Title & Category */}
          <div>
            <Badge className="mb-2">{product?.category}</Badge>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2">{product?.name}</h1>
            {product?.short_description && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                {product.short_description}
              </p>
            )}
            <ProductReviewsHeroSummary
              productId={productId!}
              onViewReviews={() => setActiveTab('reviews')}
              className="mt-3"
            />
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">
              {formatLocaleNumber(displayPrice, i18n.language)} {product?.currency}
            </span>
            {compareAtPrice != null && (
              <span className="text-lg text-muted-foreground line-through">
                {formatLocaleNumber(compareAtPrice, i18n.language)} {product?.currency}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          <InventoryStockIndicator
            quantity={stockQuantity}
            lowStockThreshold={10}
            showProgress={true}
            variant="default"
          />

          {/* Variants */}
          {product?.variants && product.variants.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Variantes</h3>
              <VariantSelector
                variants={product.variants}
                onVariantChange={variant => setSelectedVariant(variant)}
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="font-semibold mb-3">Quantité</h3>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
              >
                -
              </Button>
              <span className="text-lg font-medium w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                disabled={quantity >= stockQuantity}
                aria-label="Augmenter la quantité"
              >
                +
              </Button>
            </div>
          </div>

          <PhysicalProductPreOrderCard
            productId={productId!}
            variantId={selectedVariant?.id}
            currency={product?.currency}
          />

          <PhysicalProductDeliveryEstimate productId={productId!} />

          {product?.store_id && (
            <PhysicalProductShippingDetails
              storeId={product.store_id}
              countryOfOrigin={product.physical?.country_of_origin}
              currency={product.currency}
            />
          )}

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border bg-muted/30 p-3">
              <Truck className="h-4 w-4 mx-auto mb-1 text-primary" aria-hidden="true" />
              <p className="text-[11px] font-medium leading-tight">Livraison suivie</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <Shield className="h-4 w-4 mx-auto mb-1 text-primary" aria-hidden="true" />
              <p className="text-[11px] font-medium leading-tight">Paiement sécurisé</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <Package className="h-4 w-4 mx-auto mb-1 text-primary" aria-hidden="true" />
              <p className="text-[11px] font-medium leading-tight">Stock vérifié</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <PhysicalProductWhatsAppButton
              productName={product?.name || 'Produit'}
              whatsappNumber={product?.physical?.whatsapp_number}
              whatsappEnabled={product?.physical?.whatsapp_enabled}
              className="w-full"
            />

            <Button
              onClick={handleBuyNow}
              className="w-full"
              size="lg"
              disabled={stockQuantity === 0 || isBuying}
            >
              {isBuying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Redirection…
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {stockQuantity === 0 ? 'Rupture de stock' : buyLabel}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {isCod
                ? 'Paiement à la livraison — aucun paiement en ligne requis'
                : 'Paiement en ligne à la commande'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleWishlistToggle}
                disabled={isCheckingWishlist}
              >
                {isCheckingWishlist ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Heart
                    className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                  />
                )}
                {isInWishlist ? 'Retiré' : 'Favori'}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>

          {product?.physical && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {physicalWeightLabel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Poids</span>
                    <span className="font-medium">{physicalWeightLabel}</span>
                  </div>
                )}
                {physicalDimensionsLabel && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-medium">{physicalDimensionsLabel}</span>
                  </div>
                )}
                {product.physical.sku && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SKU</span>
                    <span className="font-medium">{product.physical.sku}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-12 space-y-6">
        <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="description" className="min-h-[44px] shrink-0">
            Description
          </TabsTrigger>
          <TabsTrigger value="specifications" className="min-h-[44px] shrink-0">
            Spécifications
          </TabsTrigger>
          <TabsTrigger value="reviews" className="min-h-[44px] shrink-0">
            Avis
          </TabsTrigger>
        </TabsList>

        {/* Description Tab */}
        <TabsContent value="description" className="space-y-6">
          {product?.description && (
            <Card>
              <CardHeader>
                <CardTitle>À propos de ce produit</CardTitle>
              </CardHeader>
              <CardContent>
                <SafeHTML
                  html={product.description || ''}
                  className="bg-white dark:bg-white text-black dark:text-black prose max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Size Chart */}
          {product?.size_chart_id && (
            <Card>
              <CardHeader>
                <CardTitle>Guide des tailles</CardTitle>
              </CardHeader>
              <CardContent>
                <SizeChartDisplay sizeChartId={product.size_chart_id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spécifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product?.physical && (
                <>
                  {physicalWeightLabel && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Poids</span>
                      <span className="font-medium">{physicalWeightLabel}</span>
                    </div>
                  )}
                  {physicalDimensionsLabel && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Dimensions</span>
                      <span className="font-medium">{physicalDimensionsLabel}</span>
                    </div>
                  )}
                  {product.physical.sku && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">SKU</span>
                      <span className="font-medium">{product.physical.sku}</span>
                    </div>
                  )}
                  {product.physical.manufacturer && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Fabricant</span>
                      <span className="font-medium">{product.physical.manufacturer}</span>
                    </div>
                  )}
                  {product.physical.country_of_origin && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Origine</span>
                      <span className="font-medium">{product.physical.country_of_origin}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <ProductReviewsSummary productId={productId!} productType="physical" />

          <Card>
            <CardHeader>
              <CardTitle>Avis des utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewsList productId={productId!} productType="physical" />
            </CardContent>
          </Card>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Donner votre avis</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm productId={productId!} productType="physical" />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommendations Section */}
      <Separator className="my-12" />

      <PhysicalProductRecommendations
        productId={productId!}
        category={product?.category}
        tags={product?.tags}
        limit={6}
        variant="grid"
        title="Produits similaires"
      />

      {product?.store_id && (
        <BoughtTogetherPhysicalRecommendations
          productId={productId!}
          storeId={product.store_id}
          storeName={product.store?.name}
          limit={4}
        />
      )}
    </AppPageShell>
  );
}
