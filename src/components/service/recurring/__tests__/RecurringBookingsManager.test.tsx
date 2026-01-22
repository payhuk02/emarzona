import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import RecurringBookingsManager from '../RecurringBookingsManager';

// Mocks
vi.mock('@/hooks/useStore', () => ({
  useStore: () => ({
    store: { id: 'store-1', name: 'Test Store' }
  })
}));

vi.mock('@/hooks/services/useRecurringBookings', () => ({
  useRecurringSeries: vi.fn(),
  useCancelRecurringSeries: vi.fn(),
  useRecurringBookingsBySeries: vi.fn(),
  type: { RecurringBookingSeries: {} }
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Import des mocks pour les manipuler
import { useRecurringSeries, useCancelRecurringSeries, useRecurringBookingsBySeries } from '@/hooks/services/useRecurringBookings';

const mockUseRecurringSeries = vi.mocked(useRecurringSeries);
const mockUseCancelRecurringSeries = vi.mocked(useCancelRecurringSeries);
const mockUseRecurringBookingsBySeries = vi.mocked(useRecurringBookingsBySeries);

// Setup
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

describe('RecurringBookingsManager', () => {
  const mockSeries = [
    {
      id: 'series-1',
      service: {
        product: { name: 'Test Service' }
      },
      parent_booking: {
        scheduled_date: '2024-01-15T10:00:00Z'
      },
      recurrence_pattern: 'weekly',
      recurrence_interval: 1,
      recurrence_end_date: '2024-12-15T10:00:00Z',
      total_bookings: 10,
      completed_bookings: 8,
      cancelled_bookings: 1,
      is_active: true
    },
    {
      id: 'series-2',
      service: {
        product: { name: 'Another Service' }
      },
      parent_booking: {
        scheduled_date: '2024-01-20T14:00:00Z'
      },
      recurrence_pattern: 'monthly',
      recurrence_interval: 1,
      recurrence_end_date: null,
      total_bookings: 5,
      completed_bookings: 3,
      cancelled_bookings: 0,
      is_active: false
    }
  ];

  const mockBookings = [
    {
      id: 'booking-1',
      scheduled_date: '2024-01-15',
      scheduled_start_time: '10:00',
      scheduled_end_time: '11:00',
      status: 'completed'
    },
    {
      id: 'booking-2',
      scheduled_date: '2024-01-22',
      scheduled_start_time: '10:00',
      scheduled_end_time: '11:00',
      status: 'confirmed'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseRecurringSeries.mockReturnValue({
      data: mockSeries,
      isLoading: false,
      error: null
    });

    mockUseCancelRecurringSeries.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false
    });

    mockUseRecurringBookingsBySeries.mockReturnValue({
      data: [],
      isLoading: false,
      error: null
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when data is loading', () => {
      mockUseRecurringSeries.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Chargement...')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no series exist', () => {
      mockUseRecurringSeries.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Aucune série récurrente pour le moment')).toBeInTheDocument();
      expect(screen.getByText('Créez une série de réservations récurrentes pour commencer')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('renders series data in desktop table view', () => {
      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('Another Service')).toBeInTheDocument();
      expect(screen.getAllByText('Toutes les semaines')).toHaveLength(2);
      expect(screen.getByText('Tous les mois')).toBeInTheDocument();
    });

    it('renders series data in mobile card view', () => {
      // Mock window.innerWidth to simulate mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Test Service')).toBeInTheDocument();
      expect(screen.getByText('Another Service')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('opens details dialog when view details is clicked', async () => {
      const user = userEvent.setup();
      mockUseRecurringBookingsBySeries.mockReturnValue({
        data: mockBookings,
        isLoading: false,
        error: null
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      const menuButtons = screen.getAllByLabelText(/Actions pour la série/);
      await user.click(menuButtons[0]);

      const viewDetailsButton = screen.getByRole('menuitem', { name: /Voir les détails/ });
      await user.click(viewDetailsButton);

      await waitFor(() => {
        expect(screen.getByText('Détails de la Série Récurrente')).toBeInTheDocument();
      });

      expect(screen.getAllByText('completed')).toHaveLength(2);
      expect(screen.getByText('confirmed')).toBeInTheDocument();
    });

    it('opens cancel confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      const mockCancel = vi.fn().mockResolvedValue(undefined);
      mockUseCancelRecurringSeries.mockReturnValue({
        mutateAsync: mockCancel,
        isPending: false
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      const menuButtons = screen.getAllByLabelText(/Actions pour la série/);
      await user.click(menuButtons[0]);

      const cancelButton = screen.getByRole('menuitem', { name: /Annuler la série/ });
      await user.click(cancelButton);

      expect(screen.getByText('Annuler la série récurrente')).toBeInTheDocument();
      expect(screen.getByText('Êtes-vous sûr de vouloir annuler toutes les réservations de cette série ?')).toBeInTheDocument();
    });

    it('cancels series when confirmed', async () => {
      const user = userEvent.setup();
      const mockCancel = vi.fn().mockResolvedValue(undefined);
      mockUseCancelRecurringSeries.mockReturnValue({
        mutateAsync: mockCancel,
        isPending: false
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      // Open cancel dialog
      const menuButtons = screen.getAllByLabelText(/Actions pour la série/);
      await user.click(menuButtons[0]);
      const cancelButton = screen.getByRole('menuitem', { name: /Annuler la série/ });
      await user.click(cancelButton);

      // Confirm cancellation
      const confirmButton = screen.getByRole('button', { name: 'Confirmer' });
      await user.click(confirmButton);

      expect(mockCancel).toHaveBeenCalledWith('series-1');
    });
  });

  describe('Pattern Labels', () => {
    it('displays correct pattern labels', () => {
      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Toutes les semaines')).toBeInTheDocument();
      expect(screen.getByText('Tous les mois')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('displays active/inactive status correctly', () => {
      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Actif')).toBeInTheDocument();
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing service data gracefully', () => {
      const seriesWithoutService = [{
        id: 'series-1',
        service: null,
        parent_booking: { scheduled_date: '2024-01-15T10:00:00Z' },
        recurrence_pattern: 'daily',
        recurrence_interval: 1,
        total_bookings: 5,
        completed_bookings: 3,
        cancelled_bookings: 0,
        is_active: true
      }];

      mockUseRecurringSeries.mockReturnValue({
        data: seriesWithoutService,
        isLoading: false,
        error: null
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      // "Service" appears in multiple places (table header + fallback cells),
      // so use a role-based query to avoid ambiguous matches.
      expect(screen.getByRole('columnheader', { name: 'Service' })).toBeInTheDocument();
    });

    it('handles missing scheduled date gracefully', () => {
      const seriesWithoutDate = [{
        id: 'series-1',
        service: { product: { name: 'Test Service' } },
        parent_booking: null,
        recurrence_pattern: 'daily',
        recurrence_interval: 1,
        total_bookings: 5,
        completed_bookings: 3,
        cancelled_bookings: 0,
        is_active: true
      }];

      mockUseRecurringSeries.mockReturnValue({
        data: seriesWithoutDate,
        isLoading: false,
        error: null
      });

      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      expect(screen.getByText('Date non définie')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on dropdown menu items', async () => {
      const user = userEvent.setup();
      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      const menuButtons = screen.getAllByLabelText(/Actions pour la série/);
      await user.click(menuButtons[0]);

      expect(screen.getByLabelText('Voir les détails de la série Test Service')).toBeInTheDocument();
      expect(screen.getByLabelText('Annuler la série de réservations Test Service')).toBeInTheDocument();
    });

    it('has proper ARIA labels on dropdown triggers', () => {
      render(<RecurringBookingsManager />, { wrapper: createWrapper() });

      const menuButtons = screen.getAllByLabelText(/Actions pour la série/);
      expect(menuButtons).toHaveLength(2);
    });
  });
});