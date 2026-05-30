import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { TimeSlotPicker } from '../TimeSlotPicker';

vi.mock('@/hooks/service/useServiceBookingValidation', () => ({
  useQuickAvailabilityCheck: vi.fn(),
}));

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { useQuickAvailabilityCheck } from '@/hooks/service/useServiceBookingValidation';

const mockUseQuickAvailabilityCheck = vi.mocked(useQuickAvailabilityCheck);

const availabilitySlots = [
  { start_time: '09:00:00', end_time: '12:00:00', is_active: true },
  { start_time: '14:00:00', end_time: '16:00:00', is_active: true },
];

function mockAvailabilityQuery(data: typeof availabilitySlots = availabilitySlots) {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'service_availability_slots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data, error: null }),
            }),
          }),
        }),
      };
    }

    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };
  });
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('TimeSlotPicker', () => {
  const defaultProps = {
    serviceProductId: 'service-1',
    date: new Date('2024-01-15'),
    onSlotSelect: vi.fn(),
    durationMinutes: 60,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAvailabilityQuery();

    mockUseQuickAvailabilityCheck.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ available: true }),
      isPending: false,
      data: { available: true },
    } as ReturnType<typeof useQuickAvailabilityCheck>);
  });

  it('shows loading skeleton while fetching slots', () => {
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue(new Promise(() => undefined)),
          }),
        }),
      }),
    }));

    const { container } = render(<TimeSlotPicker {...defaultProps} />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelectorAll('[class*="animate-pulse"], .h-10').length).toBeGreaterThan(0);
  });

  it('shows no slots message when no slots are available', async () => {
    mockAvailabilityQuery([]);

    render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/aucun créneau disponible pour cette date/i)).toBeInTheDocument();
    });
  });

  it('renders generated time slots from availability windows', async () => {
    render(<TimeSlotPicker {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('11:00')).toBeInTheDocument();
      expect(screen.getByText('14:00')).toBeInTheDocument();
      expect(screen.getByText('15:00')).toBeInTheDocument();
    });
  });

  it('calls onSlotSelect when slot is clicked', async () => {
    const onSlotSelect = vi.fn();
    const user = userEvent.setup();

    render(<TimeSlotPicker {...defaultProps} onSlotSelect={onSlotSelect} />, {
      wrapper: createWrapper(),
    });

    const slot = await screen.findByText('09:00');
    await user.click(slot.closest('button')!);

    expect(onSlotSelect).toHaveBeenCalledWith(expect.objectContaining({ time: '09:00' }));
  });

  it('highlights selected slot', async () => {
    render(<TimeSlotPicker {...defaultProps} selectedSlot="10:00" />, { wrapper: createWrapper() });

    await waitFor(() => {
      const selectedButton = screen.getByText('10:00').closest('button');
      expect(selectedButton).toHaveClass('bg-gradient-to-r');
    });
  });

  it('handles missing service IDs gracefully', async () => {
    render(
      <TimeSlotPicker {...defaultProps} serviceProductId={undefined} serviceId={undefined} />,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText(/aucun créneau disponible pour cette date/i)).toBeInTheDocument();
    });
  });
});
