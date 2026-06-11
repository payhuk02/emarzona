import { describe, it, expect } from 'vitest';
import { hasPhysicalFeatureAccess, requiredPlanForFeature } from '../physical-plan-capabilities';

describe('physical-plan-capabilities (Epic 3.2.7)', () => {
  it('serial tracking available from Professional', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'serial_tracking.manage')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'serial_tracking.manage')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_premium', 'serial_tracking.manage')).toBe(true);
  });

  it('warehouses available from Professional (quota enforced in DB)', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'warehouses.manage')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'warehouses.manage')).toBe(true);
  });

  it('FedEx live requires Professional', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'shipping.fedex_live')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'shipping.fedex_live')).toBe(true);
  });

  it('WhatsApp product button available from Starter', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'whatsapp.product_button')).toBe(true);
    expect(hasPhysicalFeatureAccess(null, 'whatsapp.product_button')).toBe(false);
  });

  it('email system requires Professional', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'emails.manage')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'emails.manage')).toBe(true);
  });

  it('premium-only features stay on Enterprise', () => {
    expect(hasPhysicalFeatureAccess('physical_standard', 'forecasting.demand')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_premium', 'forecasting.demand')).toBe(true);
    expect(requiredPlanForFeature('forecasting.demand')).toBe('physical_premium');
  });
});
