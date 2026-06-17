import { describe, expect, it, vi, afterEach } from 'vitest';
import { resolveOrderNumber } from '../resolve-order-number';

describe('resolveOrderNumber', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('utilise la valeur RPC quand elle est présente', () => {
    expect(resolveOrderNumber('ORD-20260617-ABC123', null)).toBe('ORD-20260617-ABC123');
  });

  it('fallback ORD-* hors E2E quand RPC échoue', () => {
    vi.stubEnv('DEV', 'true');
    vi.stubEnv('VITE_E2E_PAYMENT_STUB', 'false');
    const num = resolveOrderNumber(null, new Error('rpc'));
    expect(num).toMatch(/^ORD-\d+$/);
  });

  it('fallback TEST-ORDER-* en mode E2E stub', () => {
    vi.stubEnv('DEV', 'true');
    vi.stubEnv('VITE_E2E_PAYMENT_STUB', 'true');
    const num = resolveOrderNumber(null, new Error('rpc'));
    expect(num).toMatch(/^TEST-ORDER-\d+$/);
  });

  it('ajoute un suffixe optionnel au fallback', () => {
    vi.stubEnv('DEV', 'true');
    vi.stubEnv('VITE_E2E_PAYMENT_STUB', 'false');
    const num = resolveOrderNumber('', new Error('rpc'), { suffix: 'store1' });
    expect(num).toMatch(/^ORD-\d+-store1$/);
  });
});
