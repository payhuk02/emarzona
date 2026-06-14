/**
 * Epic 4.3 — Mapping groupes IdP → rôles équipe boutique
 */

export type StoreTeamRole = 'manager' | 'staff' | 'support' | 'viewer';

const VALID_ROLES = new Set<StoreTeamRole>(['manager', 'staff', 'support', 'viewer']);

export function mapIdpGroupsToRole(
  groups: string[],
  roleMappings: Record<string, string>,
  defaultRole: StoreTeamRole = 'staff'
): StoreTeamRole {
  for (const group of groups) {
    const mapped = roleMappings[group];
    if (mapped && VALID_ROLES.has(mapped as StoreTeamRole)) {
      return mapped as StoreTeamRole;
    }
  }
  return defaultRole;
}

export function isEmailDomainAllowed(email: string, allowedDomains: string[]): boolean {
  if (!allowedDomains?.length) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.some(d => d.toLowerCase().trim() === domain);
}

export function buildOidcAuthorizeUrl(params: {
  issuerUrl: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  scopes?: string;
}): string {
  const issuer = params.issuerUrl.replace(/\/$/, '');
  const authBase = issuer.includes('/oauth2/') ? issuer : `${issuer}/oauth2/v2.0/authorize`;
  const authEndpoint = issuer.endsWith('/authorize')
    ? issuer
    : authBase.includes('authorize')
      ? authBase
      : `${issuer}/authorize`;

  const scope = params.scopes || 'openid email profile';
  const qs = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope,
    state: params.state,
    nonce: params.nonce,
  });

  return `${authEndpoint}?${qs.toString()}`;
}

export function buildStoreSsoLoginPath(storeSlug: string): string {
  return `/auth/sso/${encodeURIComponent(storeSlug)}`;
}
