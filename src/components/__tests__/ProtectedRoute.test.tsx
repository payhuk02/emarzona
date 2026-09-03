/**
 * Tests unitaires pour ProtectedRoute
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import * as AuthContext from '@/contexts/AuthContext';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '123', email: 'test@example.com' },
    loading: false,
  })),
}));

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);
  });

  it("devrait rendre les enfants si l'utilisateur est authentifié", () => {
    render(
      <MemoryRouter future={routerFuture}>
        <ProtectedRoute>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Contenu protégé')).toBeInTheDocument();
  });

  it('ne devrait pas rendre le contenu si non authentifié', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: false,
    } as ReturnType<typeof AuthContext.useAuth>);

    render(
      <MemoryRouter initialEntries={['/dashboard']} future={routerFuture}>
        <ProtectedRoute>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
  });

  it('devrait afficher un fallback de zone pendant le chargement', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      loading: true,
    } as ReturnType<typeof AuthContext.useAuth>);

    render(
      <MemoryRouter initialEntries={['/dashboard']} future={routerFuture}>
        <ProtectedRoute>
          <div>Contenu protégé</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Contenu protégé')).not.toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
