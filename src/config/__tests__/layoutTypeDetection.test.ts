import { describe, expect, it } from 'vitest';
import { detectLayoutType, LAYOUT_TYPE_RULES } from '@/config/layoutTypeDetection';

describe('detectLayoutType', () => {
  it('returns default for dashboard root', () => {
    expect(detectLayoutType('/dashboard')).toBe('default');
  });

  it('detects context sidebars by path', () => {
    expect(detectLayoutType('/dashboard/settings')).toBe('settings');
    expect(detectLayoutType('/dashboard/orders')).toBe('orders');
    expect(detectLayoutType('/dashboard/emails/campaigns')).toBe('emails');
    expect(detectLayoutType('/affiliate/dashboard')).toBe('affiliate');
  });

  it('prefers physical-portal for buyer account paths only', () => {
    expect(detectLayoutType('/account/physical')).toBe('physical-portal');
    expect(detectLayoutType('/account/physical/orders')).toBe('physical-portal');
  });

  it('routes seller physical inventory to inventory, not physical-portal', () => {
    expect(detectLayoutType('/dashboard/physical-inventory')).toBe('inventory');
    expect(detectLayoutType('/dashboard/physical-lots')).toBe('inventory');
  });

  it('routes seller digital pages to products when not buyer portal', () => {
    expect(detectLayoutType('/dashboard/digital-products')).toBe('products');
    expect(detectLayoutType('/dashboard/my-downloads')).toBe('products');
  });

  it('routes buyer digital portal paths correctly', () => {
    expect(detectLayoutType('/account/digital')).toBe('digital-portal');
    expect(detectLayoutType('/account/downloads')).toBe('digital-portal');
  });

  it('detects finance vs orders', () => {
    expect(detectLayoutType('/dashboard/payments')).toBe('finance');
    expect(detectLayoutType('/dashboard/payment-methods')).toBe('finance');
    expect(detectLayoutType('/dashboard/orders')).toBe('orders');
  });

  it('detects sales logistics paths', () => {
    expect(detectLayoutType('/dashboard/suppliers')).toBe('sales');
    expect(detectLayoutType('/dashboard/product-kits')).toBe('sales');
  });

  it('has unique priorities per rule', () => {
    const priorities = LAYOUT_TYPE_RULES.map(r => r.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });
});
