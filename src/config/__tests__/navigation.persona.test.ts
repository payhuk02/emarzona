import { describe, expect, it } from 'vitest';
import {
  detectPersonaFromPath,
  resolveNavPersona,
  toCommerceNavPersona,
} from '@/config/navigation.persona';

describe('resolveNavPersona', () => {
  it('keeps seller chrome on marketplace when seller is pinned', () => {
    expect(resolveNavPersona('/marketplace', false, 'seller')).toBe('seller');
    expect(resolveNavPersona('/auctions', false, 'seller')).toBe('seller');
  });

  it('forces buyer on account; seller zone overrides buyer pin', () => {
    expect(resolveNavPersona('/account', false, 'seller')).toBe('buyer');
    expect(resolveNavPersona('/dashboard', false, 'buyer')).toBe('seller');
    expect(resolveNavPersona('/admin', true, 'buyer')).toBe('admin');
  });

  it('discovery without seller pin defaults to buyer', () => {
    expect(resolveNavPersona('/marketplace', false, null)).toBe('buyer');
    expect(resolveNavPersona('/marketplace', false, 'buyer')).toBe('buyer');
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
