import { describe, expect, it } from 'vitest';
import { isPlatformAdminRoute } from '@/components/seller/StoreScopedPageShell';

describe('StoreScopedPageShell', () => {
  it('distingue routes admin plateforme et dashboard vendeur', () => {
    expect(isPlatformAdminRoute('/admin/integrations')).toBe(true);
    expect(isPlatformAdminRoute('/admin/loyalty')).toBe(true);
    expect(isPlatformAdminRoute('/dashboard/integrations')).toBe(false);
    expect(isPlatformAdminRoute('/dashboard/physical-inventory')).toBe(false);
  });
});

describe('DashboardLayout', () => {
  it('délègue au shell store-scoped', async () => {
    const { DashboardLayout } = await import('@/components/layout/DashboardLayout');
    expect(DashboardLayout).toBeDefined();
  });
});
