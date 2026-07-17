import { describe, expect, it } from 'vitest';
import { resolveDashboardShellView } from '../dashboard-onboarding-guard';

describe('resolveDashboardShellView', () => {
  it('shows onboarding only when no stores confirmed', () => {
    expect(
      resolveDashboardShellView({
        contextLoading: false,
        storeLoading: false,
        hasStores: false,
        storesCount: 0,
        store: null,
      })
    ).toBe('onboarding');
  });

  it('shows skeleton while resolving store when stores exist', () => {
    expect(
      resolveDashboardShellView({
        contextLoading: false,
        storeLoading: true,
        hasStores: true,
        storesCount: 1,
        store: null,
      })
    ).toBe('skeleton');
  });

  it('does not flash onboarding when stores list is populated', () => {
    expect(
      resolveDashboardShellView({
        contextLoading: false,
        storeLoading: false,
        hasStores: false,
        storesCount: 2,
        store: null,
      })
    ).toBe('skeleton');
  });

  it('shows dashboard when store is resolved', () => {
    expect(
      resolveDashboardShellView({
        contextLoading: false,
        storeLoading: false,
        hasStores: true,
        storesCount: 1,
        store: { id: 'store-1' },
      })
    ).toBe('dashboard');
  });
});
