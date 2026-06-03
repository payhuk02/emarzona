import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCheckoutTaxes } from '@/lib/checkout/taxes';

const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('calculateCheckoutTaxes', () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it('returns zero tax when RPC fails (no 18% fallback)', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'rpc missing' } });

    const result = await calculateCheckoutTaxes({
      subtotal: 10000,
      shippingAmount: 500,
      countryCode: 'BF',
      items: [],
    });

    expect(result.tax_amount).toBe(0);
    expect(result.total_with_tax).toBe(10500);
  });

  it('uses RPC breakdown when available', async () => {
    rpcMock.mockResolvedValue({
      data: {
        tax_amount: 1800,
        tax_breakdown: [{ type: 'vat', name: 'TVA', rate: 18, amount: 1800 }],
        subtotal: 10000,
        shipping_amount: 500,
        total_with_tax: 12300,
      },
      error: null,
    });

    const result = await calculateCheckoutTaxes({
      subtotal: 10000,
      shippingAmount: 500,
      countryCode: 'BF',
      storeId: 'store-1',
      items: [{ product_type: 'physical' } as never],
    });

    expect(result.tax_amount).toBe(1800);
    expect(result.total_with_tax).toBe(12300);
    expect(rpcMock).toHaveBeenCalledWith(
      'calculate_taxes_pre_order',
      expect.objectContaining({ p_subtotal: 10000, p_country_code: 'BF' })
    );
  });
});
