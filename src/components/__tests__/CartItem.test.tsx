/**
 * Tests pour CartItem
 * Composant d'item du panier
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CartItem } from '../cart/CartItem';
import type { CartItem as CartItemType } from '@/types/cart';

// ============================================================
// MOCKS
// ============================================================

vi.mock('@/components/ui/lazy-image', () => ({
  LazyImage: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="lazy-image" />
  ),
}));

vi.mock('@/components/icons', () => ({
  Trash2: () => <span data-testid="trash-icon">Trash</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Minus: () => <span data-testid="minus-icon">Minus</span>,
}));

// ============================================================
// TESTS
// ============================================================

describe('CartItem', () => {
  const mockCartItem: CartItemType = {
    id: 'cart-item-1',
    product_id: 'product-1',
    product_name: 'Test Product',
    product_image_url: 'https://example.com/image.jpg',
    quantity: 2,
    unit_price: 29.99,
    currency: 'EUR',
    discount_amount: 0,
  };

  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render cart item correctly', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByText(/59.98/)).toBeInTheDocument(); // 29.99 * 2
  });

  it('should display product image', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const image = screen.getByTestId('lazy-image');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(image).toHaveAttribute('alt', 'Test Product');
  });

  it('should call onUpdateQuantity when quantity is changed', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '3' } });

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('cart-item-1', 3);
  });

  it('should call onUpdateQuantity when plus button is clicked', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const plusButton = screen.getByRole('button', { name: /augmenter/i });
    fireEvent.click(plusButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('cart-item-1', 3);
  });

  it('should call onUpdateQuantity when minus button is clicked', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const minusButton = screen.getByRole('button', { name: /diminuer/i });
    fireEvent.click(minusButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('cart-item-1', 1);
  });

  it('should call onRemove when quantity is set to 0', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const minusButton = screen.getByRole('button', { name: /diminuer/i });
    fireEvent.click(minusButton); // Quantity becomes 1
    fireEvent.click(minusButton); // Quantity becomes 0, should remove

    expect(mockOnRemove).toHaveBeenCalledWith('cart-item-1');
  });

  it('should call onRemove when delete button is clicked', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /supprimer|remove/i });
    fireEvent.click(deleteButton);

    expect(mockOnRemove).toHaveBeenCalledWith('cart-item-1');
  });

  it('should display discount when discount_amount is present', () => {
    const itemWithDiscount: CartItemType = {
      ...mockCartItem,
      discount_amount: 5.00,
    };

    render(
      <CartItem
        item={itemWithDiscount}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    // Should show original price crossed out
    expect(screen.getByText(/59.98/)).toBeInTheDocument(); // Original: 29.99 * 2
    // Should show discounted price
    expect(screen.getByText(/49.98/)).toBeInTheDocument(); // (29.99 - 5) * 2
  });

  it('should display variant name when present', () => {
    const itemWithVariant: CartItemType = {
      ...mockCartItem,
      variant_name: 'Large',
    };

    render(
      <CartItem
        item={itemWithVariant}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText(/variant: large/i)).toBeInTheDocument();
  });

  it('should disable buttons when isLoading is true', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        isLoading={true}
      />
    );

    const plusButton = screen.getByRole('button', { name: /augmenter/i });
    const minusButton = screen.getByRole('button', { name: /diminuer/i });
    const quantityInput = screen.getByDisplayValue('2');

    expect(plusButton).toBeDisabled();
    expect(minusButton).toBeDisabled();
    expect(quantityInput).toBeDisabled();
  });

  it('should calculate total correctly with discount', () => {
    const itemWithDiscount: CartItemType = {
      ...mockCartItem,
      quantity: 3,
      discount_amount: 5.00,
    };

    render(
      <CartItem
        item={itemWithDiscount}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    // Total should be (29.99 - 5) * 3 = 74.97
    expect(screen.getByText(/74.97/)).toBeInTheDocument();
  });

  it('should have proper ARIA labels', () => {
    render(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const quantityGroup = screen.getByRole('group', { name: /quantité pour test product/i });
    expect(quantityGroup).toBeInTheDocument();

    const plusButton = screen.getByRole('button', { name: /augmenter la quantité de test product/i });
    expect(plusButton).toBeInTheDocument();
  });
});
