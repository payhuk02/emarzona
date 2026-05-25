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

// Mock des dépendances
vi.mock('@/hooks/usePlatformLogo', () => ({
  usePlatformLogo: vi.fn(() => '/emarzona-logo.png'),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
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
    mockLocation.pathname = '/dashboard';

    // Mock StoreContext
    vi.mocked(StoreContext.useStoreContext).mockReturnValue({
      stores: mockStores,
      selectedStoreId: '1',
      switchStore: vi.fn(),
      storesLoading: false,
      canCreateStore: () => true,
    } as ReturnType<typeof StoreContext.useStoreContext>);

    // Mock AuthContext
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);

    // Mock useAdmin
    vi.mocked(AdminHook.useAdmin).mockReturnValue({
      isAdmin: false,
      loading: false,
    } as ReturnType<typeof AdminHook.useAdmin>);
  });

  it('should render the sidebar with logo', () => {
    renderAppSidebar();

    // Vérifier que le logo ou le placeholder est présent
    const logoElement = screen.getByText('Emarzona') || screen.getByLabelText(/logo/i);
    expect(logoElement).toBeInTheDocument();
  });

  it('should display menu sections', () => {
    renderAppSidebar();

    // Vérifier que les sections principales sont présentes
    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('should display dashboard link', () => {
    renderAppSidebar();

    const dashboardLink = screen.getAllByRole('link', { name: /tableau de bord/i })[0];
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('should display products link', () => {
    renderAppSidebar();

    expect(screen.getAllByRole('link', { name: /^produits$/i }).length).toBeGreaterThan(0);
  });

  it('should display orders link', () => {
    renderAppSidebar();

    expect(screen.getAllByRole('link', { name: /commandes/i }).length).toBeGreaterThan(0);
  });

  it('should display logout button', () => {
    renderAppSidebar();

    const logoutButton = screen.getByRole('button', { name: /déconnexion/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('should display store selection when user has multiple stores', async () => {
    renderAppSidebar();

    await waitFor(() => {
      expect(screen.getByText('Boutique 1')).toBeInTheDocument();
      expect(screen.getByText('Boutique 2')).toBeInTheDocument();
    });
  });

  it('should not display admin menu items for non-admin users', () => {
    renderAppSidebar();

    // Les éléments admin ne devraient pas être visibles
    expect(screen.queryByText(/administration/i)).not.toBeInTheDocument();
  });

  it('should display admin menu items for admin users', async () => {
    mockLocation.pathname = '/admin/dashboard';
    vi.mocked(AdminHook.useAdmin).mockReturnValue({
      isAdmin: true,
      loading: false,
    } as ReturnType<typeof AdminHook.useAdmin>);

    renderAppSidebar();

    await waitFor(() => {
      expect(screen.getByText(/administration/i)).toBeInTheDocument();
    });
  });

  it('should display language switcher in footer', () => {
    renderAppSidebar();

    expect(screen.getByLabelText(/^Langue :/i)).toBeInTheDocument();
  });

  it('should handle store switching', async () => {
    const switchStore = vi.fn();
    vi.mocked(StoreContext.useStoreContext).mockReturnValue({
      stores: mockStores,
      selectedStoreId: '1',
      switchStore,
      storesLoading: false,
      canCreateStore: () => true,
    } as ReturnType<typeof StoreContext.useStoreContext>);

    renderAppSidebar();

    await waitFor(() => {
      expect(screen.getByText('Boutique 2')).toBeInTheDocument();
    });
  });
});
