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
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { VariantSelector } from '@/components/physical/VariantSelector';
import { InventoryStockIndicator } from '@/components/physical/InventoryStockIndicator';
import { ShippingInfoDisplay } from '@/components/physical/ShippingInfoDisplay';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';

export default function PhysicalProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

      return {
        ...productData,
        physical: physicalData,
        variants: variants || [],
        inventory: inventory || [],
      };
    },
    enabled: !!productId,
  });

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    toast({
      title: '🛒 Ajouté au panier',
      description: `${product?.name} x${quantity}`,
    });
  };

  const images = product?.images || [product?.image_url] || [];
  const currentImage = images[selectedImageIndex];
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
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={currentImage}
                  alt={product?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`aspect-square rounded border-2 overflow-hidden transition-all ${
                        selectedImageIndex === idx
                          ? 'border-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product?.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              <InventoryStockIndicator stock={stockQuantity} />

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
                  disabled={stockQuantity === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {stockQuantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
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
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </CardContent>
            </Card>
          )}

          <Separator className="my-12" />

          {/* Reviews */}
          <ProductReviewsSummary productId={productId!} />
        </main>
      </div>
    </SidebarProvider>
  );
}

