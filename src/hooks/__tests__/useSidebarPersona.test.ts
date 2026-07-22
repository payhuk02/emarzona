import { describe, expect, it } from 'vitest';
import { detectPersonaFromPath } from '@/hooks/useSidebarPersona';

describe('detectPersonaFromPath', () => {
  it('detects buyer on account and discovery routes', () => {
    expect(detectPersonaFromPath('/account', false)).toBe('buyer');
    expect(detectPersonaFromPath('/account/orders', false)).toBe('buyer');
    expect(detectPersonaFromPath('/cart', false)).toBe('seller');
    expect(detectPersonaFromPath('/marketplace', false)).toBe('buyer');
    expect(detectPersonaFromPath('/auctions', false)).toBe('buyer');
    expect(detectPersonaFromPath('/auctions/lot-1', false)).toBe('buyer');
    expect(detectPersonaFromPath('/recommendations', false)).toBe('buyer');
  });

  it('detects seller on dashboard routes', () => {
    expect(detectPersonaFromPath('/dashboard', false)).toBe('seller');
    expect(detectPersonaFromPath('/dashboard/products', false)).toBe('seller');
  });

  it('detects admin on admin routes when user is admin', () => {
    expect(detectPersonaFromPath('/admin', true)).toBe('admin');
    expect(detectPersonaFromPath('/admin/users', true)).toBe('admin');
    expect(detectPersonaFromPath('/admin', false)).toBe('seller');
  });
});
