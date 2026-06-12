/**
 * Epic 3.6.5 — Toasts paiement persistants jusqu'à action utilisateur
 */

import type { useToast } from '@/hooks/use-toast';

type ToastFn = ReturnType<typeof useToast>['toast'];

export function showPaymentErrorToast(
  toast: ToastFn,
  description: string,
  title = 'Erreur de paiement'
) {
  return toast({
    title,
    description,
    variant: 'destructive',
    duration: Infinity,
  });
}

export function showCheckoutBlockedToast(toast: ToastFn, description: string) {
  return toast({
    title: 'Paiement impossible',
    description,
    variant: 'destructive',
    duration: Infinity,
  });
}
