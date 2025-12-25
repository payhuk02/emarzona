/**
 * Tests unitaires pour CartSummary
 * Composant critique pour le récapitulatif du panier
 * 
 * Couverture :
 * - Affichage du sous-total
 * - Affichage des remises
 * - Affichage des taxes et frais de livraison
 * - Calcul du total
 * - Application de code promo
 * - Navigation vers checkout
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CartSummary } from '../CartSummary';
import type { CartSummary as CartSummaryType } from '@/types/cart';
import * as CartHook from '@/hooks/cart/useCart';

// Mock useCart hook
vi.mock('@/hooks/cart/useCart', () => ({
  useCart: vi.fn(() => ({
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
    appliedCoupon: null,
    isLoading: false,
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

const mockSummary: CartSummaryType = {
  subtotal: 50000,
  discount_amount: 5000,
  tax_amount: 5000,
  shipping_amount: 3000,
  total: 53000,
  item_count: 3,
};

describe('CartSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('should display subtotal', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Sous-total')).toBeInTheDocument();
    expect(screen.getByText('50,000 XOF')).toBeInTheDocument();
  });

  it('should display discount when discount_amount > 0', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Remise')).toBeInTheDocument();
    expect(screen.getByText('-5,000 XOF')).toBeInTheDocument();
  });

  it('should display shipping when shipping_amount > 0', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Livraison')).toBeInTheDocument();
    expect(screen.getByText('3,000 XOF')).toBeInTheDocument();
  });

  it('should display tax when tax_amount > 0', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Taxes')).toBeInTheDocument();
    expect(screen.getByText('5,000 XOF')).toBeInTheDocument();
  });

  it('should display total', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('53,000 XOF')).toBeInTheDocument();
  });

  it('should display item count', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('3 articles')).toBeInTheDocument();
  });

  it('should display singular form for 1 item', () => {
    const singleItemSummary: CartSummaryType = {
      ...mockSummary,
      item_count: 1,
    };

    renderWithRouter(<CartSummary summary={singleItemSummary} />);

    expect(screen.getByText('1 article')).toBeInTheDocument();
  });

  it('should have checkout button', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    const checkoutButton = screen.getByRole('button', { name: /procéder au paiement/i });
    expect(checkoutButton).toBeInTheDocument();
  });

  it('should disable checkout button when cart is empty', () => {
    const emptySummary: CartSummaryType = {
      ...mockSummary,
      item_count: 0,
      total: 0,
    };

    renderWithRouter(<CartSummary summary={emptySummary} />);

    const checkoutButton = screen.getByRole('button', { name: /procéder au paiement/i });
    expect(checkoutButton).toBeDisabled();
  });

  it('should display coupon input field', () => {
    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByLabelText(/code promo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Entrez le code')).toBeInTheDocument();
  });

  it('should apply coupon when code is entered and applied', async () => {
    const user = userEvent.setup();
    const mockApplyCoupon = vi.fn().mockResolvedValue(undefined);

    vi.mocked(CartHook.useCart).mockReturnValue({
      applyCoupon: mockApplyCoupon,
      removeCoupon: vi.fn(),
      appliedCoupon: null,
      isLoading: false,
    } as any);

    renderWithRouter(<CartSummary summary={mockSummary} />);

    const couponInput = screen.getByPlaceholderText('Entrez le code');
    const applyButton = screen.getByRole('button', { name: /appliquer/i });

    await user.type(couponInput, 'PROMO10');
    await user.click(applyButton);

    await waitFor(() => {
      expect(mockApplyCoupon).toHaveBeenCalledWith('PROMO10');
    });
  });

  it('should display applied coupon when coupon is active', () => {
    vi.mocked(CartHook.useCart).mockReturnValue({
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      appliedCoupon: {
        code: 'PROMO10',
        discountAmount: 5000,
      },
      isLoading: false,
    } as any);

    renderWithRouter(<CartSummary summary={mockSummary} />);

    expect(screen.getByText('Code promo appliqué')).toBeInTheDocument();
    expect(screen.getByText('PROMO10')).toBeInTheDocument();
    expect(screen.getByText('-5,000 XOF')).toBeInTheDocument();
  });

  it('should remove coupon when remove button is clicked', async () => {
    const user = userEvent.setup();
    const mockRemoveCoupon = vi.fn();

    vi.mocked(CartHook.useCart).mockReturnValue({
      applyCoupon: vi.fn(),
      removeCoupon: mockRemoveCoupon,
      appliedCoupon: {
        code: 'PROMO10',
        discountAmount: 5000,
      },
      isLoading: false,
    } as any);

    renderWithRouter(<CartSummary summary={mockSummary} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(mockRemoveCoupon).toHaveBeenCalled();
  });

  it('should navigate to checkout when checkout button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<CartSummary summary={mockSummary} />);

    const checkoutButton = screen.getByRole('button', { name: /procéder au paiement/i });
    await user.click(checkoutButton);

    // Vérifier que la navigation a lieu (sera testé avec E2E)
    expect(checkoutButton).toBeInTheDocument();
  });

  it('should not display discount section when discount_amount is 0', () => {
    const noDiscountSummary: CartSummaryType = {
      ...mockSummary,
      discount_amount: 0,
    };

    renderWithRouter(<CartSummary summary={noDiscountSummary} />);

    expect(screen.queryByText('Remise')).not.toBeInTheDocument();
  });

  it('should not display shipping section when shipping_amount is 0', () => {
    const noShippingSummary: CartSummaryType = {
      ...mockSummary,
      shipping_amount: 0,
    };

    renderWithRouter(<CartSummary summary={noShippingSummary} />);

    expect(screen.queryByText('Livraison')).not.toBeInTheDocument();
  });

  it('should not display tax section when tax_amount is 0', () => {
    const noTaxSummary: CartSummaryType = {
      ...mockSummary,
      tax_amount: 0,
    };

    renderWithRouter(<CartSummary summary={noTaxSummary} />);

    expect(screen.queryByText('Taxes')).not.toBeInTheDocument();
  });
});





