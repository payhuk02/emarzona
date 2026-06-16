import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findCompletedTransactionForOrder } from '@/lib/payments/find-order-transaction';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));

describe('findCompletedTransactionForOrder', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns null when query errors', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'db error' },
                }),
              }),
            }),
          }),
        }),
      }),
    });

    const result = await findCompletedTransactionForOrder('order-1');
    expect(result).toBeNull();
  });

  it('normalizes numeric fields and currency', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'tx-1',
                    amount: '1234',
                    currency: null,
                    status: null,
                    payment_provider: 'stripe_connect',
                  },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }),
    });

    const result = await findCompletedTransactionForOrder('order-1');
    expect(result).toEqual({
      id: 'tx-1',
      amount: 1234,
      currency: 'XOF',
      status: 'completed',
      payment_provider: 'stripe_connect',
    });
  });
});
