import { useStore } from '@/hooks/useStore';
import { ProductCreationRouter } from '@/components/products/ProductCreationRouter';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';

const CreateProduct = () => {
  const { store, loading } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { type: routeType } = useParams<{ type?: string }>();
  // Priorité à l'URL explicite /dashboard/products/new/:type, fallback sur ?type=
  const productType = routeType || searchParams.get('type') || undefined;

  if (loading) {
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
            Veuillez d'abord créer une boutique pour ajouter des produits
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <ProductCreationRouter
            storeId={store.id}
            storeSlug={store.slug}
            initialProductType={productType}
            onSuccess={() => {
              // Rediriger vers la page appropriée selon le type de produit
              if (productType === 'digital') {
                navigate('/dashboard/digital-products');
              } else {
                // Pour les produits physiques et services, rediriger vers la liste générale
                navigate('/dashboard/products');
              }
            }}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CreateProduct;
