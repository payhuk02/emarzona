import { describe, it, expect } from 'vitest';
import { stripIntegrationsTree, isIntegrationSecretField } from '../integration-secrets';

describe('integration-secrets', () => {
  it('detects secret field names', () => {
    expect(isIntegrationSecretField('apiKey')).toBe(true);
    expect(isIntegrationSecretField('api_secret')).toBe(true);
    expect(isIntegrationSecretField('enabled')).toBe(false);
  });

  it('strips secrets from integration tree before save', () => {
    const input = {
      geniuspay: { enabled: true, apiKey: 'sk_live_secret', mode: 'sandbox' },
      sentry: { enabled: false, dsn: 'https://sentry.io/xxx' },
    };
    const out = stripIntegrationsTree(input);
    expect(out.geniuspay).toEqual({ enabled: true, mode: 'sandbox' });
    expect((out.sentry as Record<string, unknown>).dsn).toBeUndefined();
  });
});
