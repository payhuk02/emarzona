import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('posthog-js', () => {
  const posthog = {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
  };
  return { default: posthog };
});

describe('posthog dual-write helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test_token_for_unit_tests_xxxxx');
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://eu.i.posthog.com');
    vi.stubEnv('VITE_POSTHOG_ENABLED', 'true');
  });

  it('captures product_viewed via dualWriteProductAnalytics', async () => {
    const posthog = (await import('posthog-js')).default;
    const { initPostHog } = await import('@/lib/analytics/posthog');
    initPostHog();
    const { dualWriteProductAnalytics } = await import('@/lib/analytics/posthog-dual-write');
    dualWriteProductAnalytics({
      eventType: 'view',
      productId: 'p1',
      storeId: 's1',
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      'product_viewed',
      expect.objectContaining({ product_id: 'p1', store_id: 's1' })
    );
  });

  it('skips blocked secret props', async () => {
    const posthog = (await import('posthog-js')).default;
    const { initPostHog, capturePostHogEvent } = await import('@/lib/analytics/posthog');
    initPostHog();
    capturePostHogEvent('test_event', { password: 'x', token: 'y', safe: 'ok' });
    expect(posthog.capture).toHaveBeenCalledWith(
      'test_event',
      expect.objectContaining({ safe: 'ok' })
    );
    const props = (posthog.capture as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[1] as Record<
      string,
      unknown
    >;
    expect(props).not.toHaveProperty('password');
    expect(props).not.toHaveProperty('token');
  });
});
