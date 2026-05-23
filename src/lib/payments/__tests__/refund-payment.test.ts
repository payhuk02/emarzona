import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@/lib/moneroo-payment', () => ({
  refundMonerooPayment: vi.fn().mockResolvedValue({
    success: true,
    refund_id: 'moneroo_ref_1',
    amount: 100,
    currency: 'XOF',
  }),
}));

vi.mock('@/lib/moneroo-notifications', () => ({
  notifyPaymentRefunded: vi.fn().mockResolvedValue(undefined),
}));

import { supabase } from '@/integrations/supabase/client';
import { refundPayment } from '../refund-payment';

describe('refundPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('route vers paypal-refund pour paypal_commerce', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'tx-1', payment_provider: 'paypal_commerce' },
            error: null,
          }),
        }),
      }),
    } as never);

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, refund_id: 'pp_ref_1', amount: 50, currency: 'EUR' },
      error: null,
    });

    const result = await refundPayment({ transactionId: 'tx-1', reason: 'test' });

    expect(result.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('paypal-refund', {
      body: { transactionId: 'tx-1', reason: 'test' },
    });
  });

  it('route vers stripe-refund pour stripe_connect', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'tx-2', payment_provider: 'stripe_connect' },
            error: null,
          }),
        }),
      }),
    } as never);

    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true, refund_id: 're_1', amount: 20, currency: 'EUR' },
      error: null,
    });

    const result = await refundPayment({ transactionId: 'tx-2' });

    expect(result.success).toBe(true);
    expect(supabase.functions.invoke).toHaveBeenCalledWith('stripe-refund', {
      body: { transactionId: 'tx-2' },
    });
  });
});
