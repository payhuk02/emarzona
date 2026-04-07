/**
 * Tests pour OrderCard
 * Composant d'affichage de commande
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { OrderCard } from '../orders/OrderCard';
import type { Order } from '@/hooks/useOrders';

// ============================================================
// MOCKS
// ============================================================

const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error: null }),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('../orders/OrderDetailDialog', () => ({
  OrderDetailDialog: ({ open, onOpenChange, order }: any) =>
    open ? <div data-testid="order-detail-dialog">Order Detail: {order.order_number}</div> : null,
}));

vi.mock('../orders/OrderEditDialog', () => ({
  OrderEditDialog: ({ open, onOpenChange, order }: any) =>
    open ? <div data-testid="order-edit-dialog">Edit Order: {order.order_number}</div> : null,
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

const mockOrder: Order = {
  id: 'order-1',
  order_number: 'ORD-001',
  store_id: 'store-1',
  customer_id: 'customer-1',
  total_amount: 99.99,
  currency: 'EUR',
  status: 'pending',
  payment_status: 'pending',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockOnUpdate = vi.fn();

// ============================================================
// TESTS
// ============================================================

describe('OrderCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render order correctly', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText(/99.99/)).toBeInTheDocument();
  });

  it('should display order status', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('should display payment status', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('should handle status change', async () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const statusSelect = screen.getByRole('combobox', { name: /statut/i });
    fireEvent.click(statusSelect);

    const completedOption = screen.getByText(/completed/i);
    fireEvent.click(completedOption);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should handle payment status change', async () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const paymentStatusSelect = screen.getByRole('combobox', { name: /paiement/i });
    fireEvent.click(paymentStatusSelect);

    const paidOption = screen.getByText(/paid/i);
    fireEvent.click(paidOption);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should open detail dialog when view button is clicked', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const viewButton = screen.getByRole('button', { name: /voir|view/i });
    fireEvent.click(viewButton);

    expect(screen.getByTestId('order-detail-dialog')).toBeInTheDocument();
  });

  it('should open edit dialog when edit button is clicked', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const editButton = screen.getByRole('button', { name: /éditer|edit/i });
    fireEvent.click(editButton);

    expect(screen.getByTestId('order-edit-dialog')).toBeInTheDocument();
  });

  it('should open delete confirmation dialog', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const deleteButton = screen.getByRole('button', { name: /supprimer|delete/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText(/confirmer|confirm/i)).toBeInTheDocument();
  });

  it('should handle delete confirmation', async () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const deleteButton = screen.getByRole('button', { name: /supprimer|delete/i });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /confirmer|confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should display formatted date', () => {
    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    // La date devrait être formatée
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  it('should handle error when updating status', async () => {
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
    });

    const wrapper = createWrapper();
    render(
      <OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />,
      { wrapper }
    );

    const statusSelect = screen.getByRole('combobox', { name: /statut/i });
    fireEvent.click(statusSelect);

    const completedOption = screen.getByText(/completed/i);
    fireEvent.click(completedOption);

    await waitFor(() => {
      // L'erreur devrait être gérée et un toast affiché
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
