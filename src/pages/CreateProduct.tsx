import { useStore } from '@/hooks/useStore';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { ProductCreationRouter } from '@/components/products/ProductCreationRouter';
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
    <AppPageShell mainClassName="overflow-x-hidden">
      <ProductCreationRouter
        storeId={store.id}
        storeSlug={store.slug}
        initialProductType={productType}
        onSuccess={() => {
          if (productType === 'digital') {
            navigate('/dashboard/digital-products');
          } else if (productType === 'artist') {
            navigate('/dashboard/artist-products');
          } else if (productType === 'course') {
            navigate('/dashboard/courses');
          } else if (productType === 'service') {
            navigate('/dashboard/services');
          } else if (productType === 'physical') {
            navigate('/dashboard/physical-products');
          } else {
            navigate('/dashboard/products');
          }
        }}
      />
    </AppPageShell>
  );
};

export default CreateProduct;
