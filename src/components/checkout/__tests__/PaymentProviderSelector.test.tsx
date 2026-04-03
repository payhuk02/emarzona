/**
 * Tests unitaires pour PaymentProviderSelector
 * Composant critique pour la sélection du provider de paiement
 *
 * Couverture :
 * - Affichage des providers disponibles
 * - Sélection d'un provider
 * - Sauvegarde de la préférence utilisateur
 * - Gestion des providers désactivés
 * - Affichage du montant
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentProviderSelector } from '../PaymentProviderSelector';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
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
  },
}));

// Mock AuthContext
const mockUser = {
  id: '123',
  email: 'test@example.com',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
  })),
}));

describe('PaymentProviderSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment providers', () => {
    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} />);

    expect(screen.getByText('Moyen de paiement')).toBeInTheDocument();
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

  it('should display provider features', () => {
    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} />);

    expect(screen.getByText('Multi-devises')).toBeInTheDocument();
    expect(screen.getByText('Remboursements')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should display amount when provided', () => {
    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} amount={50000} />);

    expect(screen.getByText(/montant à payer/i)).toBeInTheDocument();
    expect(screen.getByText(/50,000/i)).toBeInTheDocument();
  });

  it('should show selected provider with checkmark', () => {
    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} />);

    const monerooCard = screen.getByText('Moneroo').closest('div');
    expect(monerooCard).toHaveClass('border-primary');
  });

  it('should load user preference on mount', async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { payment_provider_preference: 'moneroo' },
              error: null,
            })
          ),
        })),
      })),
    }));

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    render(<PaymentProviderSelector onChange={mockOnChange} />);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
  });

  it('should save user preference when provider changes', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    }));

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: mockUpdate,
    }));

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} />);

    const monerooOption = screen.getByLabelText(/moneroo/i);
    await user.click(monerooOption);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  it('should filter providers based on store settings', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { enabled_payment_providers: ['moneroo'] },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    render(<PaymentProviderSelector value="moneroo" onChange={mockOnChange} storeId="store-123" />);

    await waitFor(() => {
      // Si un seul provider est disponible, le selector ne s'affiche pas
      expect(screen.queryByText('Moyen de paiement')).not.toBeInTheDocument();
    });
  });

  it('should show alert when no providers are available', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { enabled_payment_providers: [] },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    render(<PaymentProviderSelector onChange={mockOnChange} storeId="store-123" />);

    await waitFor(() => {
      expect(screen.getByText(/aucun moyen de paiement disponible/i)).toBeInTheDocument();
    });
  });

  it('should auto-select when only one provider is available', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'stores') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { enabled_payment_providers: ['moneroo'] },
                  error: null,
                })
              ),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      };
    });

    vi.mocked(supabase.from).mockImplementation(mockFrom as unknown as typeof supabase.from);

    render(<PaymentProviderSelector onChange={mockOnChange} storeId="store-123" />);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('moneroo');
    });
  });
});






