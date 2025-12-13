import { useParams } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { ProductForm } from '@/components/products/ProductForm';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/marketplace';

// Lazy load artist product wizard
const EditArtistProductWizard = lazy(() =>
  import('@/components/products/edit/EditArtistProductWizard').then(m => ({
    default: m.EditArtistProductWizard,
  }))
);

const EditProduct = () => {
  const { id } = useParams();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();

        if (error) throw error;
        setProduct(data);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (!storeLoading) {
      fetchProduct();
    }
  }, [id, storeLoading]);

  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Aucune boutique trouvée</h2>
          <p className="text-muted-foreground">
            Veuillez d'abord créer une boutique pour gérer des produits
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Produit non trouvé</h2>
        </div>
      </div>
    );
  }

  // Route to appropriate edit wizard based on product type
  if (product.product_type === 'artist' && id) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <EditArtistProductWizard
                productId={id}
                storeId={store.id}
                storeSlug={store.slug}
                onSuccess={() => window.history.back()}
              />
            </Suspense>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <ProductForm
            storeId={store.id}
            storeSlug={store.slug}
            productId={id}
            initialData={product}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EditProduct;
