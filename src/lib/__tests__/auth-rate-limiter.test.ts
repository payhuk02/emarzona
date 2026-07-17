import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AUTH_RATE_LIMITS, checkAuthRateLimit } from '@/lib/auth-rate-limiter';
import { buildAuthRateLimitEndpoint, hashAuthIdentifier } from '@/lib/auth-identifier-hash';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('auth-identifier-hash', () => {
  it('produces stable hashes for normalized emails', () => {
    expect(hashAuthIdentifier('User@Example.com')).toBe(hashAuthIdentifier('user@example.com'));
    expect(buildAuthRateLimitEndpoint('login', 'a@b.co')).toMatch(/^auth:login:/);
  });
});

describe('checkAuthRateLimit', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    sessionStorage.clear();
  });

  it('blocks when server returns rate limit exceeded', async () => {
    invokeMock.mockResolvedValue({
      data: {
        allowed: false,
        remaining: 0,
        limit: 5,
        resetAt: new Date(Date.now() + 300000).toISOString(),
        message: 'Too many requests',
      },
      error: null,
    });

    const result = await checkAuthRateLimit('login', 'user@example.com');

    expect(result.allowed).toBe(false);
    expect(result.source).toBe('server');
    expect(invokeMock).toHaveBeenCalledWith('rate-limiter', {
      body: expect.objectContaining({
        endpoint: 'auth',
        authAction: 'login',
        identifier: 'user@example.com',
      }),
    });
  });

  it('allows when server approves without using client counter', async () => {
    invokeMock.mockResolvedValue({
      data: {
        allowed: true,
        remaining: 4,
        limit: 5,
        resetAt: new Date(Date.now() + 300000).toISOString(),
      },
      error: null,
    });

    const result = await checkAuthRateLimit('login', 'user@example.com');

    expect(result.allowed).toBe(true);
    expect(result.source).toBe('server');
    expect(sessionStorage.getItem('emarzona_auth_rate_limits')).toBeNull();
  });

  it('falls back to client storage when server is degraded', async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: { message: 'Network error' },
    });

    const limits = AUTH_RATE_LIMITS.login.maxRequests;
    for (let i = 0; i < limits; i++) {
      const attempt = await checkAuthRateLimit('login', 'fallback@example.com');
      expect(attempt.source).toBe('client-fallback');
      if (i < limits - 1) {
        expect(attempt.allowed).toBe(true);
      }
    }

    const blocked = await checkAuthRateLimit('login', 'fallback@example.com');
    expect(blocked.allowed).toBe(false);
    expect(blocked.source).toBe('client-fallback');
  });
});
