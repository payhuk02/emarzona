import { describe, it, expect } from 'vitest';
import * as orchestrator from '@/lib/payments/orchestrator';

describe('payments orchestrator index', () => {
  it('exports create, resolve and load helpers', () => {
    expect(typeof orchestrator.createOrchestratedPayment).toBe('function');
    expect(typeof orchestrator.resolvePaymentProvider).toBe('function');
    expect(typeof orchestrator.loadStorePaymentConnections).toBe('function');
    expect(typeof orchestrator.loadStoreForcePlatformPayments).toBe('function');
  });
});
