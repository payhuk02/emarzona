/**
 * Tests unitaires pour PaymentProviderSelector (RPC dynamique)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProviderSelector } from '../PaymentProviderSelector';
import { isPaymentOrchestrationV2Enabled } from '@/lib/payments/feature-flags';

vi.mock('@/lib/payments/feature-flags', () => ({
  isPaymentOrchestrationV2Enabled: vi.fn(() => false),
}));

vi.mock('@/hooks/payments/useStorePaymentOptions', () => ({
  useStorePaymentOptions: vi.fn(() => ({
    data: [
      { provider: 'moneroo_platform', connection_id: null, label: 'Moneroo' },
      { provider: 'stripe_connect', connection_id: 'c1', label: 'Carte (Stripe)' },
    ],
    isLoading: false,
    isError: false,
  })),
  rpcProviderToCheckout: (p: string) => (p === 'moneroo_platform' ? 'moneroo' : p),
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
    vi.mocked(isPaymentOrchestrationV2Enabled).mockReturnValue(false);
  });

  it('auto-selects moneroo when V2 off and single provider (no visible card)', async () => {
    render(<PaymentProviderSelector onChange={mockOnChange} />);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
    expect(screen.queryByText('Moyen de paiement')).not.toBeInTheDocument();
  });

  it('calls onChange when user selects moneroo with multiple providers', async () => {
    vi.mocked(isPaymentOrchestrationV2Enabled).mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <PaymentProviderSelector
        value="stripe_connect"
        onChange={mockOnChange}
        storeId="store-123"
        currency="EUR"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Moneroo')).toBeInTheDocument();
    });

    const monerooOption = screen.getByLabelText(/moneroo/i);
    await user.click(monerooOption);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
  });

  it('displays amount when multiple providers and value selected', async () => {
    vi.mocked(isPaymentOrchestrationV2Enabled).mockReturnValue(true);

    render(
      <PaymentProviderSelector
        value="moneroo"
        onChange={mockOnChange}
        storeId="store-123"
        amount={50000}
        currency="XOF"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/montant à payer/i)).toBeInTheDocument();
    });
  });

  it('shows multiple providers when V2 enabled and storeId set', async () => {
    vi.mocked(isPaymentOrchestrationV2Enabled).mockReturnValue(true);

    render(
      <PaymentProviderSelector
        value="moneroo"
        onChange={mockOnChange}
        storeId="store-123"
        currency="EUR"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Carte (Stripe)')).toBeInTheDocument();
      expect(screen.getByText('Moneroo')).toBeInTheDocument();
    });
  });

  it('auto-selects when only one provider and no value', async () => {
    render(<PaymentProviderSelector onChange={mockOnChange} />);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
  });
});
