import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GiftCardInput from '../GiftCardInput';
import { useValidateGiftCard } from '@/hooks/giftCards/useGiftCards';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/hooks/giftCards/useGiftCards');
vi.mock('@/hooks/use-toast');
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { code: 'GIFT123' }, error: null })),
        })),
      })),
    })),
  },
}));

const mockToast = vi.fn();
(useToast as any).mockReturnValue({ toast: mockToast });

const mockValidateMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

(useValidateGiftCard as any).mockReturnValue(mockValidateMutation);

describe('GiftCardInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateMutation.mutateAsync.mockResolvedValue({
      is_valid: true,
      gift_card_id: 'gift-1',
      current_balance: 5000,
      message: 'Carte valide',
    });
  });

  it('should render gift card input', () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    expect(screen.getByLabelText(/code de carte cadeau/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /appliquer/i })).toBeInTheDocument();
  });

  it('should show applied gift card when card is already applied', () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
        appliedGiftCardId="gift-1"
        appliedGiftCardCode="GIFT123"
        appliedGiftCardBalance={5000}
      />
    );
    
    expect(screen.getByText(/carte cadeau appliquée/i)).toBeInTheDocument();
    expect(screen.getByText(/gift123/i)).toBeInTheDocument();
    expect(screen.getByText(/solde disponible/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retirer/i })).toBeInTheDocument();
  });

  it('should validate and apply gift card', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    const input = screen.getByLabelText(/code de carte cadeau/i);
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    
    fireEvent.change(input, { target: { value: 'GIFT123' } });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(mockValidateMutation.mutateAsync).toHaveBeenCalledWith({
        storeId: 'store-1',
        code: 'GIFT123',
      });
    });
    
    await waitFor(() => {
      expect(onApply).toHaveBeenCalledWith('gift-1', 5000, 'GIFT123');
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Carte cadeau appliquée',
        })
      );
    });
  });

  it('should show error for invalid gift card', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    mockValidateMutation.mutateAsync.mockResolvedValue({
      is_valid: false,
      message: 'Carte cadeau invalide ou expirée',
    });
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    const input = screen.getByLabelText(/code de carte cadeau/i);
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    
    fireEvent.change(input, { target: { value: 'INVALID' } });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Carte cadeau invalide',
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
      <GiftCardInput
        storeId="store-1"
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

  it('should remove applied gift card', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
        appliedGiftCardId="gift-1"
        appliedGiftCardCode="GIFT123"
        appliedGiftCardBalance={5000}
      />
    );
    
    const removeButton = screen.getByRole('button', { name: /retirer/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(onRemove).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Carte cadeau retirée',
        })
      );
    });
  });

  it('should handle validation errors gracefully', async () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    mockValidateMutation.mutateAsync.mockRejectedValue(new Error('Network error'));
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    const input = screen.getByLabelText(/code de carte cadeau/i);
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    
    fireEvent.change(input, { target: { value: 'GIFT123' } });
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur',
          variant: 'destructive',
        })
      );
      expect(onApply).not.toHaveBeenCalled();
    });
  });

  it('should show loading state during validation', () => {
    const onApply = vi.fn();
    const onRemove = vi.fn();
    
    mockValidateMutation.isPending = true;
    
    render(
      <GiftCardInput
        storeId="store-1"
        onApply={onApply}
        onRemove={onRemove}
      />
    );
    
    // Le bouton devrait être désactivé pendant le chargement
    const applyButton = screen.getByRole('button', { name: /appliquer/i });
    expect(applyButton).toBeDisabled();
  });
});





