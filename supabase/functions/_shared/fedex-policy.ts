/**
 * Politique FedEx Edge : pas de réponses mock en production sauf opt-in explicite.
 */

export function isProductionEnvironment(): boolean {
  const env = (
    Deno.env.get('ENVIRONMENT') ||
    Deno.env.get('VERCEL_ENV') ||
    Deno.env.get('NODE_ENV') ||
    ''
  ).toLowerCase();
  return env === 'production';
}

/**
 * Sandbox par défaut hors production ; en production → API FedEx prod sauf FEDEX_TEST_MODE=true.
 */
export function resolveFedexTestMode(): boolean {
  const explicit = (Deno.env.get('FEDEX_TEST_MODE') || '').toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return !isProductionEnvironment();
}

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
  return !isProductionEnvironment();
}

export function fedexMockDisabledError(): Error {
  return new Error('FEDEX_NOT_CONFIGURED');
}

export type FedexConfigSummary = {
  credentials_present: boolean;
  track_credentials_present: boolean;
  test_mode: boolean;
  mock_allowed: boolean;
  production_environment: boolean;
};

export function getFedexConfigSummary(): FedexConfigSummary {
  return {
    credentials_present: hasFedexApiCredentials(),
    track_credentials_present: hasFedexTrackCredentials(),
    test_mode: resolveFedexTestMode(),
    mock_allowed: allowFedexMockResponses(),
    production_environment: isProductionEnvironment(),
  };
}

/** Probe OAuth FedEx (sans créer d'expédition). */
export async function probeFedexOAuth(): Promise<{
  ok: boolean;
  latency_ms: number;
  message: string | null;
}> {
  const start = Date.now();
  const apiKey = Deno.env.get('FEDEX_API_KEY') || '';
  const apiSecret = Deno.env.get('FEDEX_API_SECRET') || '';

  if (!apiKey || !apiSecret) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      message: 'FEDEX_API_KEY ou FEDEX_API_SECRET manquant',
    };
  }

  const testMode = resolveFedexTestMode();
  const tokenUrl = testMode
    ? 'https://apis-sandbox.fedex.com/oauth/token'
    : 'https://apis.fedex.com/oauth/token';

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret,
      }),
    });

    const latency = Date.now() - start;
    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        latency_ms: latency,
        message: `OAuth HTTP ${response.status}: ${body.slice(0, 200)}`,
      };
    }

    const data = await response.json();
    if (!data?.access_token) {
      return {
        ok: false,
        latency_ms: latency,
        message: 'OAuth sans access_token',
      };
    }

    return {
      ok: true,
      latency_ms: latency,
      message: testMode ? 'sandbox' : 'production',
    };
  } catch (err) {
    return {
      ok: false,
      latency_ms: Date.now() - start,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
