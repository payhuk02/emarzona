import { describe, it, expect } from 'vitest';
import { sanitizeSentryEvent } from '@/lib/sentry-pii';

describe('sanitizeSentryEvent (Epic 4.8)', () => {
  it('redacts email and secrets from exception messages', () => {
    const event = sanitizeSentryEvent({
      exception: {
        values: [{ value: 'Payment failed for buyer@acme.com token Bearer pk_live_abc123' }],
      },
      user: { email: 'admin@emarzona.com', ip_address: '203.0.113.1' },
      extra: { api_key: 'secret-value' },
    });

    const ex = event.exception as { values: Array<{ value: string }> };
    expect(ex.values[0].value).toContain('[email-redacted]');
    expect(ex.values[0].value).not.toContain('buyer@acme.com');
    expect((event.user as { email: string }).email).toBe('[email-redacted]');
    expect((event.extra as { api_key: string }).api_key).toBe('[redacted]');
  });
});
