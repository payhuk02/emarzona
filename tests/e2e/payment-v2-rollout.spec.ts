/**
 * E2E Payment V2 — rollout canary (contrat runtime)
 *
 * Les tests Vitest (`src/lib/payments/__tests__/feature-flags.test.ts`) couvrent
 * les combinaisons d'env. Ici : invariants runtime (déterminisme, bornes).
 *
 * npx playwright test tests/e2e/payment-v2-rollout.spec.ts
 */

import { test, expect } from '@playwright/test';
import {
  getPaymentOrchestrationV2RolloutPercent,
  isPaymentOrchestrationV2Enabled,
  isPaymentOrchestrationV2EnabledForStore,
} from '../../src/lib/payments/feature-flags';

test.describe('Payment V2 rollout canary — invariants', () => {
  test('rollout percent is between 0 and 100', () => {
    const percent = getPaymentOrchestrationV2RolloutPercent();
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });

  test('store bucket decision is deterministic', () => {
    test.skip(!isPaymentOrchestrationV2Enabled(), 'V2 non activé dans cet environnement');

    const storeId = 'e2e-rollout-canary-store-001';
    expect(isPaymentOrchestrationV2EnabledForStore(storeId)).toBe(
      isPaymentOrchestrationV2EnabledForStore(storeId)
    );
  });

  test('rollout 100 % implies all stores enabled when V2 on', () => {
    test.skip(!isPaymentOrchestrationV2Enabled(), 'V2 non activé');
    test.skip(getPaymentOrchestrationV2RolloutPercent() < 100, 'Rollout < 100 %');

    expect(isPaymentOrchestrationV2EnabledForStore('any-store-id')).toBe(true);
  });

  test('rollout 0 % disables all stores even when V2 flag on', () => {
    test.skip(!isPaymentOrchestrationV2Enabled(), 'V2 non activé');
    test.skip(getPaymentOrchestrationV2RolloutPercent() > 0, 'Rollout > 0 %');

    expect(isPaymentOrchestrationV2EnabledForStore('any-store-id')).toBe(false);
  });

  test('missing storeId is false when rollout < 100', () => {
    test.skip(getPaymentOrchestrationV2RolloutPercent() >= 100, 'Rollout à 100 %');

    expect(isPaymentOrchestrationV2EnabledForStore(null)).toBe(false);
    expect(isPaymentOrchestrationV2EnabledForStore(undefined)).toBe(false);
  });
});
