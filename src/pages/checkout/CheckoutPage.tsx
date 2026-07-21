/**
 * Checkout canonique mono-produit : `/checkout?productId=…&storeId=…`
 */
import { lazy, Suspense, useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveCheckoutMode } from '@/lib/checkout/checkout-route';

const BuyNowCheckout = lazy(() => import('@/pages/checkout/Checkout'));

function CheckoutLoading() {
  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const mode = useMemo(() => resolveCheckoutMode(searchParams), [searchParams]);

  if (mode === 'invalid') {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <Suspense fallback={<CheckoutLoading />}>
      <BuyNowCheckout />
    </Suspense>
  );
}
