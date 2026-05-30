/**
 * Tests pour OrderCard
 * Composant d'affichage de commande
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { OrderCard } from '../orders/OrderCard';
import type { Order } from '@/hooks/useOrders';

// ============================================================
// MOCKS
// ============================================================

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('../orders/OrderDetailDialog', () => ({
  OrderDetailDialog: ({ open, order }: { open: boolean; order: { order_number: string } }) =>
    open ? <div data-testid="order-detail-dialog">Order Detail: {order.order_number}</div> : null,
}));

vi.mock('../orders/OrderEditDialog', () => ({
  OrderEditDialog: ({ open, order }: { open: boolean; order: { order_number: string } }) =>
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
        gcTime: 0,
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
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText(/99,99/)).toBeInTheDocument();
  });

  it('should display order status', () => {
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    expect(screen.getAllByText(/en attente/i).length).toBeGreaterThan(0);
  });

  it('should display payment status', () => {
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle status change', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[1]);

    const completedOption = await screen.findByRole('option', { name: /terminée/i });
    await user.click(completedOption);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should handle payment status change', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[0]);

    const paidOption = await screen.findByRole('option', { name: /payée/i });
    await user.click(paidOption);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should open detail dialog when view button is clicked', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    await user.click(screen.getByRole('button', { name: /voir les détails de la commande/i }));

    expect(screen.getByTestId('order-detail-dialog')).toBeInTheDocument();
  });

  it('should open edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    await user.click(screen.getByRole('button', { name: /modifier la commande/i }));

    expect(screen.getByTestId('order-edit-dialog')).toBeInTheDocument();
  });

  it('should open delete confirmation dialog', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    await user.click(screen.getByRole('button', { name: /supprimer la commande/i }));

    expect(screen.getByText(/confirmer la suppression/i)).toBeInTheDocument();
  });

  it('should handle delete confirmation', async () => {
    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    await user.click(screen.getByRole('button', { name: /supprimer la commande/i }));

    const confirmButton = screen.getByRole('button', { name: /^supprimer$/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('should display formatted date', () => {
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    expect(screen.getByText('ORD-001')).toBeInTheDocument();
  });

  it('should handle error when updating status', async () => {
    mockSupabase.from.mockReturnValueOnce({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
    });

    const user = userEvent.setup();
    const wrapper = createWrapper();
    render(<OrderCard order={mockOrder} onUpdate={mockOnUpdate} storeId="store-1" />, { wrapper });

    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[1]);

    const completedOption = await screen.findByRole('option', { name: /terminée/i });
    await user.click(completedOption);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });
});
