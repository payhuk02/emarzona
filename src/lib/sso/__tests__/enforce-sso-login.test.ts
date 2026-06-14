import { describe, it, expect } from 'vitest';
import { resolveSsoErrorMessage, getSsoLoginHref } from '../enforce-sso-login';

describe('enforce-sso-login (Epic 4.3)', () => {
  it('resolveSsoErrorMessage maps known codes', () => {
    expect(resolveSsoErrorMessage('domain_not_allowed')).toMatch(/domaine email/);
    expect(resolveSsoErrorMessage('unknown_code')).toContain('unknown_code');
    expect(resolveSsoErrorMessage(null)).toBeNull();
  });

  it('getSsoLoginHref builds path', () => {
    expect(getSsoLoginHref('acme')).toBe('/auth/sso/acme');
  });
});
