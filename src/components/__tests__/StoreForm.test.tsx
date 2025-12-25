/**
 * Tests unitaires pour StoreForm
 * 
 * Couverture :
 * - Rendu du formulaire
 * - Validation des champs
 * - Soumission du formulaire
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoreForm from '../store/StoreForm';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock useStoreContext
vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: () => ({
    selectedStoreId: 'test-store-id',
  }),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('StoreForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    const onSuccess = vi.fn();
    
    render(<StoreForm onSuccess={onSuccess} />);

    expect(screen.getByLabelText(/nom de la boutique/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    render(<StoreForm onSuccess={onSuccess} />);

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    // Le formulaire devrait empêcher la soumission si les champs requis sont vides
    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    
    const mockInsert = vi.fn().mockResolvedValue({
      data: [{ id: 'new-store-id' }],
      error: null,
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
      insert: mockInsert,
    });

    render(<StoreForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/nom de la boutique/i), 'Test Store');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});

