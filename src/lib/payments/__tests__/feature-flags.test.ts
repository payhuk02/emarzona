import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  getPaymentOrchestrationV2RolloutPercent,
  isMoneyFusionEnabled,
  isMoneyFusionOnlyEnabled,
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

  it('returns 0 rollout when V2 disabled and rollout unset', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'false');
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(0);
  });

  it('returns 100 rollout when V2 enabled and rollout unset (non-prod)', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    vi.stubEnv('VITE_VERCEL_ENV', 'preview');
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(100);
  });

  it('clamps invalid or out-of-range rollout values', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', 'not-a-number');
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(100);

    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '150');
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(100);

    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '-5');
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(0);
  });

  it('accepts alternate true/false env values', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', '1');
    expect(isPaymentOrchestrationV2Enabled()).toBe(true);

    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'yes');
    expect(isPaymentOrchestrationV2Enabled()).toBe(true);

    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', '0');
    expect(isPaymentOrchestrationV2Enabled()).toBe(false);

    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'no');
    expect(isPaymentOrchestrationV2Enabled()).toBe(false);
  });

  it('returns false for unknown explicit env values', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'maybe');
    vi.stubEnv('VITE_VERCEL_ENV', 'preview');
    expect(isPaymentOrchestrationV2Enabled()).toBe(false);
  });

  it('returns true on Vercel production when V2 env unset (P0-1 canary default)', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_VERCEL_ENV', 'production');
    expect(isPaymentOrchestrationV2Enabled()).toBe(true);
    expect(getPaymentOrchestrationV2RolloutPercent()).toBe(10);
  });

  it('returns false when Vercel env is not preview/production and flag unset', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', '');
    vi.stubEnv('VITE_VERCEL_ENV', 'development');
    expect(isPaymentOrchestrationV2Enabled()).toBe(false);
  });

  it('returns false for store rollout when storeId is missing', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'true');
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '50');
    expect(isPaymentOrchestrationV2EnabledForStore(null)).toBe(false);
    expect(isPaymentOrchestrationV2EnabledForStore(undefined)).toBe(false);
  });

  it('returns false for store rollout when V2 is disabled', () => {
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2', 'false');
    vi.stubEnv('VITE_PAYMENT_ORCHESTRATION_V2_ROLLOUT', '100');
    expect(isPaymentOrchestrationV2EnabledForStore('store-abc')).toBe(false);
  });
});

describe('isMoneyFusionEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true when VITE_MONEYFUSION_ENABLED=true', () => {
    vi.stubEnv('VITE_MONEYFUSION_ENABLED', 'true');
    expect(isMoneyFusionEnabled()).toBe(true);
  });

  it('returns false when explicitly disabled', () => {
    vi.stubEnv('VITE_MONEYFUSION_ENABLED', 'false');
    vi.stubEnv('VITE_VERCEL_ENV', 'preview');
    expect(isMoneyFusionEnabled()).toBe(false);
  });

  it('defaults to true on Vercel preview when unset', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_VERCEL_ENV', 'preview');
    expect(isMoneyFusionEnabled()).toBe(true);
  });
});

describe('isMoneyFusionOnlyEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is enabled by default (GeniusPay retiré temporairement)', () => {
    vi.stubEnv('VITE_MONEYFUSION_ONLY', '');
    expect(isMoneyFusionOnlyEnabled()).toBe(true);
  });

  it('enables exclusive MoneyFusion mode explicitly', () => {
    vi.stubEnv('VITE_MONEYFUSION_ONLY', 'true');
    expect(isMoneyFusionOnlyEnabled()).toBe(true);
  });

  it('can be disabled explicitly', () => {
    vi.stubEnv('VITE_MONEYFUSION_ONLY', 'false');
    expect(isMoneyFusionOnlyEnabled()).toBe(false);
  });
});
