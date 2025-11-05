/**
 * Physical Product Detail Page
 * Date: 28 octobre 2025
 * 
 * Page de détail pour produits physiques avec variants, stock, shipping
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { sanitizeHTML } from '@/lib/html-sanitizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VariantSelector } from '@/components/physical/VariantSelector';
import { InventoryStockIndicator } from '@/components/physical/InventoryStockIndicator';
import { ShippingInfoDisplay } from '@/components/physical/ShippingInfoDisplay';
import { SizeChartDisplay } from '@/components/physical/SizeChartDisplay';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { ProductImages } from '@/components/shared';
import { useCart } from '@/hooks/cart/useCart';
import { logger } from '@/lib/logger';

export default function PhysicalProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Fetch product data
  const { data: product, isLoading } = useQuery({
    queryKey: ['physical-product', productId],
    queryFn: async () => {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Fetch physical product details
      const { data: physicalData } = await supabase
        .from('physical_products')
        .select('*')
        .eq('product_id', productId)
        .single();

      // Fetch variants
      const { data: variants } = await supabase
        .from('physical_product_variants')
        .select('*')
        .eq('physical_product_id', physicalData?.id);

      // Fetch inventory
      const { data: inventory } = await supabase
        .from('physical_product_inventory')
        .select('*')
        .eq('physical_product_id', physicalData?.id);

      // Fetch size chart
      const { data: sizeChartMapping } = await supabase
        .from('product_size_charts')
        .select('size_chart_id')
        .eq('product_id', productId)
        .limit(1)
        .single();

      return {
        ...productData,
        physical: physicalData,
        variants: variants || [],
        inventory: inventory || [],
        size_chart_id: sizeChartMapping?.size_chart_id || null,
      };
    },
    enabled: !!productId,
  });

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
      ? product?.inventory?.find((inv: any) => inv.variant_id === selectedVariant.id)?.quantity || 0
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
    } catch (error: any) {
      logger.error('Erreur lors de l\'ajout au panier', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const images = product?.images || [product?.image_url] || [];
  const stockQuantity = selectedVariant
    ? product?.inventory?.find((inv: any) => inv.variant_id === selectedVariant.id)?.quantity || 0
    : product?.physical?.total_stock || 0;

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Left: Images */}
            <ProductImages
              images={images}
              productName={product?.name || 'Produit'}
              showThumbnails={true}
              enableLightbox={true}
              aspectRatio="square"
            />

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Title & Category */}
              <div>
                <Badge className="mb-2">{product?.category}</Badge>
                <h1 className="text-3xl font-bold mb-2">{product?.name}</h1>
                {product?.short_description && (
                  <p className="text-muted-foreground">
                    {product.short_description}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold">
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
                    onSelect={(variant: any) => setSelectedVariant(variant)}
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
                  >
                    -
                  </Button>
                  <span className="text-lg font-medium w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                    disabled={quantity >= stockQuantity}
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
                  <Button variant="outline" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Favori
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Shipping Info */}
              {product?.physical && (
                <ShippingInfoDisplay productId={productId!} />
              )}

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
                        <span className="font-medium">
                          {product.physical.weight_kg} kg
                        </span>
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

          {/* Description */}
          {product?.description && (
            <Card className="mb-12">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(product.description, 'productDescription') }}
                />
              </CardContent>
            </Card>
          )}

          <Separator className="my-12" />

          {/* Size Chart */}
          {product?.size_chart_id && (
            <>
              <SizeChartDisplay sizeChartId={product.size_chart_id} />
              <Separator className="my-12" />
            </>
          )}

          {/* Reviews */}
          <ProductReviewsSummary productId={productId!} />
        </main>
      </div>
    </SidebarProvider>
  );
}

