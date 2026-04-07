/**
 * Tests unitaires pour AdminRoute
 * Composant critique pour la sécurité admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminRoute } from '../AdminRoute';
import * as AuthContext from '@/contexts/AuthContext';
import * as useAdminHook from '@/hooks/useAdmin';

// Mock AuthContext
const mockUser = { id: '123', email: 'admin@example.com' };
const mockLoading = false;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: mockLoading,
  })),
}));

vi.mock('@/hooks/useAdmin', () => ({
  useAdmin: vi.fn(() => ({
    isAdmin: true,
    isLoading: false,
  })),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre les enfants si l\'utilisateur est admin', () => {
    render(
      <BrowserRouter>
        <AdminRoute>
          <div>Contenu admin</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Contenu admin')).toBeInTheDocument();
  });

  it('devrait rediriger vers /auth si l\'utilisateur n\'est pas authentifié', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);

    render(
      <BrowserRouter>
        <AdminRoute>
          <div>Contenu admin</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('devrait afficher un message d\'accès refusé si l\'utilisateur n\'est pas admin', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);

    vi.mocked(useAdminHook.useAdmin).mockReturnValue({
      isAdmin: false,
      isLoading: false,
    } as ReturnType<typeof useAdminHook.useAdmin>);

    render(
      <BrowserRouter>
        <AdminRoute>
          <div>Contenu admin</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
    expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
  });

  it('devrait afficher un loader pendant le chargement', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    } as ReturnType<typeof AuthContext.useAuth>);

    render(
      <BrowserRouter>
        <AdminRoute>
          <div>Contenu admin</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    expect(screen.queryByText('Contenu admin')).not.toBeInTheDocument();
  });

  it('devrait afficher un loader pendant la vérification admin', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);

    vi.mocked(useAdminHook.useAdmin).mockReturnValue({
      isAdmin: false,
      isLoading: true,
    } as ReturnType<typeof useAdminHook.useAdmin>);

    render(
      <BrowserRouter>
        <AdminRoute>
          <div>Contenu admin</div>
        </AdminRoute>
      </BrowserRouter>
    );

    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });
});

