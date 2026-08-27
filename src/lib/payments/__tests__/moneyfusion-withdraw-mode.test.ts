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

  it('maps BF without inventing Wave Burkina', () => {
    expect(guessWithdrawMode('orange_money', 'bf')).toBe('orange-money-burkina');
    expect(guessWithdrawMode('moov_money', 'BF')).toBe('moov-burkina-faso');
    expect(guessWithdrawMode('wave', 'bf')).toBeNull();
  });

  it('maps Senegal Free Money and Togo Moov', () => {
    expect(guessWithdrawMode('free_money', 'sn')).toBe('free-money-senegal');
    expect(guessWithdrawMode('moov_money', 'tg')).toBe('moov-togo');
    expect(guessWithdrawMode('mtn_mobile_money', 'ne')).toBe('mtn-ne');
    expect(guessWithdrawMode('airtel_money', 'cd')).toBe('airtel-money-cd');
  });

  it('maps East Africa M-Pesa / Airtel', () => {
    expect(guessWithdrawMode('m_pesa', 'ke')).toBe('m-pesa-ke');
    expect(guessWithdrawMode('m_pesa', 'tz')).toBe('m-pesa-tz');
    expect(guessWithdrawMode('airtel_money', 'tz')).toBe('airtel-money-tz');
  });

  it('still accepts an already-resolved MF withdraw_mode key', () => {
    expect(guessWithdrawMode('mtn-ci', 'ci')).toBe('mtn-ci');
    expect(guessWithdrawMode('orange-money-burkina', 'bf')).toBe('orange-money-burkina');
    expect(guessWithdrawMode('moov-togo', 'tg')).toBe('moov-togo');
  });

  it('infers gn from +224 and strips the prefix', () => {
    expect(inferCountryCodeFromPhone('+224 621 00 00 00')).toBe('gn');
    expect(normalizeWithdrawPhone('+224621000000')).toBe('621000000');
  });

  it('infers and strips newer country prefixes', () => {
    expect(inferCountryCodeFromPhone('+243 812345678')).toBe('cd');
    expect(normalizeWithdrawPhone('+243812345678')).toBe('812345678');
    expect(inferCountryCodeFromPhone('+255712345678')).toBe('tz');
    expect(normalizeWithdrawPhone('+255712345678')).toBe('712345678');
  });

  it('normalizes Guinea and regional aliases', () => {
    expect(normalizeMoneyFusionCountryCode('GIN')).toBe('gn');
    expect(normalizeMoneyFusionCountryCode('Guinea Conakry')).toBe('gn');
    expect(normalizeMoneyFusionCountryCode('Burkina Faso')).toBe('bf');
    expect(normalizeMoneyFusionCountryCode('RDC')).toBe('cd');
    expect(normalizeMoneyFusionCountryCode('Congo Brazzaville')).toBe('cg');
  });
});
