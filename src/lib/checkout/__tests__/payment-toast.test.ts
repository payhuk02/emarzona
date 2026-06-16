import { describe, it, expect, vi } from 'vitest';
import { showCheckoutBlockedToast, showPaymentErrorToast } from '@/lib/checkout/payment-toast';

describe('payment-toast', () => {
  it('shows a persistent destructive payment error toast', () => {
    const toast = vi.fn();

    showPaymentErrorToast(toast as never, 'Une erreur est survenue');

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Erreur de paiement',
        description: 'Une erreur est survenue',
        variant: 'destructive',
        duration: Infinity,
      })
    );
  });

  it('allows overriding title', () => {
    const toast = vi.fn();

    showPaymentErrorToast(toast as never, 'Carte refusée', 'Paiement refusé');

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Paiement refusé',
        description: 'Carte refusée',
      })
    );
  });

  it('shows a persistent checkout blocked toast', () => {
    const toast = vi.fn();

    showCheckoutBlockedToast(toast as never, 'Aucun moyen de paiement disponible');

    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Paiement impossible',
        description: 'Aucun moyen de paiement disponible',
        variant: 'destructive',
        duration: Infinity,
      })
    );
  });
});
