/**
 * Charge les taux de change après idle — hors chemin critique LCP/FCP.
 */
import { lazy, Suspense } from 'react';
import { useDeferredMount } from '@/hooks/useDeferredMount';

const CurrencyRatesInitializer = lazy(() =>
  import('@/components/currency/CurrencyRatesInitializer').then(m => ({
    default: m.CurrencyRatesInitializer,
  }))
);

const DEFER_MS = 2000;

export function DeferredCurrencyRatesInitializer() {
  const ready = useDeferredMount(true, DEFER_MS);
  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <CurrencyRatesInitializer />
    </Suspense>
  );
}
