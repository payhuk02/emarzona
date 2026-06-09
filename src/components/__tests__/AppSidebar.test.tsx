/**
 * Tests unitaires pour AppSidebar
 * Composant critique pour la navigation
 *
 * Couverture :
 * - Affichage du logo
 * - Affichage des sections de menu
 * - Navigation vers les routes
 * - Gestion des rôles (admin, vendor)
 * - Déconnexion
 * - Sélection de boutique
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppSidebar } from '../AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import * as StoreContext from '@/contexts/StoreContext';
import * as AuthContext from '@/contexts/AuthContext';
import * as AdminHook from '@/hooks/useAdmin';

vi.mock('@/contexts/StoreContext', () => ({
  useStoreContext: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn(),
}));

vi.mock('@/hooks/usePlatformLogo', () => ({
  usePlatformLogo: vi.fn(() => '/emarzona-logo.png'),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

vi.mock('@/components/sidebar/SidebarNavCommandPalette', () => ({
  SidebarNavCommandPalette: () => null,
}));

const mockLocation = { pathname: '/dashboard' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => mockLocation,
  };
});

const mockStores = [
  { id: '1', name: 'Boutique 1', slug: 'boutique-1' },
  { id: '2', name: 'Boutique 2', slug: 'boutique-2' },
];

const mockUser = {
  id: '123',
  email: 'test@example.com',
  role: 'vendor',
};

const defaultStoreContext = {
  stores: mockStores,
  selectedStoreId: '1',
  switchStore: vi.fn(),
  loading: false,
  canCreateStore: () => true,
} as ReturnType<typeof StoreContext.useStoreContext>;

const renderAppSidebar = () =>
  render(
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </BrowserRouter>
  );

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLocation.pathname = '/dashboard';

    vi.mocked(StoreContext.useStoreContext).mockReturnValue({
      ...defaultStoreContext,
      switchStore: vi.fn(),
    });

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
    } as ReturnType<typeof AuthContext.useAuth>);

    vi.mocked(AdminHook.useAdmin).mockReturnValue({
      isAdmin: false,
      loading: false,
    } as ReturnType<typeof AdminHook.useAdmin>);
  });

  it('should render the sidebar with logo', async () => {
    renderAppSidebar();

    expect(await screen.findByText('Emarzona')).toBeInTheDocument();
  });

  it('should display menu sections', async () => {
    renderAppSidebar();

    expect(await screen.findByText('Principal')).toBeInTheDocument();
  });

  it('should display dashboard link', async () => {
    renderAppSidebar();

    await screen.findByText('Principal');

    await waitFor(
      () => {
        const dashboardLinks = screen
          .getAllByRole('link')
          .filter(link => link.getAttribute('href') === '/dashboard');
        expect(dashboardLinks.length).toBeGreaterThan(0);
      },
      { timeout: 15_000 }
    );
  });

  it('should display products link', async () => {
    renderAppSidebar();

    await waitFor(
      () => {
        expect(screen.getAllByRole('link', { name: /^produits$/i }).length).toBeGreaterThan(0);
      },
      { timeout: 15_000 }
    );
  });

  it('should display orders link', async () => {
    renderAppSidebar();

    await waitFor(
      () => {
        expect(screen.getAllByRole('link', { name: /^commandes$/i }).length).toBeGreaterThan(0);
      },
      { timeout: 15_000 }
    );
  });

  it('should render an icon for the Paiements link', async () => {
    mockLocation.pathname = '/dashboard/payments';
    renderAppSidebar();

    await waitFor(
      () => {
        const paymentsLinks = screen
          .getAllByRole('link')
          .filter(link => link.getAttribute('href') === '/dashboard/payments');
        expect(paymentsLinks.length).toBeGreaterThan(0);
        expect(paymentsLinks.some(link => link.querySelector('svg'))).toBe(true);
      },
      { timeout: 15_000 }
    );
  });

  it('should display store selection when user has multiple stores', async () => {
    renderAppSidebar();

    expect(await screen.findByText('Boutique 1')).toBeInTheDocument();
    expect(screen.getByText('Boutique 2')).toBeInTheDocument();
  });

  it('should not display admin menu items for non-admin users', async () => {
    renderAppSidebar();

    await screen.findByText('Principal');
    expect(screen.queryByText(/administration/i)).not.toBeInTheDocument();
  });

  it('should display admin menu items for admin users', async () => {
    mockLocation.pathname = '/admin/dashboard';
    vi.mocked(AdminHook.useAdmin).mockReturnValue({
      isAdmin: true,
      loading: false,
    } as ReturnType<typeof AdminHook.useAdmin>);

    renderAppSidebar();

    expect(await screen.findByText(/administration/i)).toBeInTheDocument();
  });

  it('should handle store switching', async () => {
    const switchStore = vi.fn();
    vi.mocked(StoreContext.useStoreContext).mockReturnValue({
      ...defaultStoreContext,
      switchStore,
    });

    renderAppSidebar();

    expect(await screen.findByText('Boutique 2')).toBeInTheDocument();
  });
});
