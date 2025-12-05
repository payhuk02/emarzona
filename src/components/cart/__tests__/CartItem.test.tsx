/**
 * Tests unitaires pour CartItem
 * Composant critique pour la gestion du panier
 * 
 * Couverture :
 * - Affichage des informations produit
 * - Modification de la quantité
 * - Suppression d'article
 * - Calcul du prix total
 * - Gestion des remises
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartItem } from '../CartItem';
import type { CartItem as CartItemType } from '@/types/cart';

const mockItem: CartItemType = {
  id: '1',
  product_id: 'prod-1',
  product_name: 'Produit Test',
  product_image_url: 'https://example.com/image.jpg',
  unit_price: 10000,
  quantity: 2,
  currency: 'XOF',
  product_type: 'physical',
  store_id: 'store-1',
  variant_name: 'Variant A',
  discount_amount: 0,
};

describe('CartItem', () => {
  const mockOnUpdateQuantity = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product information', () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText('Produit Test')).toBeInTheDocument();
    expect(screen.getByText('Variant: Variant A')).toBeInTheDocument();
    expect(screen.getByText('20,000 XOF')).toBeInTheDocument();
  });

  it('should display product image', () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const image = screen.getByAltText('Produit Test');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should display current quantity', () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const quantityInput = screen.getByRole('spinbutton', { name: /quantité de produit test/i });
    expect(quantityInput).toHaveValue(2);
  });

  it('should call onUpdateQuantity when increasing quantity', async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const increaseButton = screen.getByLabelText(/augmenter la quantité/i);
    await user.click(increaseButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 3);
  });

  it('should call onUpdateQuantity when decreasing quantity', async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const decreaseButton = screen.getByLabelText(/diminuer la quantité/i);
    await user.click(decreaseButton);

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 1);
  });

  it('should call onRemove when quantity becomes 0', async () => {
    const user = userEvent.setup();
    const itemWithQuantity1: CartItemType = {
      ...mockItem,
      quantity: 1,
    };

    render(
      <CartItem
        item={itemWithQuantity1}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const decreaseButton = screen.getByLabelText(/diminuer la quantité/i);
    await user.click(decreaseButton);

    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('should call onRemove when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const deleteButton = screen.getByLabelText(/supprimer produit test du panier/i);
    await user.click(deleteButton);

    expect(mockOnRemove).toHaveBeenCalledWith('1');
  });

  it('should display discount when discount_amount is greater than 0', () => {
    const itemWithDiscount: CartItemType = {
      ...mockItem,
      discount_amount: 2000,
    };

    render(
      <CartItem
        item={itemWithDiscount}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    // Le formatage peut utiliser des espaces ou des virgules (toLocaleString utilise des espaces en français)
    expect(screen.getByText(/20[\s,]*000\s*XOF/i)).toBeInTheDocument(); // Prix barré
    expect(screen.getByText(/16[\s,]*000\s*XOF/i)).toBeInTheDocument(); // Prix après remise
    expect(screen.getByText(/économie:/i)).toBeInTheDocument();
  });

  it('should calculate total price correctly', () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    // 10000 * 2 = 20000
    expect(screen.getByText(/20[,\s]?000\s*XOF/i)).toBeInTheDocument();
  });

  it('should be disabled when isLoading is true', () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
        isLoading={true}
      />
    );

    const quantityInput = screen.getByRole('spinbutton', { name: /quantité de produit test/i });
    expect(quantityInput).toBeDisabled();

    const increaseButton = screen.getByLabelText(/augmenter la quantité/i);
    expect(increaseButton).toBeDisabled();
  });

  it('should handle quantity input change', async () => {
    const user = userEvent.setup();
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    const quantityInput = screen.getByRole('spinbutton', { name: /quantité de produit test/i });
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');

    expect(mockOnUpdateQuantity).toHaveBeenCalledWith('1', 5);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <CartItem
        item={mockItem}
        onUpdateQuantity={mockOnUpdateQuantity}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByLabelText(/augmenter la quantité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/diminuer la quantité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supprimer produit test du panier/i)).toBeInTheDocument();
  });
});

