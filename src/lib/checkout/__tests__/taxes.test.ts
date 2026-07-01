import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateCheckoutTaxes } from '@/lib/checkout/taxes';

const rpcMock = vi.fn();
const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('calculateCheckoutTaxes', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    invokeMock.mockReset();
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
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('uses RPC breakdown for UEMOA', async () => {
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
    expect(result.source).toBe('local_rpc');
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('prefers Stripe Tax for France', async () => {
    invokeMock.mockResolvedValue({
      data: {
        tax_amount: 2000,
        tax_breakdown: [{ type: 'vat', name: 'VAT', rate: 20, amount: 2000 }],
        subtotal: 10000,
        shipping_amount: 0,
        total_with_tax: 12000,
        source: 'stripe_tax',
      },
      error: null,
    });

    const result = await calculateCheckoutTaxes({
      subtotal: 10000,
      shippingAmount: 0,
      countryCode: 'FR',
      currency: 'EUR',
      postalCode: '75001',
      items: [
        {
          product_id: 'p1',
          product_type: 'physical',
          unit_price: 10000,
          quantity: 1,
          currency: 'EUR',
        } as never,
      ],
    });

    expect(result.tax_amount).toBe(2000);
    expect(result.source).toBe('stripe_tax');
    expect(invokeMock).toHaveBeenCalledWith(
      'stripe-tax-calculate',
      expect.objectContaining({
        body: expect.objectContaining({ country_code: 'FR', currency: 'eur' }),
      })
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('falls back to RPC when Stripe Tax edge fails', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'edge down' } });
    rpcMock.mockResolvedValue({
      data: {
        tax_amount: 0,
        tax_breakdown: [],
        subtotal: 100,
        shipping_amount: 0,
        total_with_tax: 100,
      },
      error: null,
    });

    const result = await calculateCheckoutTaxes({
      subtotal: 100,
      shippingAmount: 0,
      countryCode: 'US',
      currency: 'USD',
      items: [],
    });

    expect(result.source).toBe('local_rpc');
    expect(rpcMock).toHaveBeenCalled();
  });
});
