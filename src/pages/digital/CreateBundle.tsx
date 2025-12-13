/**
 * Page Création Bundle - Interface pour créer des bundles de produits digitaux
 * Date: 26 Janvier 2025
 */

import React, { useCallback, useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStore } from '@/hooks/useStore';
import { DigitalBundleManager } from '@/components/digital/DigitalBundleManager';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCreateBundle } from '@/hooks/digital/useDigitalBundles';
import type { DigitalBundle } from '@/components/digital/DigitalBundleManager';
import { generateSlug } from '@/lib/store-utils';
import { Package, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';

export default function CreateBundle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, isLoading: storeLoading } = useStore();
  const createBundle = useCreateBundle();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les produits digitaux de la boutique depuis la table products
  interface DigitalProductData {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    category?: string;
    image_url?: string;
    is_active?: boolean;
    is_draft?: boolean;
  }
  const [digitalProducts, setDigitalProducts] = React.useState<DigitalProductData[]>([]);
  // productsLoading doit rester true tant que storeLoading est true
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  // Flag pour indiquer que la vérification du store est terminée
  const [storeChecked, setStoreChecked] = React.useState(false);

  React.useEffect(() => {
    // Ne rien faire tant que le store est en cours de chargement
    if (storeLoading) {
      // Garder productsLoading à true et storeChecked à false pendant le chargement
      setProductsLoading(true);
      setStoreChecked(false);
      return;
    }

    // Le store est maintenant complètement chargé
    setStoreChecked(true);

    // Si le store n'existe pas après le chargement, arrêter le chargement des produits
    if (!store?.id) {
      setProductsLoading(false);
      return;
    }

    // Charger les produits uniquement si le store est chargé et existe
    const loadProducts = async () => {
      try {
        setError(null);
        setProductsLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, currency, image_url, category, is_active, is_draft')
          .eq('store_id', store.id)
          .eq('product_type', 'digital')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDigitalProducts(data || []);
        logger.info('Produits digitaux chargés pour bundle', {
          productsCount: data?.length || 0,
          storeId: store.id,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Erreur lors du chargement des produits');
        setError(err);
        logger.error(err, {
          error,
          storeId: store.id,
        });
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les produits digitaux. Veuillez réessayer.',
          variant: 'destructive',
        });
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [store?.id, storeLoading, toast]);

  // Convertir les produits au format attendu par DigitalBundleManager
  const availableProducts = (digitalProducts || []).map((product: DigitalProductData) => ({
    id: product.id,
    name: product.name || 'Produit sans nom',
    description: product.description,
    price: product.price || 0,
    currency: product.currency || 'XOF',
    category: product.category || 'Autre',
    thumbnail: product.image_url,
    isAvailable: product.is_active !== false && product.is_draft !== true,
  }));

  const handleSave = useCallback(async (bundle: DigitalBundle) => {
    if (!store?.id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non trouvée',
        variant: 'destructive',
      });
      logger.error('Boutique non trouvée lors de la création du bundle', {
        storeId: store?.id,
      });
      return;
    }

    try {
      const slug = generateSlug(bundle.name);
      
      await createBundle.mutateAsync({
        store_id: store.id,
        name: bundle.name,
        slug,
        description: bundle.description,
        short_description: bundle.description?.substring(0, 200),
        original_price: bundle.originalTotalPrice || 0,
        bundle_price: bundle.discountedPrice || 0,
        discount_type: bundle.discountType === 'percentage' ? 'percentage' : bundle.discountType === 'fixed' ? 'fixed' : 'custom',
        discount_value: bundle.discountValue || 0,
        product_ids: bundle.productIds || [],
      });

      logger.info('Bundle créé avec succès', {
        bundleName: bundle.name,
        storeId: store.id,
        productCount: bundle.productIds?.length || 0,
      });

      navigate(`/dashboard/digital-products/bundles`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Erreur lors de la création du bundle');
      logger.error(err, {
        error,
        bundleName: bundle.name,
        storeId: store.id,
      });
      // Error handled by hook
    }
  }, [store?.id, createBundle, navigate, toast]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Calculer l'état de chargement global
  // On est en chargement si le store est en cours de chargement OU si les produits sont en cours de chargement
  const isLoading = useMemo(() => {
    return storeLoading || productsLoading;
  }, [storeLoading, productsLoading]);

  // Vérifier si on doit afficher l'erreur
  // Seulement si le store a été vérifié (storeChecked), est complètement chargé (storeLoading = false) ET qu'il n'existe pas
  const shouldShowError = useMemo(() => {
    return storeChecked && !storeLoading && !store;
  }, [storeChecked, storeLoading, store]);

  // Afficher un skeleton pendant le chargement
  // Cela évite l'affichage prématuré de l'erreur
  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Afficher l'erreur seulement après que le chargement soit complètement terminé
  if (shouldShowError) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Vous devez créer une boutique avant de créer un bundle.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style Inventaire */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mt-1 sm:mt-0 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold flex flex-col sm:flex-row sm:items-center gap-2 mb-1 sm:mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                        Créer un Bundle de Produits Digitaux
                      </span>
                    </div>
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    Regroupez plusieurs produits et offrez-les à prix réduit
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert - Style Inventaire */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error ? error.message : 'Erreur lors du chargement des produits digitaux'}
                </AlertDescription>
              </Alert>
            )}

            {/* Bundle Manager */}
            <div ref={contentRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardHeader className="p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Configuration du Bundle</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                    Sélectionnez les produits à inclure et configurez la remise
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0">
                  {createBundle.isPending ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-2 sm:gap-3">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-600" />
                      <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                        Création du bundle...
                      </span>
                    </div>
                  ) : (
                    <div className="w-full overflow-x-auto">
                      <DigitalBundleManager
                        availableProducts={availableProducts}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        mode="create"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

