/**
 * Tests unitaires pour useAdmin hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdmin } from '../useAdmin';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner isAdmin: false si pas d\'utilisateur', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAdmin());

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });

  it('devrait retourner isAdmin: true pour principal admin', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: {
        user: {
          id: 'test-id',
          email: 'contact@edigit-agence.com',
        },
      },
      error: null,
    });

    const { result } = renderHook(() => useAdmin());

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
    });
  });

  it('devrait gérer les erreurs correctement', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: null },
      error: { message: 'Erreur de connexion' },
    });

    const { result } = renderHook(() => useAdmin());

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(false);
    });
  });
});

