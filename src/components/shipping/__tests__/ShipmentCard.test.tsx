import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShipmentCard } from '../ShipmentCard';
import { usePrintLabel, useCancelShipment } from '@/hooks/shipping/useFedexShipping';

vi.mock('@/hooks/shipping/useFedexShipping');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: string | { defaultValue?: string }) => {
      if (typeof options === 'string') return options;
      if (options && typeof options === 'object' && options.defaultValue) {
        return options.defaultValue;
      }
      return key.split('.').pop() || key;
    },
  }),
}));
vi.mock('../AutomaticTrackingButton', () => ({
  AutomaticTrackingButton: () => null,
}));
vi.mock('../TrackingTimeline', () => ({
  TrackingTimeline: () => <div data-testid="tracking-timeline">Timeline</div>,
}));

const mockPrintLabel = {
  mutateAsync: vi.fn(),
  isPending: false,
};

const mockCancelShipment = {
  mutateAsync: vi.fn(),
  isPending: false,
};

(usePrintLabel as ReturnType<typeof vi.fn>).mockReturnValue(mockPrintLabel);
(useCancelShipment as ReturnType<typeof vi.fn>).mockReturnValue(mockCancelShipment);

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
    expect(screen.getByText(/10 janv/i)).toBeInTheDocument();
  });

  it('should show tracking button when tracking_url exists', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByRole('button', { name: /suivre/i })).toBeInTheDocument();
  });

  it('should show print label button when labels exist', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByRole('button', { name: /étiquette/i })).toBeInTheDocument();
  });

  it('should handle print label click', async () => {
    mockPrintLabel.mutateAsync.mockResolvedValue(undefined);

    render(<ShipmentCard shipment={mockShipment} />);

    fireEvent.click(screen.getByRole('button', { name: /étiquette/i }));

    await waitFor(() => {
      expect(mockPrintLabel.mutateAsync).toHaveBeenCalledWith('label-1');
    });
  });

  it('should handle cancel shipment', async () => {
    mockCancelShipment.mutateAsync.mockResolvedValue(undefined);

    render(<ShipmentCard shipment={mockShipment} />);

    fireEvent.click(screen.getByRole('button', { name: /annuler l'expédition/i }));

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(mockCancelShipment.mutateAsync).toHaveBeenCalledWith('shipment-1');
    });
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<ShipmentCard shipment={mockShipment} onRefresh={onRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: /actualiser les informations/i }));

    expect(onRefresh).toHaveBeenCalled();
  });

  it('should display weight and cost', () => {
    render(<ShipmentCard shipment={mockShipment} />);
    expect(screen.getByText(/2\.5 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/1[\s\u202f]?500.*XOF/i)).toBeInTheDocument();
  });

  it('should show timeline when toggle is clicked', async () => {
    render(<ShipmentCard shipment={mockShipment} />);

    fireEvent.click(screen.getByRole('button', { name: /voir le suivi détaillé/i }));

    await waitFor(() => {
      expect(screen.getByTestId('tracking-timeline')).toBeInTheDocument();
    });
  });

  it('should handle shipment without labels', () => {
    render(<ShipmentCard shipment={{ ...mockShipment, labels: [] }} />);
    expect(screen.queryByRole('button', { name: /étiquette/i })).not.toBeInTheDocument();
  });

  it('should handle shipment without tracking_url', () => {
    render(<ShipmentCard shipment={{ ...mockShipment, tracking_url: null }} />);
    expect(screen.queryByRole('button', { name: /suivre/i })).not.toBeInTheDocument();
  });
});
