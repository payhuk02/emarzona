import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assessCheckoutFraudRisk } from '@/lib/checkout/fraud-assessment';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

describe('assessCheckoutFraudRisk', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('returns low risk when RPC errors', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'rpc error' } });

    const result = await assessCheckoutFraudRisk({ email: 'a@b.com', amount: 1000 });

    expect(result).toEqual({ score: 0, level: 'low', flags: [], block: false });
  });

  it('maps RPC payload into normalized assessment', async () => {
    rpcMock.mockResolvedValue({
      data: { score: 72, level: 'high', flags: ['ip_risk'], block: true },
      error: null,
    });

    const result = await assessCheckoutFraudRisk({
      email: 'a@b.com',
      amount: 1000,
      currency: 'eur',
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'assess_checkout_fraud_risk',
      expect.objectContaining({ p_currency: 'eur' })
    );
    expect(result).toEqual({ score: 72, level: 'high', flags: ['ip_risk'], block: true });
  });
});
