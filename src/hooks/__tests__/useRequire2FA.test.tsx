/**
 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA, useIs2FAEnabled } from '@/hooks/useRequire2FA';
import { useAuth } from '@/contexts/AuthContext';

type AuthContextValue = ReturnType<typeof useAuth>;

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as unknown as AuthContextValue);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should exempt principal admin from 2FA requirements', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'principal-admin-id',
        email: 'contact@edigit-agence.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    } as unknown as AuthContextValue);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
    expect(result.current.is2FAEnabled).toBe(true);
    expect(result.current.daysRemaining).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [], totp: [], phone: [], all: [] },
      error: { message: 'Test error', name: 'AuthError', status: 500 },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

describe('useIs2FAEnabled', () => {
  beforeEach(async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockReset();
  });

  it('returns false when MFA factors are unavailable', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [], totp: [], phone: [], all: [] },
      error: { message: 'Test error', name: 'AuthError', status: 500 },
    });

    const { result } = renderHook(() => useIs2FAEnabled());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('returns true when a verified factor exists', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValue({
      data: {
        factors: [{ id: 'factor-1', status: 'verified' }],
        totp: [],
        phone: [],
        all: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useIs2FAEnabled());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('handles unexpected errors without throwing', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useIs2FAEnabled());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
