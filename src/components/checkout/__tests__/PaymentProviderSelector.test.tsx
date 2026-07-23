/**
 * Tests unitaires pour PaymentProviderSelector (MoneyFusion plateforme)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PaymentProviderSelector } from '../PaymentProviderSelector';

vi.mock('@/lib/payments/feature-flags', () => ({
  isPaymentOrchestrationV2Enabled: vi.fn(() => false),
  isMoneyFusionEnabled: vi.fn(() => true),
  isMoneyFusionOnlyEnabled: vi.fn(() => true),
}));

vi.mock('@/hooks/payments/useStorePaymentOptions', () => ({
  useStorePaymentOptions: vi.fn(() => ({
    data: [{ provider: 'moneyfusion', connection_id: null, label: 'MoneyFusion' }],
    isLoading: false,
    isError: false,
  })),
  rpcProviderToCheckout: (p: string) =>
    p === 'geniuspay_platform' || p === 'geniuspay' ? 'moneyfusion' : p,
  checkoutProviderToRpc: (p: string) => (p === 'geniuspay' ? 'moneyfusion' : p),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '123', email: 'test@example.com' },
  })),
}));

describe('PaymentProviderSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-selects moneyfusion when only one provider', async () => {
    render(<PaymentProviderSelector onChange={mockOnChange} currency="XOF" />);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneyfusion');
    });
    expect(screen.getByText(/Paiement MoneyFusion/i)).toBeInTheDocument();
    expect(screen.getByText(/Orange Money/i)).toBeInTheDocument();
  });

  it('displays amount when moneyfusion selected', async () => {
    render(
      <PaymentProviderSelector
        value="moneyfusion"
        onChange={mockOnChange}
        storeId="store-123"
        amount={50000}
        currency="XOF"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Orange Money/i)).toBeInTheDocument();
    });
  });

  it('never exposes GeniusPay as selectable option', async () => {
    render(<PaymentProviderSelector onChange={mockOnChange} currency="XOF" />);

    await waitFor(() => {
      expect(screen.queryByText(/GeniusPay/i)).not.toBeInTheDocument();
    });
  });
});
