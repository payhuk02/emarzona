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
  });
});
