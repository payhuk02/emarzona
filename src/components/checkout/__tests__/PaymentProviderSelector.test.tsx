/**
 * Tests unitaires pour PaymentProviderSelector (RPC dynamique)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProviderSelector } from '../PaymentProviderSelector';
import { supabase } from '@/integrations/supabase/client';

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
  });

  it('should render Moneroo when orchestration V2 is off', () => {
    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} />);
    expect(screen.getByText('Moneroo')).toBeInTheDocument();
  });

  it('should call onChange when provider is selected (moneroo)', async () => {
    const user = userEvent.setup();
    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} />);

    const monerooOption = screen.getByLabelText(/moneroo/i);
    await user.click(monerooOption);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
  });

  it('should display amount when provided', () => {
    render(
      <PaymentProviderSelector
        value="moneroo"
        onChange={mockOnChange}
        amount={50000}
        currency="XOF"
      />
    );
    expect(screen.getByText(/montant à payer/i)).toBeInTheDocument();
  });

  it('should show multiple providers when V2 enabled and storeId set', async () => {
    const { isPaymentOrchestrationV2Enabled } = await import('@/lib/payments/feature-flags');
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

  it('should auto-select when only one provider (V2 off)', async () => {
    render(<PaymentProviderSelector onChange={mockOnChange} storeId="store-123" />);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
  });
});
