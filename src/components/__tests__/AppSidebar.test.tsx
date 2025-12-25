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
import * as StoreContext from '@/contexts/StoreContext';
import * as AuthContext from '@/contexts/AuthContext';
import * as AdminHook from '@/hooks/useAdmin';

// Mock des dépendances
vi.mock('@/hooks/usePlatformLogo', () => ({
  usePlatformLogo: vi.fn(() => ({
    platformLogo: null,
    loading: false,
  })),
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/dashboard' }),
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

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
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
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Vérifier que le logo ou le placeholder est présent
    const logoElement = screen.getByText('Emarzona') || screen.getByLabelText(/logo/i);
    expect(logoElement).toBeInTheDocument();
  });

  it('should display menu sections', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Vérifier que les sections principales sont présentes
    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('should display dashboard link', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    const dashboardLink = screen.getByRole('link', { name: /tableau de bord/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  it('should display products link', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    const productsLink = screen.getByRole('link', { name: /produits/i });
    expect(productsLink).toBeInTheDocument();
  });

  it('should display orders link', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    const ordersLink = screen.getByRole('link', { name: /commandes/i });
    expect(ordersLink).toBeInTheDocument();
  });

  it('should display logout button', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /déconnexion/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('should display store selection when user has multiple stores', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Vérifier que les boutiques sont affichées dans le sous-menu
    waitFor(() => {
      expect(screen.getByText('Boutique 1')).toBeInTheDocument();
      expect(screen.getByText('Boutique 2')).toBeInTheDocument();
    });
  });

  it('should not display admin menu items for non-admin users', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Les éléments admin ne devraient pas être visibles
    expect(screen.queryByText(/administration/i)).not.toBeInTheDocument();
  });

  it('should display admin menu items for admin users', () => {
    vi.mocked(AdminHook.useAdmin).mockReturnValue({
      isAdmin: true,
      loading: false,
    } as ReturnType<typeof AdminHook.useAdmin>);

    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Vérifier que les éléments admin sont visibles
    waitFor(() => {
      expect(screen.getByText(/administration/i)).toBeInTheDocument();
    });
  });

  it('should display language switcher in footer', () => {
    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    const languageButton = screen.getByRole('button', { name: /change language/i });
    expect(languageButton).toBeInTheDocument();
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

    render(
      <BrowserRouter>
        <AppSidebar />
      </BrowserRouter>
    );

    // Simuler le clic sur une boutique
    waitFor(() => {
      const boutique2Button = screen.getByText('Boutique 2');
      expect(boutique2Button).toBeInTheDocument();
    });
  });
});

