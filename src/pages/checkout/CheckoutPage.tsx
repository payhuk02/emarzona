/**
 * Epic 3.6 — Checkout canonique : `/checkout` (panier, buy-now, enchère via query).
 */
import { lazy, Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveCheckoutMode } from '@/lib/checkout/checkout-route';

const CartCheckout = lazy(() => import('@/pages/Checkout'));
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
  const useBuyNow = mode === 'buy_now' || mode === 'auction';

  return (
    <Suspense fallback={<CheckoutLoading />}>
      {useBuyNow ? <BuyNowCheckout /> : <CartCheckout />}
    </Suspense>
  );
}
