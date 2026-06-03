/**
 * Politique FedEx Edge : pas de réponses mock en production sauf opt-in explicite.
 */

export function hasFedexApiCredentials(): boolean {
  return Boolean(
    Deno.env.get('FEDEX_API_KEY') &&
    Deno.env.get('FEDEX_API_SECRET') &&
    Deno.env.get('FEDEX_ACCOUNT_NUMBER')
  );
}

export function hasFedexTrackCredentials(): boolean {
  return Boolean(Deno.env.get('FEDEX_API_KEY') && Deno.env.get('FEDEX_API_SECRET'));
}

/** Mock autorisé en dev/staging ; en prod uniquement si FEDEX_ALLOW_MOCK=true */
export function allowFedexMockResponses(): boolean {
  const explicit = (Deno.env.get('FEDEX_ALLOW_MOCK') || '').toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;

  const env = (
    Deno.env.get('ENVIRONMENT') ||
    Deno.env.get('VERCEL_ENV') ||
    Deno.env.get('NODE_ENV') ||
    ''
  ).toLowerCase();

  return env !== 'production';
}

export function fedexMockDisabledError(): Error {
  return new Error('FEDEX_NOT_CONFIGURED');
}
