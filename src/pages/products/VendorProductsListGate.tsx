/**
 * Route générique /dashboard/products → liste catalogue de la verticale active.
 */
import { Navigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import {
  getVendorProductListPath,
  resolveStoreCommerceTypeFromStore,
} from '@/lib/commerce/store-capability-map';
import Products from '@/pages/Products';
import { Skeleton } from '@/components/ui/skeleton';

const GENERIC_PRODUCTS_PATH = '/dashboard/products';

export default function VendorProductsListGate() {
  const { store, loading } = useStore();

  if (loading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (store) {
    const listPath = getVendorProductListPath(resolveStoreCommerceTypeFromStore(store));
    if (listPath !== GENERIC_PRODUCTS_PATH) {
      return <Navigate to={listPath} replace />;
    }
  }

  return <Products />;
}
