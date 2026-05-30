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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import StoreForm from '../store/StoreForm';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: () => ({
    selectedStoreId: 'test-store-id',
    refreshStores: vi.fn(),
  }),
}));

vi.mock('../store/RequireTermsConsent', () => ({
  RequireTermsConsent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('../store/StoreSuggestions', () => ({
  StoreSuggestions: () => null,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('StoreForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    const onSuccess = vi.fn();

    render(<StoreForm onSuccess={onSuccess} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/nom de la boutique/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(<StoreForm onSuccess={onSuccess} />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    const mockInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as Awaited<ReturnType<typeof supabase.auth.getUser>>);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: true,
      error: null,
    } as Awaited<ReturnType<typeof supabase.rpc>>);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
          insert: mockInsert,
        } as ReturnType<typeof supabase.from>;
      }

      return {} as ReturnType<typeof supabase.from>;
    });

    render(<StoreForm onSuccess={onSuccess} />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/nom de la boutique/i), 'Test Store');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalled();
    });

    const submitButton = screen.getByRole('button', { name: /créer/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
