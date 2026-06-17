import type { Page, TestInfo } from '@playwright/test';

const PROBE_TAG = '[e2e-supabase-probe]';

export type CapturedSupabaseProbe = Record<string, unknown>;

/** Écoute les logs console `[e2e-supabase-probe]` émis par l'app React. */
export function attachSupabaseProbeListener(
  page: Page,
  testInfo: TestInfo
): {
  getLatestProbe: () => CapturedSupabaseProbe | null;
  runProbe: () => Promise<CapturedSupabaseProbe | null>;
} {
  let latestProbe: CapturedSupabaseProbe | null = null;

  page.on('console', message => {
    const text = message.text();
    if (!text.includes(PROBE_TAG)) return;

    const jsonStart = text.indexOf('{');
    if (jsonStart === -1) return;

    try {
      latestProbe = JSON.parse(text.slice(jsonStart)) as CapturedSupabaseProbe;
      testInfo.attach('supabase-runtime-probe', {
        body: JSON.stringify(latestProbe, null, 2),
        contentType: 'application/json',
      });
    } catch {
      testInfo.attach('supabase-runtime-probe-raw', {
        body: text,
        contentType: 'text/plain',
      });
    }
  });

  async function runProbe(): Promise<CapturedSupabaseProbe | null> {
    const probe = await page.evaluate(async () => {
      const fn = window.__e2eSupabaseProbe;
      if (!fn) return null;
      return (await fn()) as CapturedSupabaseProbe;
    });
    if (probe) {
      latestProbe = probe;
      testInfo.attach('supabase-runtime-probe-eval', {
        body: JSON.stringify(probe, null, 2),
        contentType: 'application/json',
      });
    }
    return probe;
  }

  return {
    getLatestProbe: () => latestProbe,
    runProbe,
  };
}

export function formatSupabaseProbeSummary(probe: CapturedSupabaseProbe | null): string {
  if (!probe) return 'probe=missing';
  return [
    `envKey=${probe.keyPrefix}(${probe.keyKind}) via ${probe.effectiveKeySource ?? '?'}`,
    `anonLen=${probe.rawAnonEnvLength} pubLen=${probe.rawPublishableEnvLength}`,
    `clientKey=${probe.clientKeyPrefix}(${probe.clientKeyKind}) match=${probe.envKeyMatchesClient ?? '?'}`,
    `rest=${probe.restPingStatus}`,
    `productsErr=${probe.productsSlugQueryError ?? 'none'}`,
    `authUser=${probe.authUserId ?? 'none'}`,
  ].join(' | ');
}
