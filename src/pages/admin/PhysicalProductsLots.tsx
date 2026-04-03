/**
 * Page Admin Gestion des Lots et Expiration
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpirationAlerts } from '@/components/physical/lots';
import { Package, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LotsManager } from '@/components/physical/lots';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function PhysicalProductsLots() {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Get current user's store from context (évite l'erreur 406)
  const { selectedStore: store, loading: storeLoading } = useStoreContext();

  // Get physical products for selection
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ['store-physical-products-lots', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      try {
        // Étape 1 : Récupérer les produits physiques depuis products avec product_type = 'physical'
        const { data: storeProducts, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .eq('store_id', store.id)
          .eq('product_type', 'physical')
          .limit(100);

        if (productsError) {
          logger.error('Error fetching products', { error: productsError, storeId: store.id });
          throw productsError;
        }

        if (!storeProducts || storeProducts.length === 0) return [];

        const productIds = storeProducts.map(p => p.id);

        // Étape 2 : Récupérer les physical_products correspondants
        const { data: physicalProducts, error: physicalError } = await supabase
          .from('physical_products')
          .select('id, product_id')
          .in('product_id', productIds)
          .limit(100);

        if (physicalError) {
          logger.error('Error fetching physical products', { error: physicalError, productIds });
          // Si on ne peut pas récupérer les physical_products, retourner quand même les produits
          return storeProducts.map(
            (p: StoreProduct): ProductWithInfo => ({
              id: p.id, // Utiliser product_id comme id temporaire
              product: {
                id: p.id,
                name: p.name,
              },
            })
          );
        }

        // Combiner les données : physical_products avec leurs produits
        interface PhysicalProductWithInfo {
          id: string;
          product_id: string;
        }
        interface StoreProduct {
          id: string;
          name: string;
        }
        return (physicalProducts || []).map((pp: PhysicalProductWithInfo): ProductWithInfo => {
          const productInfo = storeProducts.find((p: StoreProduct) => p.id === pp.product_id);
          return {
            id: pp.id,
            product: {
              id: pp.product_id,
              name:
                productInfo?.name || `Produit ${pp.product_id?.slice(0, 8) || pp.id.slice(0, 8)}`,
            },
          };
        });
      } catch (error) {
        logger.error('Error in physical products query', { error, storeId: store.id });
        throw error;
      }
    },
    enabled: !!store?.id,
  });

  if (storeLoading || productsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 sm:h-12 lg:h-14 w-full" />
              <div className="space-y-3 sm:space-y-4">
                <Skeleton className="h-12 sm:h-14 w-full" />
                <Skeleton className="h-64 sm:h-80 lg:h-96 w-full" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 md:p-5 lg:p-6 flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm sm:text-base text-muted-foreground">Chargement...</p>
                {productsError && (
                  <p className="text-xs sm:text-sm text-destructive mt-2">
                    Erreur lors du chargement des produits
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto bg-background pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 flex-shrink-0">
                    <Package
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                    Gestion des Lots et Expiration
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez les lots de produits avec dates d'expiration et rotation FIFO/LIFO/FEFO
                </p>
              </div>
            </div>

            <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs defaultValue="alerts" className="space-y-4 sm:space-y-6 w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                  <TabsTrigger
                    value="alerts"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Alertes d'Expiration</span>
                    <span className="sm:hidden truncate">Alertes</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="lots"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 flex items-center justify-center whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Gestion des Lots</span>
                    <span className="sm:hidden truncate">Lots</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="alerts"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <ExpirationAlerts />
                </TabsContent>

                <TabsContent
                  value="lots"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <div className="space-y-4 sm:space-y-6 w-full">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
                      <Label className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap flex-shrink-0 pt-2 sm:pt-0">
                        Sélectionner un Produit
                      </Label>
                      <div className="flex-1 w-full sm:w-auto min-w-0">
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger className="w-full sm:w-[300px] md:w-[350px] min-h-[44px] h-10 sm:h-11 md:h-12 text-xs sm:text-sm touch-manipulation">
                            <SelectValue placeholder="Choisir un produit..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {products && products.length > 0 ? (
                              products.map(product => (
                                <SelectItem
                                  key={product.id}
                                  value={product.id}
                                  className="text-xs sm:text-sm"
                                >
                                  {product.product?.name || `Produit ${product.id.slice(0, 8)}`}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground">
                                Aucun produit physique trouvé
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {productsError && (
                      <div className="p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-xs sm:text-sm text-destructive">
                          Erreur lors du chargement des produits :{' '}
                          {productsError instanceof Error
                            ? productsError.message
                            : 'Erreur inconnue'}
                        </p>
                      </div>
                    )}

                    {selectedProductId ? (
                      <div className="w-full">
                        <LotsManager physicalProductId={selectedProductId} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 sm:h-64 md:h-80 border-2 border-dashed rounded-lg border-border/50 bg-card/50 backdrop-blur-sm w-full">
                        <div className="text-center p-4 sm:p-6 max-w-md">
                          <Package className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto text-muted-foreground mb-3 sm:mb-4 animate-in zoom-in-95 duration-500" />
                          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                            Sélectionnez un produit pour gérer ses lots
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






