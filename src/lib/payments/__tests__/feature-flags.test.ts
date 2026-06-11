import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  getPaymentOrchestrationV2RolloutPercent,
  isPaymentOrchestrationV2Enabled,
  isPaymentOrchestrationV2EnabledForStore,
} from '../feature-flags';

describe('isPaymentOrchestrationV2Enabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when VITE_PAYMENT_ORCHESTRATION_V2=true', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    expect(isPaymentOrchestrationV2Enabled()).toBe(true);
  });

  it('returns false when explicitly disabled', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'false');
    vi.stubEnv('VITE_VERCEL_ENV', 'preview');
    expect(isPaymentOrchestrationV2Enabled()).toBe(false);
  });

  it('returns true on Vercel preview when V2 env unset', () => {
    vi.stubEnv('VITE_VERCEL_ENV', 'preview');
    expect(isPaymentOrchestrationV2Enabled()).toBe(true);
  });

  it('rollout 0 disables V2 for all stores', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '0');
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(0);
    expect(isPaymentOrchestrationV2EnabledForStore('store-abc')).toBe(false);
  });

  it('rollout 100 enables V2 for all stores when flag on', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '100');
    expect(isPaymentOrchestrationV2EnabledForStore('any-store')).toBe(true);
  });

  it('rollout canary is deterministic per storeId', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '50');
    const a = isPaymentOrchestrationV2EnabledForStore('store-canary-a');
    const b = isPaymentOrchestrationV2EnabledForStore('store-canary-a');
    expect(a).toBe(b);
  });
});
