/**
 * Physical Product Detail Page - Professional
 * Date: 29 janvier 2025
 *
 * Page complète de détail pour produits physiques avec variants, stock, shipping
 * Améliorée avec SEO, analytics, recommandations, partage social et wishlist
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { sanitizeProductDescription } from '@/lib/html-sanitizer';
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
import { ShippingInfoDisplay } from '@/components/physical/ShippingInfoDisplay';
import { SizeChartDisplay } from '@/components/physical/SizeChartDisplay';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ProductImages } from '@/components/shared';
import { AdvancedProductImages } from '@/components/physical/AdvancedProductImages';
import { useCart } from '@/hooks/cart/useCart';
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
import type { PhysicalProductVariant } from '@/types/physical-product';
import type { InventoryItem } from '@/hooks/physical/useInventory';

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
  const { toast } = useToast();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<PhysicalProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Utiliser le hook unifié pour la wishlist
  const { isInWishlist, toggle: handleWishlistToggle, isLoading: isCheckingWishlist } = useWishlistToggle(productId);

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  // Fetch product data with store - OPTIMIZED: Single query with all relations
  const { data: product, isLoading } = useQuery({
    queryKey: ['physical-product', productId],
    queryFn: async () => {
      // Fetch product with store in one query
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(
          `
          *,
          stores (
            id,
            name,
            slug,
            logo_url
          )
        `
        )
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Fetch all related data in parallel (instead of sequential)
      const [physicalResult, variantsResult, inventoryResult, sizeChartResult] = await Promise.all([
        supabase.from('physical_products').select('*').eq('product_id', productId).single(),
        supabase
          .from('physical_product_variants')
          .select('*')
          .eq('physical_product_id', productData?.id), // Use productData.id if physical_products.id is not available
        supabase.from('physical_product_inventory').select('*').eq('product_id', productId), // Use product_id directly if available
        supabase
          .from('product_size_charts')
          .select('size_chart_id')
          .eq('product_id', productId)
          .limit(1)
          .maybeSingle(), // Use maybeSingle to avoid error if no size chart
      ]);

      // Get physical product ID for variants and inventory if needed
      const physicalData = physicalResult.data;
      const physicalId = physicalData?.id;

      // If variants/inventory need physical_product_id, refetch with correct ID
      let variants = variantsResult.data || [];
      let inventory = inventoryResult.data || [];

      if (physicalId && (!variants.length || !inventory.length)) {
        // Refetch with physical_product_id if initial query didn't work
        const [variantsRefetch, inventoryRefetch] = await Promise.all([
          supabase
            .from('physical_product_variants')
            .select('*')
            .eq('physical_product_id', physicalId),
          supabase
            .from('physical_product_inventory')
            .select('*')
            .eq('physical_product_id', physicalId),
        ]);
        variants = variantsRefetch.data || variants;
        inventory = inventoryRefetch.data || inventory;
      }

      return {
        ...productData,
        physical: physicalData,
        variants,
        inventory,
        size_chart_id: sizeChartResult.data?.size_chart_id || null,
        store: productData.stores,
      };
    },
    enabled: !!productId,
  });

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

  const handleAddToCart = async () => {
    if (!product) {
      toast({
        title: '❌ Erreur',
        description: 'Produit non trouvé',
        variant: 'destructive',
      });
      return;
    }

    // Vérifier le stock
    const availableStock = selectedVariant
      ? product?.inventory?.find((inv: InventoryItem) => inv.variant_id === selectedVariant.id)
          ?.quantity || 0
      : product?.physical?.total_stock || 0;

    if (availableStock < quantity) {
      toast({
        title: '❌ Stock insuffisant',
        description: `Il ne reste que ${availableStock} unité(s) en stock`,
        variant: 'destructive',
      });
      return;
    }

    // Vérifier si un variant est requis mais non sélectionné
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: '⚠️ Variante requise',
        description: 'Veuillez sélectionner une variante',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      await addItem({
        product_id: productId!,
        product_type: 'physical',
        quantity,
        variant_id: selectedVariant?.id || undefined,
        variant_name: selectedVariant?.name || undefined,
        metadata: {
          store_id: product.store_id,
          physical_product_id: product.physical?.id,
          selected_at: new Date().toISOString(),
        },
      });

      logger.info('Produit ajouté au panier', {
        productId,
        variantId: selectedVariant?.id,
        quantity,
      });

      // Optionnel : Rediriger vers le panier ou réinitialiser la quantité
      setQuantity(1);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Erreur lors de l'ajout au panier", error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || "Impossible d'ajouter au panier",
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <div className="space-y-8">
              <Skeleton className="h-10 w-32" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!product) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>Produit non trouvé</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const images = product?.images || [product?.image_url] || [];
  const stockQuantity = selectedVariant
    ? product?.inventory?.find((inv: InventoryItem) => inv.variant_id === selectedVariant.id)
        ?.quantity || 0
    : product?.physical?.total_stock || 0;
  const availability = stockQuantity > 0 ? 'instock' : 'outofstock';
  const currentPrice = product?.promotional_price || product?.price;
  const productUrl = `${window.location.origin}/physical/${productId}`;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
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
            price={currentPrice}
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
                price: currentPrice,
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
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-lg sm:text-2xl md:text-3xl font-bold">
                  {product?.price.toLocaleString()} {product?.currency}
                </span>
                {product?.promotional_price && (
                  <span className="text-xl line-through text-gray-500">
                    {product.promotional_price.toLocaleString()} {product?.currency}
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
                    onSelect={(variant: PhysicalProductVariant) => setSelectedVariant(variant)}
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

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handleAddToCart}
                  className="w-full"
                  size="lg"
                  disabled={stockQuantity === 0 || isAddingToCart}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {stockQuantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </>
                  )}
                </Button>

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

              {/* Shipping Info */}
              {product?.physical && <ShippingInfoDisplay productId={productId!} />}

              {/* Features */}
              {product?.physical && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Caractéristiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {product.physical.weight_kg && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Poids</span>
                        <span className="font-medium">{product.physical.weight_kg} kg</span>
                      </div>
                    )}
                    {product.physical.dimensions && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span className="font-medium">
                          {product.physical.length_cm} x {product.physical.width_cm} x{' '}
                          {product.physical.height_cm} cm
                        </span>
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
          <Tabs defaultValue="description" className="mt-12 space-y-6">
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
                    <div
                      className="bg-white dark:bg-white text-black dark:text-black prose max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeProductDescription(product.description || ''),
                      }}
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
                      {product.physical.weight_kg && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Poids</span>
                          <span className="font-medium">{product.physical.weight_kg} kg</span>
                        </div>
                      )}
                      {product.physical.length_cm &&
                        product.physical.width_cm &&
                        product.physical.height_cm && (
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Dimensions</span>
                            <span className="font-medium">
                              {product.physical.length_cm} x {product.physical.width_cm} x{' '}
                              {product.physical.height_cm} cm
                            </span>
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

          <BoughtTogetherPhysicalRecommendations productId={productId!} limit={4} />

          {/* Reviews Summary (outside tabs for visibility) */}
          <ProductReviewsSummary productId={productId!} productType="physical" />
        </main>
      </div>
    </SidebarProvider>
  );
}
