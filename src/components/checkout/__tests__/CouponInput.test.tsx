import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CouponInput } from '../CouponInput';
import { useValidateUnifiedPromotion } from '@/hooks/physical/usePromotions';
import { useToast } from '@/hooks/use-toast';

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
(useToast as ReturnType<typeof vi.fn>).mockReturnValue({ toast: mockToast });

const mockValidation = {
  valid: false,
  message: '',
  error: '',
  promotion_id: null,
  discount_amount: null,
  code: null,
};

const mockUseValidate = useValidateUnifiedPromotion as ReturnType<typeof vi.fn>;

mockUseValidate.mockReturnValue({
  data: mockValidation,
  isLoading: false,
});

const getCouponInput = () => screen.getByRole('textbox', { name: /code promo/i });
const getApplyButton = () => screen.getByRole('button', { name: /appliquer le code promo/i });

describe('CouponInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseValidate.mockReturnValue({
      data: mockValidation,
      isLoading: false,
    });
  });

  it('should render coupon input', () => {
    render(
      <CouponInput storeId="store-1" orderAmount={10000} onApply={vi.fn()} onRemove={vi.fn()} />
    );

    expect(getCouponInput()).toBeInTheDocument();
    expect(getApplyButton()).toBeInTheDocument();
  });

  it('should show applied coupon when coupon is already applied', () => {
    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={vi.fn()}
        onRemove={vi.fn()}
        appliedCouponId="promo-1"
        appliedCouponCode="SAVE10"
        appliedDiscountAmount={1000}
      />
    );

    expect(screen.getByText(/code promo: save10/i)).toBeInTheDocument();
    expect(screen.getByText(/réduction de.*1[\s\u202f]?000/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /retirer le code promo save10/i })
    ).toBeInTheDocument();
  });

  it('should validate and apply coupon', async () => {
    const onApply = vi.fn();

    mockUseValidate.mockReturnValue({
      data: {
        valid: true,
        promotion_id: 'promo-1',
        discount_amount: 2000,
        code: 'SAVE20',
      },
      isLoading: false,
    });

    render(
      <CouponInput storeId="store-1" orderAmount={10000} onApply={onApply} onRemove={vi.fn()} />
    );

    await userEvent.type(getCouponInput(), 'SAVE20');
    fireEvent.click(getApplyButton());

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
    mockUseValidate.mockReturnValue({
      data: {
        valid: false,
        message: 'Code invalide',
      },
      isLoading: false,
    });

    render(
      <CouponInput storeId="store-1" orderAmount={10000} onApply={vi.fn()} onRemove={vi.fn()} />
    );

    await userEvent.type(getCouponInput(), 'INVALID');

    expect(await screen.findByText('Code invalide')).toBeInTheDocument();
    expect(getApplyButton()).toBeDisabled();
  });

  it('should show error when code is empty', async () => {
    mockUseValidate.mockReturnValue({
      data: {
        valid: true,
        promotion_id: 'promo-1',
        discount_amount: 2000,
        code: 'SAVE20',
      },
      isLoading: false,
    });

    render(
      <CouponInput storeId="store-1" orderAmount={10000} onApply={vi.fn()} onRemove={vi.fn()} />
    );

    fireEvent.click(getApplyButton());

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Code requis',
          variant: 'destructive',
        })
      );
    });
  });

  it('should remove applied coupon', async () => {
    const onRemove = vi.fn();

    render(
      <CouponInput
        storeId="store-1"
        orderAmount={10000}
        onApply={vi.fn()}
        onRemove={onRemove}
        appliedCouponId="promo-1"
        appliedCouponCode="SAVE10"
        appliedDiscountAmount={1000}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /retirer le code promo save10/i }));

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
    mockUseValidate.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(
      <CouponInput storeId="store-1" orderAmount={10000} onApply={vi.fn()} onRemove={vi.fn()} />
    );

    expect(getApplyButton()).toBeDisabled();
  });
});
