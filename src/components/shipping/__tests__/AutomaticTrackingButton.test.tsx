import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutomaticTrackingButton } from '../AutomaticTrackingButton';
import { useTrackShipment, useTrackPendingShipments } from '@/hooks/shipping/useAutomaticTracking';

// Mock dependencies
vi.mock('@/hooks/shipping/useAutomaticTracking');

const mockTrackSingle = {
  mutate: vi.fn(),
  isPending: false,
};

const mockTrackBatch = {
  mutate: vi.fn(),
  isPending: false,
};

(useTrackShipment as any).mockReturnValue(mockTrackSingle);
(useTrackPendingShipments as any).mockReturnValue(mockTrackBatch);

describe('AutomaticTrackingButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render single tracking button when shipmentId is provided', () => {
    render(<AutomaticTrackingButton shipmentId="shipment-1" variant="single" />);
    expect(screen.getByText(/mettre à jour le tracking/i)).toBeInTheDocument();
  });

  it('should render batch tracking button when variant is batch', () => {
    render(<AutomaticTrackingButton variant="batch" />);
    expect(screen.getByText(/mettre à jour tous les colis/i)).toBeInTheDocument();
  });

  it('should not render when shipmentId is null and variant is single', () => {
    const { container } = render(<AutomaticTrackingButton shipmentId={null} variant="single" />);
    expect(container.firstChild).toBeNull();
  });

  it('should call trackSingle.mutate when single button is clicked', async () => {
    render(<AutomaticTrackingButton shipmentId="shipment-1" variant="single" />);
    
    const button = screen.getByText(/mettre à jour le tracking/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockTrackSingle.mutate).toHaveBeenCalled();
    });
  });

  it('should call trackBatch.mutate when batch button is clicked', async () => {
    render(<AutomaticTrackingButton variant="batch" />);
    
    const button = screen.getByText(/mettre à jour tous les colis/i);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockTrackBatch.mutate).toHaveBeenCalled();
    });
  });

  it('should show loading state for single tracking', () => {
    mockTrackSingle.isPending = true;
    
    render(<AutomaticTrackingButton shipmentId="shipment-1" variant="single" />);
    expect(screen.getByText(/mise à jour\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading state for batch tracking', () => {
    mockTrackBatch.isPending = true;
    
    render(<AutomaticTrackingButton variant="batch" />);
    expect(screen.getByText(/mise à jour en cours\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <AutomaticTrackingButton shipmentId="shipment-1" className="custom-class" />
    );
    const button = container.querySelector('.custom-class');
    expect(button).toBeInTheDocument();
  });

  it('should disable button when pending', () => {
    mockTrackSingle.isPending = true;
    
    render(<AutomaticTrackingButton shipmentId="shipment-1" variant="single" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
