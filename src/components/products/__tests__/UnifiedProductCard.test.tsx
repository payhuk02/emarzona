/**
 * Tests unitaires pour UnifiedProductCard
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedProductCard } from '../UnifiedProductCard';
import type { UnifiedProductCardProps } from '@/types/unified-product';

// Mock des dépendances
vi.mock('@/components/ui/OptimizedImage', () => ({
  OptimizedImage: ({ alt, src }: { alt: string; src: string }) => (
    <img src={src} alt={alt} data-testid="product-image" />
  ),
}));

vi.mock('@/components/marketplace/PriceStockAlertButton', () => ({
  PriceStockAlertButton: () => <button data-testid="price-alert-button">Alert</button>,
}));

const mockProduct = {
  id: 'test-product-1',
  name: 'Test Product',
  slug: 'test-product',
  type: 'digital' as const,
  price: 5000,
  currency: 'XOF',
  image_url: 'https://example.com/image.jpg',
  rating: 4.5,
  review_count: 10,
  store: {
    id: 'store-1',
    name: 'Test Store',
    slug: 'test-store',
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const renderComponent = (props: Partial<UnifiedProductCardProps> = {}) => {
  return render(
    <BrowserRouter>
      <UnifiedProductCard
        product={mockProduct as any}
        variant="marketplace"
        {...props}
      />
    </BrowserRouter>
  );
};

describe('UnifiedProductCard', () => {
  it('devrait rendre le nom du produit', () => {
    renderComponent();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('devrait avoir un role="article"', () => {
    renderComponent();
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();
  });

  it('devrait avoir aria-labelledby avec le titre', () => {
    renderComponent();
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-labelledby', 'product-title-test-product-1');
  });

  it('devrait avoir aria-describedby avec le prix', () => {
    renderComponent();
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-describedby', 'product-price-test-product-1');
  });

  it('devrait avoir un bouton "Voir" avec aria-label', () => {
    renderComponent();
    const viewButton = screen.getByLabelText(/Voir les détails de Test Product/i);
    expect(viewButton).toBeInTheDocument();
  });

  it('devrait avoir un bouton "Acheter" avec aria-label', () => {
    renderComponent();
    const buyButton = screen.getByLabelText(/Acheter Test Product pour/i);
    expect(buyButton).toBeInTheDocument();
  });

  it('devrait afficher le prix correctement', () => {
    renderComponent();
    expect(screen.getByText(/5\s*000/i)).toBeInTheDocument();
  });

  it('devrait afficher le nom de la boutique', () => {
    renderComponent();
    expect(screen.getByText('Test Store')).toBeInTheDocument();
  });

  it('devrait avoir un attribut tabIndex sur la carte', () => {
    renderComponent();
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('tabIndex', '0');
  });
});

