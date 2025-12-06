import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TrackingTimeline } from '../TrackingTimeline';
import { useFedexTracking } from '@/hooks/shipping/useFedexShipping';

// Mock dependencies
vi.mock('@/hooks/shipping/useFedexShipping');

const mockUseFedexTracking = useFedexTracking as any;

describe('TrackingTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading skeleton when loading', () => {
    mockUseFedexTracking.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<TrackingTimeline trackingNumber="TRACK123" />);
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  it('should render empty state when no tracking data', () => {
    mockUseFedexTracking.mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<TrackingTimeline trackingNumber="TRACK123" />);
    expect(screen.getByText(/aucune information de suivi disponible/i)).toBeInTheDocument();
  });

  it('should render empty state when events array is empty', () => {
    mockUseFedexTracking.mockReturnValue({
      data: {
        events: [],
      },
      isLoading: false,
    });

    render(<TrackingTimeline trackingNumber="TRACK123" />);
    expect(screen.getByText(/aucune information de suivi disponible/i)).toBeInTheDocument();
  });

  it('should render timeline with events', async () => {
    const mockEvents = [
      {
        status: 'DELIVERED',
        timestamp: '2025-01-04T10:00:00Z',
        location: 'Paris, France',
        description: 'Livré',
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: '2025-01-04T08:00:00Z',
        location: 'Paris, France',
        description: 'En cours de livraison',
      },
      {
        status: 'IN_TRANSIT',
        timestamp: '2025-01-03T12:00:00Z',
        location: 'Lyon, France',
        description: 'En transit',
      },
    ];

    mockUseFedexTracking.mockReturnValue({
      data: {
        events: mockEvents,
      },
      isLoading: false,
    });

    render(<TrackingTimeline trackingNumber="TRACK123" />);

    await waitFor(() => {
      expect(screen.getByText(/suivi détaillé/i)).toBeInTheDocument();
      expect(screen.getByText(/livré/i)).toBeInTheDocument();
      expect(screen.getByText(/en cours de livraison/i)).toBeInTheDocument();
      expect(screen.getByText(/en transit/i)).toBeInTheDocument();
    });
  });

  it('should highlight latest event', async () => {
    const mockEvents = [
      {
        status: 'DELIVERED',
        timestamp: '2025-01-04T10:00:00Z',
        location: 'Paris, France',
        description: 'Livré',
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: '2025-01-04T08:00:00Z',
        location: 'Paris, France',
        description: 'En cours de livraison',
      },
    ];

    mockUseFedexTracking.mockReturnValue({
      data: {
        events: mockEvents,
      },
      isLoading: false,
    });

    const { container } = render(<TrackingTimeline trackingNumber="TRACK123" />);

    await waitFor(() => {
      // Latest event should have primary styling
      const latestEvent = container.querySelector('[class*="border-primary"]');
      expect(latestEvent).toBeInTheDocument();
    });
  });

  it('should show check icon for delivered status', async () => {
    const mockEvents = [
      {
        status: 'DELIVERED',
        timestamp: '2025-01-04T10:00:00Z',
        location: 'Paris, France',
        description: 'Livré',
      },
    ];

    mockUseFedexTracking.mockReturnValue({
      data: {
        events: mockEvents,
      },
      isLoading: false,
    });

    const { container } = render(<TrackingTimeline trackingNumber="TRACK123" />);

    await waitFor(() => {
      // CheckCircle icon should be present for delivered status
      const checkIcon = container.querySelector('[class*="CheckCircle"]');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    const mockEvents = [
      {
        status: 'DELIVERED',
        timestamp: '2025-01-04T10:00:00Z',
        location: 'Paris, France',
        description: 'Livré',
      },
    ];

    mockUseFedexTracking.mockReturnValue({
      data: {
        events: mockEvents,
      },
      isLoading: false,
    });

    render(<TrackingTimeline trackingNumber="TRACK123" />);

    await waitFor(() => {
      // Date should be formatted and displayed
      expect(screen.getByText(/janvier/i)).toBeInTheDocument();
    });
  });
});





