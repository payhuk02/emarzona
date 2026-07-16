/**
 * Tests pour ShippingDashboard
 * Date: 4 Janvier 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import ShippingDashboard from '../ShippingDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import * as useStoreHook from '@/hooks/useStore';
import * as useFedexShippingHook from '@/hooks/shipping/useFedexShipping';
import * as useToastHook from '@/hooks/use-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock useStore
const mockStore = { id: 'store123', name: 'Test Store' };
vi.mock('@/hooks/useStore', () => ({
  useStore: vi.fn(() => ({ store: mockStore, loading: false })),
}));

// Mock useShipments
const { mockShipments, mockUpdate } = vi.hoisted(() => ({
  mockShipments: [
    {
      id: 'ship1',
      order_id: 'order1',
      carrier_id: 'carrier1',
      store_id: 'store123',
      tracking_number: 'TRACK123',
      tracking_url: 'https://tracking.example.com/TRACK123',
      service_type: 'express',
      status: 'in_transit',
      weight_value: 1.5,
      shipping_cost: 5000,
      currency: 'XOF',
      created_at: '2025-01-01T00:00:00Z',
      order: {
        order_number: 'ORD-001',
        total_amount: 10000,
      },
    },
    {
      id: 'ship2',
      order_id: 'order2',
      carrier_id: 'carrier1',
      store_id: 'store123',
      tracking_number: 'TRACK456',
      tracking_url: 'https://tracking.example.com/TRACK456',
      service_type: 'standard',
      status: 'delivered',
      weight_value: 2.0,
      shipping_cost: 3000,
      currency: 'XOF',
      created_at: '2025-01-02T00:00:00Z',
      order: {
        order_number: 'ORD-002',
        total_amount: 15000,
      },
    },
  ],
  mockUpdate: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/hooks/shipping/useFedexShipping', () => ({
  useShipments: vi.fn(() => ({
    data: mockShipments,
    isLoading: false,
    error: null,
    refetch: vi.fn(() => Promise.resolve()),
  })),
  useUpdateShipmentTracking: vi.fn(() => ({
    mutateAsync: mockUpdate,
    isPending: false,
  })),
  usePrintLabel: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
  })),
  useCancelShipment: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
  })),
  useCreateFedexShipment: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
    isPending: false,
  })),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast, toasts: [] }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<ShippingDashboard />} />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ShippingDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('should render the shipping dashboard', () => {
    renderComponent();
    expect(screen.getAllByText(/Expéditions/i)[0]).toBeInTheDocument();
  });

  it('should display shipment statistics', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total shipments
      expect(screen.getAllByText(/en transit/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/livré/i)[0]).toBeInTheDocument();
    });
  });

  it('should display shipments in the list', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('TRACK123')).toBeInTheDocument();
      expect(screen.getByText('TRACK456')).toBeInTheDocument();
      expect(screen.getByText(/ORD-001/i)).toBeInTheDocument();
      expect(screen.getByText(/ORD-002/i)).toBeInTheDocument();
    });
  });

  it('should allow searching shipments', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('TRACK123')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/rechercher/i);
    await user.type(searchInput, 'TRACK123');
    
    await waitFor(() => {
      expect(screen.getByText('TRACK123')).toBeInTheDocument();
      expect(screen.queryByText('TRACK456')).not.toBeInTheDocument();
    });
  });

  it('should filter shipments by status tab', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('TRACK123')).toBeInTheDocument();
    });

    const deliveredTab = screen.getByRole('tab', { name: /livré/i });
    await user.click(deliveredTab);
    
    await waitFor(() => {
      expect(screen.getByText('TRACK456')).toBeInTheDocument();
      expect(screen.queryByText('TRACK123')).not.toBeInTheDocument();
    });
  });

  it('should allow refreshing tracking for a shipment', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => Promise.resolve());
    vi.mocked(useFedexShippingHook.useUpdateShipmentTracking).mockReturnValue({
      mutateAsync: mockUpdate,
    } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('TRACK123')).toBeInTheDocument();
    });

    const refreshButtons = screen.getAllByRole('button', { name: /actualiser|refresh|rafraîchir/i });
    if (refreshButtons.length > 0) {
      await user.click(refreshButtons[0]);
      expect(mockUpdate).toHaveBeenCalled();
    }
  });

  it('should allow exporting shipments to CSV', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('TRACK123')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /exporter|download|export csv/i });
    await user.click(exportButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: expect.stringMatching(/export réussi/i),
      }));
    });
  });

  it('should display empty state when no shipments', async () => {
    vi.mocked(useFedexShippingHook.useShipments).mockReturnValueOnce({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/aucune expédition/i)).toBeInTheDocument();
    });
  });
});







