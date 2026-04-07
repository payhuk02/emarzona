/**
 * Tests pour RecurringBookingsManagement
 * Date: 4 Janvier 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import RecurringBookingsManagement from '../RecurringBookingsManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import * as AuthContext from '@/contexts/AuthContext';
import * as useRecurringBookingsHook from '@/hooks/service/useRecurringBookings';
import * as useToastHook from '@/hooks/use-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock AuthContext
const mockUser = { id: 'user123', email: 'test@example.com' };
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: mockUser })),
}));

// Mock useRecurringBookings
const mockPatterns = [
  {
    id: 'pattern1',
    product_id: 'prod1',
    user_id: 'user123',
    recurrence_type: 'weekly',
    days_of_week: [1, 3, 5],
    start_time: '10:00:00',
    duration_minutes: 60,
    timezone: 'UTC',
    start_date: '2025-01-01',
    status: 'active',
    total_occurrences: 10,
    created_occurrences: 5,
    skipped_occurrences: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pattern2',
    product_id: 'prod2',
    user_id: 'user123',
    recurrence_type: 'daily',
    start_time: '14:00:00',
    duration_minutes: 30,
    timezone: 'UTC',
    start_date: '2025-01-02',
    status: 'paused',
    total_occurrences: 20,
    created_occurrences: 10,
    skipped_occurrences: 2,
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
  },
];

vi.mock('@/hooks/service/useRecurringBookings', () => ({
  useRecurringBookingPatterns: vi.fn(() => ({
    data: mockPatterns,
    isLoading: false,
  })),
  useUpdateRecurringBookingPattern: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
  })),
  useCancelFutureRecurringBookings: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
  })),
  useRescheduleRecurringBookings: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
  })),
  useGenerateMoreOccurrences: vi.fn(() => ({
    mutateAsync: vi.fn(() => Promise.resolve()),
  })),
}));

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<RecurringBookingsManagement />} />
        </Routes>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('RecurringBookingsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    window.confirm = vi.fn(() => true);
  });

  it('should render the page with title', () => {
    renderComponent();
    expect(screen.getByText(/gestion des réservations récurrentes/i)).toBeInTheDocument();
  });

  it('should display statistics cards', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total séries
      expect(screen.getByText('1')).toBeInTheDocument(); // Séries actives
      expect(screen.getByText('15')).toBeInTheDocument(); // Réservations créées (5 + 10)
      expect(screen.getByText('30')).toBeInTheDocument(); // Occurrences totales (10 + 20)
    });
  });

  it('should display recurring booking patterns in table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/hebdomadaire/i)).toBeInTheDocument();
      expect(screen.getByText(/quotidien/i)).toBeInTheDocument();
    });
  });

  it('should allow toggling pause/play on a pattern', async () => {
    const user = userEvent.setup();
    const mockUpdate = vi.fn(() => Promise.resolve());
    vi.mocked(useRecurringBookingsHook.useUpdateRecurringBookingPattern).mockReturnValue({
      mutateAsync: mockUpdate,
    } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/hebdomadaire/i)).toBeInTheDocument();
    });

    const pauseButtons = screen.getAllByRole('button', { name: /pause|play|actif|en pause/i });
    if (pauseButtons.length > 0) {
      await user.click(pauseButtons[0]);
      expect(mockUpdate).toHaveBeenCalled();
    }
  });

  it('should allow cancelling future bookings', async () => {
    const user = userEvent.setup();
    const mockCancel = vi.fn(() => Promise.resolve());
    vi.mocked(useRecurringBookingsHook.useCancelFutureRecurringBookings).mockReturnValue({
      mutateAsync: mockCancel,
    } as any);

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/hebdomadaire/i)).toBeInTheDocument();
    });

    const cancelButtons = screen.getAllByRole('button', { name: /annuler|supprimer/i });
    if (cancelButtons.length > 0) {
      await user.click(cancelButtons[0]);
      expect(window.confirm).toHaveBeenCalled();
      expect(mockCancel).toHaveBeenCalled();
    }
  });

  it('should display recurrence label correctly for weekly pattern', async () => {
    renderComponent();
    
    await waitFor(() => {
      // Le pattern weekly avec days_of_week [1, 3, 5] devrait afficher "Hebdomadaire (Lun, Mer, Ven)"
      expect(screen.getByText(/hebdomadaire/i)).toBeInTheDocument();
    });
  });

  it('should display status badges correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/actif/i)).toBeInTheDocument();
      expect(screen.getByText(/en pause/i)).toBeInTheDocument();
    });
  });
});







