import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CouponInput } from '../CouponInput';
import { useValidateUnifiedPromotion } from '@/hooks/physical/usePromotions';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/hooks/physical/usePromotions');
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

const mockToast = vi.fn();
(useToast as any).mockReturnValue({ toast: mockToast });

const mockValidation = {
  valid: false,
  message: '',
  error: '',
  promotion_id: null,
  discount_amount: null,
  code: null,
};

(useValidateUnifiedPromotion as any).mockReturnValue({
  data: mockValidation,
  isLoading: false,
});

describe('CouponInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useValidateUnifiedPromotion as any).mockReturnValue({
      data: mockValidation,
      isLoading: false,
    });
  });

  it('should render coupon input', () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    expect(screen.getByLabelText(/code promo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /appliquer/i })).toBeInTheDocument();
  });

  it('should show applied coupon when coupon is already applied', () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
        appliedCouponId="promo-1"
        appliedCouponCode="SAVE10"
        appliedDiscountAmount={1000}
      />
    );
    
    expect(screen.getByText(/code promo: save10/i)).toBeInTheDocument();
    expect(screen.getByText(/réduction de.*1000/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retirer/i })).toBeInTheDocument();
  });

  it('should validate and apply coupon', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    (useValidateUnifiedPromotion as any).mockReturnValue({
      data: {
        valid: true,
        promotion_id: 'promo-1',
        discount_amount: 2000,
        code: 'SAVE20',
      },
      isLoading: false,
    });
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    const input = screen.getByLabelText(/code promo/i);
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    
    fireEvent.change(input, { target: { value: 'SAVE20' } });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('promo-1', 2000, 'SAVE20');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '✅ Code appliqué',
        })
      );
    });
  });

  it('should show error for invalid coupon', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    (useValidateUnifiedPromotion as any).mockReturnValue({
      data: {
        valid: false,
        message: 'Code invalide',
      },
      isLoading: false,
    });
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    const input = screen.getByLabelText(/code promo/i);
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    
    fireEvent.change(input, { target: { value: 'INVALID' } });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Code invalide',
          variant: 'destructive',
        })
      );
      expect(onApply).not.toHaveBeenCalled();
    });
  });

  it('should show error when code is empty', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Code requis',
          variant: 'destructive',
        })
      );
      expect(onApply).not.toHaveBeenCalled();
    });
  });

  it('should remove applied coupon', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
        appliedCouponId="promo-1"
        appliedCouponCode="SAVE10"
        appliedDiscountAmount={1000}
      />
    );
    
    const removeButton = screen.getByRole('button', { name: /retirer/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Code retiré',
        })
      );
    });
  });

  it('should show loading state during validation', () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    (useValidateUnifiedPromotion as any).mockReturnValue({
      data: null,
      isLoading: true,
    });
    
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    // Le bouton devrait être désactivé pendant le chargement
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    expect(applyButton).toBeDisabled();
  });
});





