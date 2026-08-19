import { describe, expect, it, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();
const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), log: vi.fn() },
}));

describe('reconcileTransaction MoneyFusion', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    fromMock.mockReset();
  });

  it('calls moneyfusion reconcile_transaction when PSP is completed and DB is pending', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'transactions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'tx-1',
              payment_provider: 'moneyfusion',
              payment_id: 'mf-token-abc',
              status: 'processing',
              amount: 5000,
              currency: 'XOF',
              order_id: 'order-1',
            },
            error: null,
          }),
        };
      }
      if (table === 'transaction_logs') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    });

    invokeMock
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { statut: 'completed', Montant: 5000, currency: 'XOF' },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          sync: { success: true, status: 'completed', orderId: 'order-1' },
        },
        error: null,
      });

    const { reconcileTransaction } = await import('@/lib/geniuspay-reconciliation');
    const result = await reconcileTransaction('tx-1');

    expect(result.status).toBe('repaired');
    expect(invokeMock).toHaveBeenCalledTimes(2);
    expect(invokeMock.mock.calls[1][0]).toBe('moneyfusion');
    expect(invokeMock.mock.calls[1][1]).toMatchObject({
      body: {
        action: 'reconcile_transaction',
        data: expect.objectContaining({ transactionId: 'tx-1' }),
      },
    });
  });
});
