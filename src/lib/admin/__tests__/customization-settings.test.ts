import { describe, expect, it } from 'vitest';
import { stripFinancialSettingsFromCustomizationSettings } from '@/lib/admin/customization-settings';

describe('stripFinancialSettingsFromCustomizationSettings', () => {
  it('removes commissions and withdrawals from settings JSON', () => {
    const result = stripFinancialSettingsFromCustomizationSettings({
      commissions: { platformRate: 10, referralRate: 2 },
      withdrawals: { minAmount: 5000, autoApprove: true },
      limits: { maxProducts: 100, maxStores: 5 },
    });

    expect(result).toEqual({
      limits: { maxProducts: 100, maxStores: 5 },
    });
  });

  it('returns empty object for undefined input', () => {
    expect(stripFinancialSettingsFromCustomizationSettings(undefined)).toEqual({});
  });
});
