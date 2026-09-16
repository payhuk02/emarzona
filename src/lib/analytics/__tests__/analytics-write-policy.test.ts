import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe('analytics-write-policy (LOT B)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('skips visitor Postgres writes when PostHog is configured', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test_token_for_unit_tests_xxxxx');
    vi.stubEnv('VITE_POSTHOG_ENABLED', 'true');
    const { shouldWriteVisitorEventsToSupabase } =
      await import('@/lib/analytics/analytics-write-policy');
    expect(shouldWriteVisitorEventsToSupabase()).toBe(false);
  });

  it('forces visitor Postgres writes when VITE_SUPABASE_ANALYTICS_VISITOR_WRITES=true', async () => {
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test_token_for_unit_tests_xxxxx');
    vi.stubEnv('VITE_POSTHOG_ENABLED', 'true');
    vi.stubEnv('VITE_SUPABASE_ANALYTICS_VISITOR_WRITES', 'true');
    const { shouldWriteVisitorEventsToSupabase } =
      await import('@/lib/analytics/analytics-write-policy');
    expect(shouldWriteVisitorEventsToSupabase()).toBe(true);
  });

  it('keeps visitor Postgres writes when PostHog is off', async () => {
    vi.stubEnv('VITE_POSTHOG_ENABLED', 'false');
    const { shouldWriteVisitorEventsToSupabase } =
      await import('@/lib/analytics/analytics-write-policy');
    expect(shouldWriteVisitorEventsToSupabase()).toBe(true);
  });

  it('product/store writes default on and respect false kill-switch', async () => {
    const mod = await import('@/lib/analytics/analytics-write-policy');
    expect(mod.shouldWriteProductEventsToSupabase()).toBe(true);
    expect(mod.shouldWriteStoreEventsToSupabase()).toBe(true);

    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_ANALYTICS_PRODUCT_WRITES', 'false');
    vi.stubEnv('VITE_SUPABASE_ANALYTICS_STORE_WRITES', 'false');
    const mod2 = await import('@/lib/analytics/analytics-write-policy');
    expect(mod2.shouldWriteProductEventsToSupabase()).toBe(false);
    expect(mod2.shouldWriteStoreEventsToSupabase()).toBe(false);
  });
});
