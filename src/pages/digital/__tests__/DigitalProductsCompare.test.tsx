/**
 * Tests pour DigitalProductsCompare
 * Date: 4 Janvier 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { DigitalProductsCompare } from '../DigitalProductsCompare';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import * as supabaseClient from '@/integrations/supabase/client';
import * as useToastHook from '@/hooks/use-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              then: vi.fn(() => ({
                data: [
                  {
                    id: 'prod1',
                    name: 'Produit Digital 1',
                    description: 'Description produit 1',
                    price: 10000,
                    currency: 'XOF',
                    image_url: 'https://example.com/image1.jpg',
                    category: 'Software',
                    digital_products: [{
                      license_type: 'standard',
                      main_file_format: 'PDF',
                      total_size_mb: 10,
                      total_downloads: 100,
                    }],
                    average_rating: 4.5,
                    total_reviews: 20,
                    is_active: true,
                    created_at: '2025-01-01T00:00:00Z',
                  },
                  {
                    id: 'prod2',
                    name: 'Produit Digital 2',
                    description: 'Description produit 2',
                    price: 15000,
                    currency: 'XOF',
                    image_url: 'https://example.com/image2.jpg',
                    category: 'Template',
                    digital_products: [{
                      license_type: 'plr',
                      main_file_format: 'ZIP',
                      total_size_mb: 25,
                      total_downloads: 50,
                    }],
                    average_rating: 4.0,
                    total_reviews: 15,
                    is_active: true,
                    created_at: '2025-01-02T00:00:00Z',
                  },
                ],
                error: null,
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?ids=prod1,prod2')],
  };
});

const renderComponent = (route = '/digital/compare?ids=prod1,prod2') => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/digital/compare" element={<DigitalProductsCompare />} />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('DigitalProductsCompare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    localStorage.clear();
  });

  it('should render comparison page with products', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Comparaison de produits')).toBeInTheDocument();
      expect(screen.getByText('Produit Digital 1')).toBeInTheDocument();
      expect(screen.getByText('Produit Digital 2')).toBeInTheDocument();
    });
  });

  it('should display product details in comparison table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Produit Digital 1')).toBeInTheDocument();
      expect(screen.getByText('Produit Digital 2')).toBeInTheDocument();
      expect(screen.getByText(/10[,\s]?000\s*XOF/i)).toBeInTheDocument(); // Prix produit 1
      expect(screen.getByText(/15[,\s]?000\s*XOF/i)).toBeInTheDocument(); // Prix produit 2
    });
  });

  it('should allow removing a product from comparison', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Produit Digital 1')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove|retirer/i });
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Produit retiré',
        }));
      });
    }
  });

  it('should display empty state when no products to compare', () => {
    vi.mocked(supabaseClient.supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              then: vi.fn(() => ({ data: [], error: null })),
            })),
          })),
        })),
      })),
    } as any);

    renderComponent('/digital/compare');
    
    expect(screen.getByText(/aucun produit à comparer/i)).toBeInTheDocument();
  });

  it('should allow adding more products', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Comparaison de produits')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /ajouter un produit/i });
    if (addButton) {
      await user.click(addButton);
      expect(mockNavigate).toHaveBeenCalledWith('/digital/search');
    }
  });

  it('should clear all products when clear button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Produit Digital 1')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /vider/i });
    await user.click(clearButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Comparaison vidée',
      }));
    });
  });

  it('should display product properties in comparison table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Nom')).toBeInTheDocument();
      expect(screen.getByText('Prix')).toBeInTheDocument();
      expect(screen.getByText('Catégorie')).toBeInTheDocument();
      expect(screen.getByText('Type de licence')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
      expect(screen.getByText('Taille')).toBeInTheDocument();
      expect(screen.getByText('Note')).toBeInTheDocument();
      expect(screen.getByText('Avis')).toBeInTheDocument();
      expect(screen.getByText('Téléchargements')).toBeInTheDocument();
    });
  });

  it('should navigate to product detail when "Voir les détails" is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Produit Digital 1')).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByRole('button', { name: /voir les détails/i });
    if (detailButtons.length > 0) {
      await user.click(detailButtons[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/digital/prod1');
    }
  });

  it('should limit comparison to MAX_COMPARISON products', async () => {
    const user = userEvent.setup();
    // Mock avec plus de produits que la limite
    vi.mocked(supabaseClient.supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              then: vi.fn(() => ({
                data: Array.from({ length: 5 }, (_, i) => ({
                  id: `prod${i + 1}`,
                  name: `Produit ${i + 1}`,
                  price: 10000,
                  currency: 'XOF',
                  digital_products: [{}],
                })),
                error: null,
              })),
            })),
          })),
        })),
      })),
    } as any);

    renderComponent('/digital/compare?ids=prod1,prod2,prod3,prod4,prod5');
    
    await waitFor(() => {
      // Devrait limiter à 4 produits maximum
      expect(screen.queryByText('Produit 5')).not.toBeInTheDocument();
    });
  });
});







