import { describe, it, expect } from 'vitest';
import {
  buildOidcAuthorizeUrl,
  buildStoreSsoLoginPath,
  isEmailDomainAllowed,
  mapIdpGroupsToRole,
} from '../store-sso';

describe('store-sso (Epic 4.3)', () => {
  it('mapIdpGroupsToRole priorise le premier mapping', () => {
    expect(
      mapIdpGroupsToRole(['emarzona-viewers', 'emarzona-managers'], {
        'emarzona-managers': 'manager',
        'emarzona-viewers': 'viewer',
      })
    ).toBe('viewer');
  });

  it('mapIdpGroupsToRole fallback default', () => {
    expect(mapIdpGroupsToRole(['unknown'], {}, 'support')).toBe('support');
  });

  it('isEmailDomainAllowed filtre domaines', () => {
    expect(isEmailDomainAllowed('a@acme.com', ['acme.com'])).toBe(true);
    expect(isEmailDomainAllowed('a@gmail.com', ['acme.com'])).toBe(false);
    expect(isEmailDomainAllowed('a@any.com', [])).toBe(true);
  });

  it('buildOidcAuthorizeUrl contient state et nonce', () => {
    const url = buildOidcAuthorizeUrl({
      issuerUrl: 'https://login.microsoftonline.com/tenant/v2.0',
      clientId: 'client-id',
      redirectUri: 'https://x/callback',
      state: 'st',
      nonce: 'nc',
    });
    expect(url).toContain('state=st');
    expect(url).toContain('nonce=nc');
    expect(url).toContain('client_id=client-id');
  });

  it('buildStoreSsoLoginPath encode slug', () => {
    expect(buildStoreSsoLoginPath('ma-boutique')).toBe('/auth/sso/ma-boutique');
  });
});
