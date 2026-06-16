import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadStoreForcePlatformPayments,
  loadStorePaymentConnections,
} from '@/lib/payments/orchestrator/load-connections';

const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn() },
}));

describe('load-connections', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it('returns empty list when payment connections query errors', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }),
      }),
    });

    const result = await loadStorePaymentConnections('store-1');
    expect(result).toEqual([]);
  });

  it('returns payment connections from supabase', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [{ id: 'c1', store_id: 'store-1', provider: 'stripe_connect' }],
          error: null,
        }),
      }),
    });

    const result = await loadStorePaymentConnections('store-1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: 'c1', store_id: 'store-1' }));
  });

  it('returns false when store row is missing', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const result = await loadStoreForcePlatformPayments('store-1');
    expect(result).toBe(false);
  });

  it('returns store force_platform_payments flag', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { force_platform_payments: true },
            error: null,
          }),
        }),
      }),
    });

    const result = await loadStoreForcePlatformPayments('store-1');
    expect(result).toBe(true);
  });
});
