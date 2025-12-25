/**
 * Tests pour AuthContext
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => {
  const mockSupabase = {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        // Simuler un changement d'état
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: { username: 'testuser' },
            },
          } as any, null);
        }, 0);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  };
  return {
    supabase: mockSupabase,
  };
});

// Mock Sentry
vi.mock('@/lib/sentry', () => ({
  setSentryUser: vi.fn(),
  clearSentryUser: vi.fn(),
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides auth context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toHaveProperty('user');
    expect(result.current).toHaveProperty('session');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('signOut');
  });

  it('handles loading state initially', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('signs out user', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.signOut();

    // Vérifier que signOut a été appelé via le mock
    const { supabase } = await import('@/integrations/supabase/client');
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});

