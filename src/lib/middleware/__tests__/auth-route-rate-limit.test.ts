import { describe, expect, it } from 'vitest';
import {
  AUTH_ROUTE_RATE_LIMIT_PER_MINUTE,
  buildAuthRouteRateLimitKey,
  isAuthRateLimitPath,
} from '../auth-route-rate-limit';

describe('auth-route-rate-limit', () => {
  it('limits standard auth paths', () => {
    expect(isAuthRateLimitPath('/auth')).toBe(true);
    expect(isAuthRateLimitPath('/auth/login')).toBe(true);
    expect(isAuthRateLimitPath('/auth/register')).toBe(true);
  });

  it('excludes enterprise SSO paths', () => {
    expect(isAuthRateLimitPath('/auth/sso/my-store')).toBe(false);
    expect(isAuthRateLimitPath('/auth/sso/acme-corp/callback')).toBe(false);
  });

  it('ignores non-auth routes', () => {
    expect(isAuthRateLimitPath('/dashboard')).toBe(false);
    expect(isAuthRateLimitPath('/api/auth')).toBe(false);
  });

  it('builds stable redis keys', () => {
    expect(buildAuthRouteRateLimitKey('1.2.3.4')).toBe('rate_limit:auth_page:1.2.3.4');
  });

  it('uses a reasonable per-minute ceiling', () => {
    expect(AUTH_ROUTE_RATE_LIMIT_PER_MINUTE).toBeGreaterThanOrEqual(30);
    expect(AUTH_ROUTE_RATE_LIMIT_PER_MINUTE).toBeLessThanOrEqual(120);
  });
});
