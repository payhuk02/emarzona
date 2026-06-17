import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SellerRoutePermissionGuard } from '@/components/billing/SellerRoutePermissionGuard';

const mockToast = vi.fn();

let mockStoreLoading = false;
let mockAccessLoading = false;
let mockPlanSlug: 'physical_basic' | 'physical_standard' | 'physical_premium' | null =
  'physical_basic';
let mockCommerceType: 'physical' | 'digital' | 'service' | 'course' | 'artist' = 'physical';

vi.mock('@/hooks/useStore', () => ({
  useStore: () => ({
    store: { id: 'store-1', commerce_type: mockCommerceType },
    loading: mockStoreLoading,
  }),
}));

vi.mock('@/hooks/billing/useStorePhysicalAccess', () => ({
  useStorePhysicalAccess: () => ({
    planSlug: mockPlanSlug,
    loading: mockAccessLoading,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderGuard(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <SellerRoutePermissionGuard>
                <div>PROTECTED_CONTENT</div>
              </SellerRoutePermissionGuard>
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('SellerRoutePermissionGuard', () => {
  beforeEach(() => {
    mockStoreLoading = false;
    mockAccessLoading = false;
    mockPlanSlug = 'physical_basic';
    mockCommerceType = 'physical';
    mockToast.mockReset();
  });

  it('redirects basic plan on direct premium URL access', async () => {
    renderGuard('/dashboard/batch-shipping');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/billing/physical');
    });

    expect(mockToast).toHaveBeenCalled();
  });

  it('allows standard plan route and keeps direct URL', async () => {
    mockPlanSlug = 'physical_standard';
    renderGuard('/dashboard/suppliers');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/suppliers');
    });

    expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument();
  });

  it('blocks standard plan on premium route', async () => {
    mockPlanSlug = 'physical_standard';
    renderGuard('/dashboard/physical-lots');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/billing/physical');
    });
  });

  it('allows premium plan on premium route direct access', async () => {
    mockPlanSlug = 'physical_premium';
    renderGuard('/dashboard/physical-lots');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/physical-lots');
    });

    expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument();
  });

  it('blocks digital-only route for non-digital stores', async () => {
    mockCommerceType = 'service';
    renderGuard('/dashboard/digital-products');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    });

    expect(mockToast).toHaveBeenCalled();
  });

  it('allows digital store on digital route', async () => {
    mockCommerceType = 'digital';
    renderGuard('/dashboard/digital-products');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/digital-products');
    });

    expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument();
  });

  it('allows service store on service route', async () => {
    mockCommerceType = 'service';
    renderGuard('/dashboard/services/calendar');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/services/calendar');
    });
  });

  it('allows course store on course route', async () => {
    mockCommerceType = 'course';
    renderGuard('/dashboard/my-courses');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/my-courses');
    });
  });

  it('allows artist store on artist route', async () => {
    mockCommerceType = 'artist';
    renderGuard('/dashboard/auctions');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/auctions');
    });
  });

  it('blocks physical product wizard for digital store', async () => {
    mockCommerceType = 'digital';
    renderGuard('/dashboard/products/new/physical');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
    });

    expect(mockToast).toHaveBeenCalled();
  });

  it('allows digital store on digital product wizard', async () => {
    mockCommerceType = 'digital';
    renderGuard('/dashboard/products/new/digital');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/products/new/digital');
    });

    expect(screen.getByText('PROTECTED_CONTENT')).toBeInTheDocument();
  });

  it('allows course store on course creation route', async () => {
    mockCommerceType = 'course';
    renderGuard('/dashboard/courses/new');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/courses/new');
    });
  });
});
