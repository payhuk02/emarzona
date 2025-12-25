/**
 * Tests unitaires pour ProtectedRoute
 * Composant critique pour la sécurité
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import * as AuthContext from '@/contexts/AuthContext';

// Mock AuthContext
const mockUser = { id: '123', email: 'test@example.com' };
const mockLoading = false;

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: mockLoading,
  })),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait rendre les enfants si l\'utilisateur est authentifié', () => {
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('devrait rediriger vers /auth si l\'utilisateur n\'est pas authentifié', () => {
    // Mock user as null
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Vérifier que la redirection a lieu
    expect(window.location.pathname).toBe('/auth');
  });

  it('devrait afficher un loader pendant le chargement', () => {
    // Mock loading as true
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    } as ReturnType<typeof AuthContext.useAuth>);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Vérifier qu'un loader est affiché
    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });
});


