import { describe, expect, it } from 'vitest';
import { canAccessAdminPath, getAdminRouteAccess } from '@/lib/admin/admin-route-permissions';

describe('admin-route-permissions', () => {
  const can = (key: string) => key === 'analytics.view';

  it('allows dashboard for any admin', () => {
    expect(canAccessAdminPath('/admin', can, false)).toBe(true);
  });

  it('blocks users.manage without permission', () => {
    expect(canAccessAdminPath('/admin/users', can, false)).toBe(false);
  });

  it('allows stores with analytics.view', () => {
    expect(canAccessAdminPath('/admin/stores', can, false)).toBe(true);
  });

  it('super admin bypasses all routes', () => {
    expect(canAccessAdminPath('/admin/settings', can, true)).toBe(true);
  });

  it('unknown admin routes require super admin', () => {
    const access = getAdminRouteAccess('/admin/unknown-section');
    expect(access?.superAdminOnly).toBe(true);
    expect(canAccessAdminPath('/admin/unknown-section', can, false)).toBe(false);
  });

  it('security route is open to all admin roles', () => {
    expect(getAdminRouteAccess('/admin/security')?.permissions).toBeUndefined();
    expect(canAccessAdminPath('/admin/security', can, false)).toBe(true);
  });
});
