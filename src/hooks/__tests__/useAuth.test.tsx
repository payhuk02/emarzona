/**
 * Tests pour le hook useAuth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        // Simuler un changement d'état d'authentification
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
            },
            session: {
              access_token: 'test-token',
            },
          } as any);
        }, 0);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock Sentry
vi.mock('@/lib/sentry', () => ({
  setSentryUser: vi.fn(),
  clearSentryUser: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides auth context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeDefined();
    expect(result.current.session).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(typeof result.current.signOut).toBe('function');
  });

  it('initializes with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initialement en chargement
    expect(result.current.loading).toBe(true);
  });
});

