import { describe, it, expect, afterEach, vi } from 'vitest';
import { isPaymentOrchestrationV2Enabled } from '../feature-flags';

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
});
