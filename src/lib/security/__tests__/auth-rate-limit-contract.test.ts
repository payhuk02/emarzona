import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Contract P0-4 : le rate limit auth serveur est autoritaire ; le client est fallback dégradé.
 */
describe('auth rate limit security contract', () => {
  it('auth-rate-limiter delegates to checkServerAuthRateLimit first', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/auth-rate-limiter.ts'), 'utf8');
    expect(src).toContain('checkServerAuthRateLimit');
    expect(src).toContain("source: 'server'");
    expect(src).toContain("source: 'client-fallback'");
    expect(src).toMatch(/degraded|server\.allowed/);
  });

  it('rate-limiter exposes server auth endpoint via Edge Function', () => {
    const src = readFileSync(join(process.cwd(), 'src/lib/rate-limiter.ts'), 'utf8');
    expect(src).toContain("invoke('rate-limiter'");
    expect(src).toContain('authAction');
    expect(src).toContain('identifier');
  });

  it('Auth page uses checkAuthRateLimit before submit flows', () => {
    const src = readFileSync(join(process.cwd(), 'src/pages/Auth.tsx'), 'utf8');
    expect(src).toContain("checkAuthRateLimit('login'");
    expect(src).toContain("checkAuthRateLimit('register'");
    expect(src).toContain("checkAuthRateLimit('reset-password'");
  });
});
