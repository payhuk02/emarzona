import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShowErrorDetails } from '@/lib/security/error-debug';

describe('canShowErrorDetails', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.replaceState({}, '', '/');
  });

  it('returns true in development', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_ERROR_DEBUG_TOKEN', '');
    expect(canShowErrorDetails()).toBe(true);
  });

  it('returns false in production without token', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ERROR_DEBUG_TOKEN', '');
    window.history.replaceState({}, '', '/?debug=1');
    expect(canShowErrorDetails()).toBe(false);
  });

  it('returns false in production with legacy ?debug=1 only', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ERROR_DEBUG_TOKEN', 'super-secret-debug-token');
    window.history.replaceState({}, '', '/?debug=1');
    expect(canShowErrorDetails()).toBe(false);
  });

  it('returns true in production when debug_token matches secret', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ERROR_DEBUG_TOKEN', 'super-secret-debug-token');
    window.history.replaceState({}, '', '/?debug_token=super-secret-debug-token');
    expect(canShowErrorDetails()).toBe(true);
  });
});
