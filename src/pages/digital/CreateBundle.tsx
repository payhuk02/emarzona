/**
 * Page Création Bundle - Interface pour créer des bundles de produits digitaux
 * Date: 26 Janvier 2025
 */

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/hooks/useStore';
import { DigitalBundleManager } from '@/components/digital/DigitalBundleManager';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCreateBundle } from '@/hooks/digital/useDigitalBundles';
import { generateSlug } from '@/lib/store-utils';
import { Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function CreateBundle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, isLoading: storeLoading } = useStore();
  const createBundle = useCreateBundle();

  // Récupérer les produits digitaux de la boutique depuis la table products
  const [digitalProducts, setDigitalProducts] = React.useState<any[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!store?.id) {
      setProductsLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, currency, image_url, category, is_active, is_draft')
          .eq('store_id', store.id)
          .eq('product_type', 'digital')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDigitalProducts(data || []);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [store?.id]);

  // Convertir les produits au format attendu par DigitalBundleManager
  const availableProducts = (digitalProducts || []).map((product: any) => ({
    id: product.id,
    name: product.name || 'Produit sans nom',
    description: product.description,
    price: product.price || 0,
    currency: product.currency || 'XOF',
    category: product.category || 'Autre',
    thumbnail: product.image_url,
    isAvailable: product.is_active !== false && product.is_draft !== true,
  }));

  const handleSave = async (bundle: any) => {
    if (!store?.id) {
      toast({
        title: 'Erreur',
        description: 'Boutique non trouvée',
        variant: 'destructive',
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

      navigate(`/dashboard/digital-products/bundles`);
    } catch (error: any) {
      // Error handled by hook
      console.error('Error creating bundle:', error);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (storeLoading || productsLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  Vous devez créer une boutique avant de créer un bundle.
                </p>
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="h-8 w-8" />
                Créer un Bundle de Produits Digitaux
              </h1>
              <p className="text-muted-foreground mt-1">
                Regroupez plusieurs produits et offrez-les à prix réduit
              </p>
            </div>

            {/* Bundle Manager */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration du Bundle</CardTitle>
                <CardDescription>
                  Sélectionnez les produits à inclure et configurez la remise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DigitalBundleManager
                  availableProducts={availableProducts}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  mode="create"
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

