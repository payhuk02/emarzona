import { describe, expect, it } from 'vitest';
import {
  assertSafeE2ESupabaseUrl,
  DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF,
  extractSupabaseProjectRef,
  isProductionSupabaseUrl,
  resolveE2ESupabaseUrl,
} from '../../../../tests/e2e/helpers/e2e-supabase-guard';

describe('E2E Supabase guard (Phase 0.5)', () => {
  const prodUrl = `https://${DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`;
  const testUrl = 'https://abcdefghijklmnop.supabase.co';

  it('extracts project ref from Supabase URL', () => {
    expect(extractSupabaseProjectRef(prodUrl)).toBe(DEFAULT_PRODUCTION_SUPABASE_PROJECT_REF);
    expect(extractSupabaseProjectRef(`${testUrl}/`)).toBe('abcdefghijklmnop');
    expect(extractSupabaseProjectRef('not-a-url')).toBeNull();
  });

  it('blocks production URL for destructive E2E', () => {
    expect(isProductionSupabaseUrl(prodUrl)).toBe(true);
    expect(isProductionSupabaseUrl(testUrl)).toBe(false);
  });

  it('throws when asserting safe URL against production', () => {
    expect(() => assertSafeE2ESupabaseUrl(prodUrl, 'test')).toThrow(/production/i);
    expect(() => assertSafeE2ESupabaseUrl(testUrl, 'test')).not.toThrow();
  });

  it('prefers VITE_SUPABASE_TEST_URL in resolveE2ESupabaseUrl', () => {
    const prev = process.env.VITE_SUPABASE_TEST_URL;
    process.env.VITE_SUPABASE_TEST_URL = testUrl;
    expect(resolveE2ESupabaseUrl()).toBe(testUrl);
    if (prev === undefined) delete process.env.VITE_SUPABASE_TEST_URL;
    else process.env.VITE_SUPABASE_TEST_URL = prev;
  });
});
