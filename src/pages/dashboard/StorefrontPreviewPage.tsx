import { Navigate, useSearchParams } from 'react-router-dom';
import { buildStorePreviewUrl } from '@/lib/storefront/store-preview-draft';

/** Redirection legacy → route publique (session auth en sessionStorage par onglet). */
export default function StorefrontPreviewPage() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const slug = searchParams.get('slug');

  if (storeId && slug) {
    return <Navigate to={buildStorePreviewUrl(storeId, slug)} replace />;
  }

  if (storeId) {
    const params = new URLSearchParams({ storeId });
    return <Navigate to={`/store-preview?${params.toString()}`} replace />;
  }

  return <Navigate to="/dashboard/store" replace />;
}
