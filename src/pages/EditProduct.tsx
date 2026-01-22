import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import type React from 'react';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types/marketplace';

// Lazy load all edit wizards
const EditPhysicalProductWizard = lazy(() =>
  import('@/components/products/edit/EditPhysicalProductWizard').then(m => ({
    default: m.EditPhysicalProductWizard,
  }))
);

const EditDigitalProductWizard = lazy(() =>
  import('@/components/products/edit/EditDigitalProductWizard').then(m => ({
    default: m.EditDigitalProductWizard,
  }))
);

const EditServiceProductWizard = lazy(() =>
  import('@/components/products/edit/EditServiceProductWizard').then(m => ({
    default: m.EditServiceProductWizard,
  }))
);

const EditCourseProductWizard = lazy(() =>
  import('@/components/products/edit/EditCourseProductWizard').then(m => ({
    default: m.EditCourseProductWizard,
  }))
);

const EditArtistProductWizard = lazy(() =>
  import('@/components/products/edit/EditArtistProductWizard').then(m => ({
    default: m.EditArtistProductWizard,
  }))
);

const EditGenericProductWizard = lazy(() =>
  import('@/components/products/edit/EditGenericProductWizard').then(m => ({
    default: m.EditGenericProductWizard,
  }))
);

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ SÉCURITÉ: Fonction de validation de propriété du produit
  const validateProductOwnership = async (productId: string, userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          store_id,
          stores!inner(user_id)
        `)
        .eq('id', productId)
        .eq('stores.user_id', userId)
        .single();

      if (error) {
        logger.error('❌ [EditProduct] Erreur validation propriété:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('❌ [EditProduct] Erreur validation propriété:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !user) return;

      try {
        // ✅ SÉCURITÉ: Vérifier que l'utilisateur possède ce produit
        const hasOwnership = await validateProductOwnership(id, user.id);
        if (!hasOwnership) {
          toast({
            title: 'Accès refusé',
            description: 'Vous n\'avez pas les permissions pour modifier ce produit.',
            variant: 'destructive',
          });
          navigate('/dashboard/products');
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch ( _error: unknown) {
        const errorMessage = _error instanceof Error ? _error.message : String(_error);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
        navigate('/dashboard/products');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && !storeLoading && user) {
      fetchProduct();
    }
  }, [id, storeLoading, authLoading, user, navigate, toast]);

  if (authLoading || loading || storeLoading) {
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

  if (!product || !id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {!product ? 'Produit non trouvé' : 'ID de produit manquant'}
          </h2>
        </div>
      </div>
    );
  }

  // Route to appropriate edit wizard based on product type
  // Use the same wizards as Products.tsx for consistency

  const handleSuccess = () => {
    navigate('/dashboard/products');
  };

  const handleBack = () => {
    navigate('/dashboard/products');
  };

  const wizardProps = {
    productId: id,
    storeId: store.id,
    storeSlug: store.slug,
    onSuccess: handleSuccess,
    onBack: handleBack,
  };

  const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      {children}
    </Suspense>
  );

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Authentification requise</h2>
          <p className="text-muted-foreground mb-4">
            Vous devez être connecté pour modifier un produit.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          {product.product_type === 'physical' && (
            <SuspenseWrapper>
              <EditPhysicalProductWizard {...wizardProps} />
            </SuspenseWrapper>
          )}
          {product.product_type === 'digital' && (
            <SuspenseWrapper>
              <EditDigitalProductWizard {...wizardProps} />
            </SuspenseWrapper>
          )}
          {product.product_type === 'service' && (
            <SuspenseWrapper>
              <EditServiceProductWizard {...wizardProps} />
            </SuspenseWrapper>
          )}
          {product.product_type === 'course' && (
            <SuspenseWrapper>
              <EditCourseProductWizard {...wizardProps} />
            </SuspenseWrapper>
          )}
          {product.product_type === 'artist' && (
            <SuspenseWrapper>
              <EditArtistProductWizard {...wizardProps} />
            </SuspenseWrapper>
          )}
          {!['physical', 'digital', 'service', 'course', 'artist'].includes(
            product.product_type || ''
          ) && (
            <SuspenseWrapper>
              <EditGenericProductWizard {...wizardProps} />
            </SuspenseWrapper>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default EditProduct;






