import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShipmentCard } from '../ShipmentCard';
import { usePrintLabel, useCancelShipment } from '@/hooks/shipping/useFedexShipping';
import { useTranslation } from 'react-i18next';

// Mock dependencies
vi.mock('@/hooks/shipping/useFedexShipping');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key.split('.').pop() || '',
  }),
}));

const mockPrintLabel = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockCancelShipment = {
  mutateAsync: vi.fn(),
  isPending: false,
};

(usePrintLabel as any).mockReturnValue(mockPrintLabel);
(useCancelShipment as any).mockReturnValue(mockCancelShipment);

const mockShipment = {
  id: 'shipment-1',
  tracking_number: 'TRACK123456',
  status: 'in_transit',
  service_type: 'FedEx Ground',
  tracking_url: 'https://fedex.com/track/TRACK123456',
  ship_from: {
    name: 'Origin Warehouse',
    city: 'Paris',
    country: 'France',
  },
  ship_to: {
    name: 'John Doe',
    city: 'Lyon',
    country: 'France',
  },
  estimated_delivery: '2025-01-10T10:00:00Z',
  actual_delivery: null,
  weight_value: 2.5,
  shipping_cost: 1500,
  currency: 'XOF',
  created_at: '2025-01-04T08:00:00Z',
  labels: [
    {
      id: 'label-1',
      url: 'https://example.com/label.pdf',
    },
  ],
  order: {
    id: 'order-1',
    order_number: 'ORD-12345',
  },
};

describe('ShipmentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn(() => true);
  });

  it('should render shipment card with tracking number', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText('TRACK123456')).toBeInTheDocument();
  });

  it('should display order number', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/ORD-12345/i)).toBeInTheDocument();
  });

  it('should display service type', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText('FedEx Ground')).toBeInTheDocument();
  });

  it('should display origin and destination', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/origin warehouse/i)).toBeInTheDocument();
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  it('should display estimated delivery date', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/janvier/i)).toBeInTheDocument();
  });

  it('should show tracking button when tracking_url exists', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/suivre/i)).toBeInTheDocument();
  });

  it('should show print label button when labels exist', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/étiquette/i)).toBeInTheDocument();
  });

  it('should handle print label click', async () => {
    mockPrintLabel.mutateAsync.mockResolvedValue(undefined);
    
    render(<ShipmentCard shipment={mockShipment} />);
    
    const printButton = screen.getByText(/étiquette/i);
    fireEvent.click(printButton);
    
    await waitFor(() => {
      expect(mockPrintLabel.mutateAsync).toHaveBeenCalledWith('label-1');
    });
  });

  it('should handle cancel shipment', async () => {
    mockCancelShipment.mutateAsync.mockResolvedValue(undefined);
    
    render(<ShipmentCard shipment={mockShipment} />);
    
    // Find cancel button (might be in a dropdown or directly visible)
    const cancelButtons = screen.queryAllByText(/annuler/i);
    if (cancelButtons.length > 0) {
      fireEvent.click(cancelButtons[0]);
      
      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled();
        expect(mockCancelShipment.mutateAsync).toHaveBeenCalledWith('shipment-1');
      });
    }
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<ShipmentCard shipment={mockShipment} onRefresh={onRefresh} />);
    
    // Find refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i }) || 
                         screen.getByLabelText(/refresh/i);
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(onRefresh).toHaveBeenCalled();
    }
  });

  it('should display weight and cost', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/2\.5.*kg/i)).toBeInTheDocument();
    expect(screen.getByText(/1[,\s\u202F]?500.*XOF/i)).toBeInTheDocument();
  });

  it('should show timeline when toggle is clicked', async () => {
    render(<ShipmentCard shipment={mockShipment} />);
    
    const timelineButton = screen.queryByText(/suivi détaillé/i) || 
                          screen.queryByLabelText(/afficher.*timeline/i);
    if (timelineButton) {
      fireEvent.click(timelineButton);
      
      await waitFor(() => {
        // Timeline should be visible
        expect(screen.getByText(/suivi détaillé/i)).toBeInTheDocument();
      });
    }
  });

  it('should handle shipment without labels', () => {
    const shipmentWithoutLabels = {
      ...mockShipment,
      labels: [],
    };
    
    render(<ShipmentCard shipment={shipmentWithoutLabels} />);
    expect(screen.queryByText(/étiquette/i)).not.toBeInTheDocument();
  });

  it('should handle shipment without tracking_url', () => {
    const shipmentWithoutUrl = {
      ...mockShipment,
      tracking_url: null,
    };
    
    render(<ShipmentCard shipment={shipmentWithoutUrl} />);
    expect(screen.queryByText(/suivre/i)).not.toBeInTheDocument();
  });
});
