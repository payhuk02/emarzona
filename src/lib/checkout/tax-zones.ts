/**
 * Routage taxes checkout — UEMOA (RPC local) vs Stripe Tax (international).
 * Phase 2.6 — conformité fiscale UE/US sans fallback 18 % global.
 */

/** Pays UEMOA / Afrique de l'Ouest — taux dans tax_configurations (RPC). */
export const UEMOA_TAX_COUNTRIES = new Set(['BF', 'BJ', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG']);

/** Pays couverts par Stripe Tax (UE, US, UK, etc.). */
export const STRIPE_TAX_COUNTRIES = new Set([
  'AT',
  'AU',
  'BE',
  'BG',
  'CA',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'FR',
  'GB',
  'GR',
  'HR',
  'HU',
  'IE',
  'IT',
  'JP',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'NO',
  'NZ',
  'PL',
  'PT',
  'RO',
  'SE',
  'SG',
  'SI',
  'SK',
  'US',
  'AE',
]);

export function normalizeCountryCode(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase();
}

export function shouldUseStripeTax(countryCode: string): boolean {
  const cc = normalizeCountryCode(countryCode);
  if (!cc || UEMOA_TAX_COUNTRIES.has(cc)) return false;
  return STRIPE_TAX_COUNTRIES.has(cc);
}

export function shouldUseLocalTaxRpc(countryCode: string): boolean {
  const cc = normalizeCountryCode(countryCode);
  return UEMOA_TAX_COUNTRIES.has(cc);
}
