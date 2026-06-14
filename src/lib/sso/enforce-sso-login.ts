/**
 * Epic 4.3 — Enforcement SSO sur login mot de passe
 */

import { supabase } from '@/integrations/supabase/client';
import { buildStoreSsoLoginPath } from './store-sso';

export interface SsoEnforcementResult {
  enforced: boolean;
  store_slug?: string;
  store_name?: string;
  idp_display_name?: string;
}

export async function checkEmailSsoEnforcement(email: string): Promise<SsoEnforcementResult> {
  const { data, error } = await supabase.rpc('check_email_sso_enforcement', {
    p_email: email.trim().toLowerCase(),
  });
  if (error) throw error;
  return (data as SsoEnforcementResult) ?? { enforced: false };
}

export const SSO_ERROR_MESSAGES: Record<string, string> = {
  domain_not_allowed: 'Votre domaine email n’est pas autorisé pour cette boutique.',
  invalid_state: 'Session SSO expirée. Réessayez.',
  invalid_provider: 'Configuration SSO invalide.',
  access_denied: 'Accès refusé par votre organisation.',
};

export function resolveSsoErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return SSO_ERROR_MESSAGES[code] ?? `Erreur SSO (${code})`;
}

export function getSsoLoginHref(storeSlug: string): string {
  return buildStoreSsoLoginPath(storeSlug);
}
