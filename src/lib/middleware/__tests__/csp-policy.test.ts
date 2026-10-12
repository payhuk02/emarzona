import { describe, it, expect } from 'vitest';
import { buildCspHeader, generateCspNonce, injectScriptNonces } from '@/lib/middleware/csp-policy';

describe('csp-policy', () => {
  it('generates nonce and injects on script tags', () => {
    const nonce = generateCspNonce();
    expect(nonce.length).toBeGreaterThan(8);
    const html = '<html><head><script>const x=1</script></head></html>';
    const out = injectScriptNonces(html, nonce);
    expect(out).toContain(`nonce="${nonce}"`);
  });

  it('buildCspHeader includes nonce and strict-dynamic', () => {
    const header = buildCspHeader('test-nonce-abc');
    expect(header).toContain("'nonce-test-nonce-abc'");
    expect(header).toContain("'strict-dynamic'");
    expect(header).toContain('https://*.i.posthog.com');
    expect(header).toContain('https://*.posthog.com');
  });

  it('connect-src allows self (covers /cdn-cgi challenge same-origin)', () => {
    const header = buildCspHeader('n');
    expect(header).toMatch(/connect-src[^;]*'self'/);
  });

  it('media-src allows blob and Supabase for contact voice playback', () => {
    const header = buildCspHeader('n');
    expect(header).toMatch(/media-src[^;]*'self'/);
    expect(header).toMatch(/media-src[^;]*blob:/);
    expect(header).toMatch(/media-src[^;]*https:\/\/\*\.supabase\.co/);
  });
});
