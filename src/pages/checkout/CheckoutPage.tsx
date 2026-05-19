/**
 * Routeur checkout : panier unifié ou achat direct (?productId=).
 */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

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
  const productId = searchParams.get('productId');

  return (
    <Suspense fallback={<CheckoutLoading />}>
      {productId ? <BuyNowCheckout /> : <CartCheckout />}
    </Suspense>
  );
}
