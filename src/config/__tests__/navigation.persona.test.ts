import { describe, expect, it } from 'vitest';
import {
  detectPersonaFromPath,
  resolveNavPersona,
  toCommerceNavPersona,
} from '@/config/navigation.persona';

describe('resolveNavPersona', () => {
  it('buyer/seller/admin zones follow path over pin', () => {
    expect(resolveNavPersona('/marketplace', false, 'seller')).toBe('buyer');
    expect(resolveNavPersona('/account', false, 'seller')).toBe('buyer');
    expect(resolveNavPersona('/dashboard', false, 'buyer')).toBe('seller');
    expect(resolveNavPersona('/admin', true, 'buyer')).toBe('admin');
  });

  it('shared routes use pin when present', () => {
    expect(resolveNavPersona('/notifications', false, 'buyer')).toBe('buyer');
    expect(resolveNavPersona('/notifications', false, 'seller')).toBe('seller');
    expect(resolveNavPersona('/settings/notifications', false, null)).toBe('seller');
  });

  it('maps admin commerce persona to seller', () => {
    expect(toCommerceNavPersona('admin')).toBe('seller');
    expect(toCommerceNavPersona('buyer')).toBe('buyer');
    expect(toCommerceNavPersona('seller')).toBe('seller');
  });

  it('detectPersonaFromPath stays aligned', () => {
    expect(detectPersonaFromPath('/cart', false)).toBe('seller');
    expect(detectPersonaFromPath('/marketplace', false)).toBe('buyer');
  });
});
