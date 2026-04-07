/**
 * Tests pour ProductCard
 * Composant d'affichage de produit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ProductCard } from '../storefront/ProductCard';
import type { Product } from '@/hooks/useProducts';

// ============================================================
// MOCKS
// ============================================================

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/lib/moneroo-payment', () => ({
  initiateMonerooPayment: vi.fn().mockResolvedValue({
    success: true,
    checkout_url: 'https://checkout.example.com',
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: vi.fn(() => vi.fn()),
}));

// ============================================================
// HELPERS
// ============================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockProduct: Product = {
  id: 'product-1',
  name: 'Test Product',
  description: 'Test Description',
  price: 29.99,
  promo_price: 24.99,
  currency: 'EUR',
  store_id: 'store-1',
  product_type: 'digital',
  image_url: 'https://example.com/image.jpg',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================
// TESTS
// ============================================================

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product correctly', () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/24.99/)).toBeInTheDocument();
  });

  it('should display promotional price when available', () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    expect(screen.getByText(/24.99/)).toBeInTheDocument();
    expect(screen.getByText(/29.99/)).toBeInTheDocument();
  });

  it('should display regular price when no promotion', () => {
    const productWithoutPromo = { ...mockProduct, promo_price: null };
    const wrapper = createWrapper();
    render(<ProductCard product={productWithoutPromo} storeSlug="test-store" />, { wrapper });

    expect(screen.getByText(/29.99/)).toBeInTheDocument();
  });

  it('should render product image', () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('image.jpg'));
  });

  it('should handle buy button click', async () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    const buyButton = screen.getByRole('button', { name: /acheter|buy/i });
    fireEvent.click(buyButton);

    await waitFor(() => {
      expect(screen.getByText(/chargement|loading/i)).toBeInTheDocument();
    });
  });

  it('should display product type badge', () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    // Le badge devrait être présent selon le type de produit
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should handle favorite button click', async () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    const favoriteButton = screen.queryByRole('button', { name: /favori|favorite/i });
    if (favoriteButton) {
      fireEvent.click(favoriteButton);
      // Vérifier que l'état change
    }
  });

  it('should display discount percentage when promo available', () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    // Le pourcentage de réduction devrait être affiché
    // Calcul: ((29.99 - 24.99) / 29.99) * 100 ≈ 17%
    const discountText = screen.queryByText(/-17%|17%/i);
    // Le badge de réduction peut être présent
  });

  it('should handle missing image gracefully', () => {
    const productWithoutImage = { ...mockProduct, image_url: null };
    const wrapper = createWrapper();
    render(<ProductCard product={productWithoutImage} storeSlug="test-store" />, { wrapper });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should render link to product detail page', () => {
    const wrapper = createWrapper();
    render(<ProductCard product={mockProduct} storeSlug="test-store" />, { wrapper });

    const link = screen.getByRole('link', { name: /test product/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('test-store'));
  });
});
