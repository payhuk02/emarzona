/**
 * Smoke tests adapter Paiement Pro
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/paiement-pro-payment', () => ({
  initiatePaiementProPayment: vi.fn(async () => ({
    success: true,
    transaction_id: 'tx-pp-1',
    reference_number: 'EMZ-REF',
    checkout_url: 'https://www.paiementpro.net/checkout/demo',
  })),
}));

import { createPaiementProPayment } from '../adapters/paiement-pro-adapter';
import { initiatePaiementProPayment } from '@/lib/paiement-pro-payment';

describe('createPaiementProPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps checkout result to orchestrator shape', async () => {
    const result = await createPaiementProPayment({
      storeId: 'store-1',
      amount: 5000,
      currency: 'XOF',
      description: 'Test',
      customerEmail: 'buyer@example.com',
      customerPhone: '+2250700000000',
    });

    expect(initiatePaiementProPayment).toHaveBeenCalled();
    expect(result).toMatchObject({
      success: true,
      provider: 'paiement_pro',
      checkout_url: 'https://www.paiementpro.net/checkout/demo',
      transaction_id: 'tx-pp-1',
      provider_transaction_id: 'EMZ-REF',
    });
  });
});
