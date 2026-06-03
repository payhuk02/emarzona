import { describe, it, expect, afterEach } from 'vitest';
import { assertFedexResponseNotMock, FedexUnavailableError } from '../fedex-policy';

describe('fedex-policy', () => {
  const prevProd = import.meta.env.PROD;
  const prevAllow = import.meta.env.VITE_FEDEX_ALLOW_MOCK;

  afterEach(() => {
    import.meta.env.PROD = prevProd;
    import.meta.env.VITE_FEDEX_ALLOW_MOCK = prevAllow;
  });

  it('allows mock in non-prod builds', () => {
    import.meta.env.PROD = false;
    import.meta.env.VITE_FEDEX_ALLOW_MOCK = undefined;
    expect(() => assertFedexResponseNotMock('mock')).not.toThrow();
  });

  it('rejects mock in prod unless VITE_FEDEX_ALLOW_MOCK=true', () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_FEDEX_ALLOW_MOCK = undefined;
    expect(() => assertFedexResponseNotMock('mock')).toThrow(FedexUnavailableError);
  });

  it('allows mock in prod when explicitly opted in', () => {
    import.meta.env.PROD = true;
    import.meta.env.VITE_FEDEX_ALLOW_MOCK = 'true';
    expect(() => assertFedexResponseNotMock('mock')).not.toThrow();
  });
});
