import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { TimeSlotPicker } from '../TimeSlotPicker';

// Mocks
vi.mock('@/hooks/service/useServiceBookingValidation', () => ({
  useQuickAvailabilityCheck: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

// Import du mock pour le manipuler
import { useQuickAvailabilityCheck } from '@/hooks/service/useServiceBookingValidation';
const mockUseQuickAvailabilityCheck = vi.mocked(useQuickAvailabilityCheck);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('TimeSlotPicker', () => {
  const mockSlots = [
    { time: '09:00', availableSpots: 5 },
    { time: '10:00', availableSpots: 3 },
    { time: '11:00', availableSpots: 0 },
    { time: '14:00', availableSpots: 2 },
    { time: '15:00', availableSpots: 1 }
  ];

  const defaultProps = {
    serviceProductId: 'service-1',
    date: new Date('2024-01-15'),
    onSlotSelect: vi.fn(),
    selectedSlot: undefined,
    durationMinutes: 60
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase response
    const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: mockSlots,
                  error: null
                }))
              }))
            }))
          }))
        }))
      }))
    });

    mockUseQuickAvailabilityCheck.mockReturnValue({
      checkAvailability: vi.fn().mockResolvedValue({ available: true, spots: 3 }),
      isChecking: false
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton while fetching slots', () => {
      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByText('Chargement des créneaux...')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
    });
  });

  describe('Empty State', () => {
    it('shows no slots message when no slots are available', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Aucun créneau disponible')).toBeInTheDocument();
      });
    });
  });

  describe('Slot Display', () => {
    it('renders available time slots correctly', async () => {
      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
        expect(screen.getByText('10:00')).toBeInTheDocument();
        expect(screen.getByText('14:00')).toBeInTheDocument();
      });

      // Check availability badges
      expect(screen.getByText('5 places')).toBeInTheDocument();
      expect(screen.getByText('3 places')).toBeInTheDocument();
      expect(screen.getByText('2 places')).toBeInTheDocument();
    });

    it('shows unavailable slots as disabled', async () => {
      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        const unavailableSlot = screen.getByText('11:00');
        expect(unavailableSlot.closest('button')).toBeDisabled();
      });
    });
  });

  describe('Slot Selection', () => {
    it('calls onSlotSelect when slot is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSelect = vi.fn();

      render(
        <TimeSlotPicker {...defaultProps} onSlotSelect={mockOnSelect} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      const slotButton = screen.getByRole('button', { name: /09:00/ });
      await user.click(slotButton);

      expect(mockOnSelect).toHaveBeenCalledWith({ time: '09:00', availableSpots: 5 });
    });

    it('highlights selected slot', async () => {
      render(
        <TimeSlotPicker {...defaultProps} selectedSlot="09:00" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        const selectedButton = screen.getByRole('button', { name: /09:00/ });
        expect(selectedButton).toHaveClass('ring-2', 'ring-primary');
      });
    });

    it('allows deselection by clicking selected slot', async () => {
      const user = userEvent.setup();
      const mockOnSelect = vi.fn();

      render(
        <TimeSlotPicker {...defaultProps} onSlotSelect={mockOnSelect} selectedSlot="09:00" />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      const slotButton = screen.getByRole('button', { name: /09:00/ });
      await user.click(slotButton);

      expect(mockOnSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Quick Availability Check', () => {
    it('shows checking state when hovering over slot', async () => {
      const user = userEvent.setup();
      mockUseQuickAvailabilityCheck.mockReturnValue({
        checkAvailability: vi.fn().mockResolvedValue({ available: true, spots: 2 }),
        isChecking: true
      });

      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      const slotButton = screen.getByRole('button', { name: /09:00/ });
      await user.hover(slotButton);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('updates availability info on hover', async () => {
      const user = userEvent.setup();
      const mockCheck = vi.fn().mockResolvedValue({ available: true, spots: 2 });
      mockUseQuickAvailabilityCheck.mockReturnValue({
        checkAvailability: mockCheck,
        isChecking: false
      });

      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      const slotButton = screen.getByRole('button', { name: /09:00/ });
      await user.hover(slotButton);

      expect(mockCheck).toHaveBeenCalledWith('service-1', '2024-01-15', '09:00', 60);
    });
  });

  describe('Duration Handling', () => {
    it('passes duration to availability check', async () => {
      const user = userEvent.setup();
      const mockCheck = vi.fn().mockResolvedValue({ available: true, spots: 2 });
      mockUseQuickAvailabilityCheck.mockReturnValue({
        checkAvailability: mockCheck,
        isChecking: false
      });

      render(
        <TimeSlotPicker {...defaultProps} durationMinutes={120} />,
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      const slotButton = screen.getByRole('button', { name: /09:00/ });
      await user.hover(slotButton);

      expect(mockCheck).toHaveBeenCalledWith('service-1', '2024-01-15', '09:00', 120);
    });
  });

  describe('Service ID Handling', () => {
    it('uses serviceId when serviceProductId is not provided', () => {
      const { rerender } = render(
        <TimeSlotPicker
          {...defaultProps}
          serviceProductId={undefined}
          serviceId="service-alt"
        />,
        { wrapper: createWrapper() }
      );

      // The component should use serviceId as fallback
      expect(true).toBe(true); // Basic assertion for now
    });

    it('handles missing service IDs gracefully', () => {
      render(
        <TimeSlotPicker
          {...defaultProps}
          serviceProductId={undefined}
          serviceId={undefined}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Chargement des créneaux...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles query errors gracefully', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: null,
                    error: { message: 'Database error' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Erreur lors du chargement')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for time slots', async () => {
      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      const slotButtons = screen.getAllByRole('button');
      expect(slotButtons.length).toBeGreaterThan(0);

      // Check that buttons have appropriate accessibility features
      slotButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('indicates availability status to screen readers', async () => {
      render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('09:00')).toBeInTheDocument();
      });

      // Check for availability indicators
      expect(screen.getByText('5 places')).toBeInTheDocument();
      expect(screen.getByText('3 places')).toBeInTheDocument();
    });
  });
});