import { describe, it, expect } from 'vitest';
import { hasPhysicalFeatureAccess, requiredPlanForFeature } from '../physical-plan-capabilities';

describe('physical-plan-capabilities (Epic 3.2.7)', () => {
  it('team.sso requires physical_premium', () => {
    expect(hasPhysicalFeatureAccess('physical_premium', 'team.sso')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_standard', 'team.sso')).toBe(false);
  });

  it('serial tracking available from Professional', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'serial_tracking.manage')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'serial_tracking.manage')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_premium', 'serial_tracking.manage')).toBe(true);
  });

  it('local africa shipping available from Professional', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'shipping.local_africa')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'shipping.local_africa')).toBe(true);
    expect(requiredPlanForFeature('shipping.local_africa')).toBe('physical_standard');
  });

  it('warehouses available from Business only', () => {
    expect(hasPhysicalFeatureAccess('physical_basic', 'warehouses.manage')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_standard', 'warehouses.manage')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_premium', 'warehouses.manage')).toBe(true);
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

  it('premium-only features stay on Business', () => {
    expect(hasPhysicalFeatureAccess('physical_standard', 'forecasting.demand')).toBe(false);
    expect(hasPhysicalFeatureAccess('physical_premium', 'forecasting.demand')).toBe(true);
    expect(requiredPlanForFeature('forecasting.demand')).toBe('physical_premium');
  });

  it('audit.export requires physical_premium (Epic 4.4)', () => {
    expect(hasPhysicalFeatureAccess('physical_premium', 'audit.export')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_standard', 'audit.export')).toBe(false);
  });

  it('api.public available from physical_standard (Epic 4.6)', () => {
    expect(hasPhysicalFeatureAccess('physical_standard', 'api.public')).toBe(true);
    expect(hasPhysicalFeatureAccess('physical_basic', 'api.public')).toBe(false);
  });
});
