import { describe, expect, it } from 'vitest';
import {
  guessWithdrawMode,
  inferCountryCodeFromPhone,
  normalizeMoneyFusionCountryCode,
  normalizeWithdrawPhone,
} from '../../../../supabase/functions/_shared/moneyfusion-withdraw-mode.ts';

describe('MoneyFusion withdraw mode fallback', () => {
  it('maps Guinea Orange Money to orange-gn', () => {
    expect(guessWithdrawMode('orange_money', 'gn')).toBe('orange-gn');
    expect(guessWithdrawMode('orange_money', 'GN')).toBe('orange-gn');
    expect(guessWithdrawMode('orange_money', 'Guinée')).toBe('orange-gn');
    expect(guessWithdrawMode('mtn_mobile_money', 'gn')).toBe('mtn-gn');
  });

  it('infers gn from +224 and strips the prefix', () => {
    expect(inferCountryCodeFromPhone('+224 621 00 00 00')).toBe('gn');
    expect(normalizeWithdrawPhone('+224621000000')).toBe('621000000');
  });

  it('normalizes Guinea aliases to gn', () => {
    expect(normalizeMoneyFusionCountryCode('GIN')).toBe('gn');
    expect(normalizeMoneyFusionCountryCode('Guinea Conakry')).toBe('gn');
  });
});
