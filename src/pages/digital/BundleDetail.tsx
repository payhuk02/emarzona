/**
 * Page Bundle Detail - Détails d'un bundle de produits digitaux
 * Date: 26 Janvier 2025
 */

import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useDigitalBundle } from '@/hooks/digital/useDigitalBundles';
import { useCart } from '@/hooks/cart/useCart';
import { useToast } from '@/hooks/use-toast';
import {
  Package,
  ShoppingBag,
  TrendingDown,
  Download,
  Check,
  Star,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BundleDetail() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: bundle, isLoading } = useDigitalBundle(bundleId || '');
  const { addItem } = useCart();

  const handleAddToCart = async () => {
    if (!bundle) return;

    try {
      await addItem.mutateAsync({
        productId: bundle.id,
        productType: 'digital',
        quantity: 1,
        price: bundle.bundle_price,
        metadata: {
          is_bundle: true,
          bundle_id: bundle.id,
        },
      });

      toast({
        title: 'Bundle ajouté au panier',
        description: `${bundle.name} a été ajouté à votre panier`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!bundle) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">Bundle non trouvé</p>
                <Button onClick={() => navigate(-1)} className="mt-4">
                  Retour
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Bouton retour */}
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>

            {/* Image et header */}
            <Card>
              <div className="relative">
                {bundle.image_url ? (
                  <img
                    src={bundle.image_url}
                    alt={bundle.name}
                    className="w-full h-64 md:h-96 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-64 md:h-96 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
                    <Package className="h-24 w-24 text-purple-400" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-lg px-4 py-2">
                    <Package className="h-4 w-4 mr-2" />
                    Bundle
                  </Badge>
                </div>
                {bundle.savings_percentage > 0 && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      -{bundle.savings_percentage.toFixed(0)}%
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-3xl">{bundle.name}</CardTitle>
                {bundle.short_description && (
                  <CardDescription className="text-base">
                    {bundle.short_description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                {bundle.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {bundle.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Produits inclus */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produits inclus ({bundle.bundle_items?.length || 0})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bundle.bundle_items?.map((item, index) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start gap-4">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product?.name || 'Produit'}</h4>
                            {item.product?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.product.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-semibold">
                                {formatPrice(item.product_price)} XOF
                              </span>
                              {item.product && (
                                <Link
                                  to={`/digital/${item.product.id}`}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Voir produit
                                </Link>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            {index + 1}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Prix et actions */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Prix total des produits séparés:</span>
                    <span className="text-xl line-through text-muted-foreground">
                      {formatPrice(bundle.original_price)} XOF
                    </span>
                  </div>
                  {bundle.savings > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span className="font-medium">Économie:</span>
                      <span className="text-xl font-bold">
                        -{formatPrice(bundle.savings)} XOF ({bundle.savings_percentage.toFixed(0)}%)
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">Prix du bundle:</span>
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(bundle.bundle_price)} XOF
                    </span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full mt-4"
                    onClick={handleAddToCart}
                    disabled={addItem.isPending || !bundle.is_available}
                  >
                    {addItem.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-5 w-5 mr-2" />
                        Ajouter au panier
                      </>
                    )}
                  </Button>
                </div>

                {/* Features (si disponible) */}
                {bundle.features && Array.isArray(bundle.features) && bundle.features.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-4">Caractéristiques</h3>
                      <ul className="space-y-2">
                        {bundle.features.map((feature: any, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{feature.title || feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

