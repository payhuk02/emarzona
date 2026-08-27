import { describe, expect, it } from 'vitest';
import {
  countryHasMobileMoney,
  getDefaultOperatorForCountry,
  getMobileMoneyOperatorsForCountry,
  isOperatorAvailableInCountry,
  MOBILE_MONEY_OPERATORS_BY_COUNTRY,
} from '@/lib/mobile-money-operators';

const values = (iso: string) => getMobileMoneyOperatorsForCountry(iso).map(op => op.value);

describe('mobile-money-operators', () => {
  it('lists Orange / Moov for Burkina Faso (no Wave — absent du catalogue MF)', () => {
    expect(values('BF')).toEqual(expect.arrayContaining(['orange_money', 'moov_money']));
    expect(values('BF')).not.toContain('wave');
  });

  it('lists MTN, Moov, Orange and Wave for Côte d’Ivoire', () => {
    expect(values('CI')).toEqual(
      expect.arrayContaining(['orange_money', 'mtn_mobile_money', 'moov_money', 'wave'])
    );
  });

  it('lists Orange only for Mali (pas Moov/Wave MF)', () => {
    expect(values('ML')).toEqual(expect.arrayContaining(['orange_money']));
    expect(values('ML')).not.toContain('wave');
    expect(values('ML')).not.toContain('moov_money');
  });

  it('lists Free Money with Orange and Wave for Senegal', () => {
    expect(values('SN')).toEqual(expect.arrayContaining(['orange_money', 'free_money', 'wave']));
  });

  it('lists T-Money for Togo, not Orange Money', () => {
    expect(values('TG')).toContain('t_money');
    expect(values('TG')).toContain('moov_money');
    expect(values('TG')).not.toContain('orange_money');
    expect(getDefaultOperatorForCountry('TG')).toBe('t_money');
  });

  it('lists MTN and Moov for Benin, not Orange', () => {
    expect(values('BJ')).toEqual(expect.arrayContaining(['mtn_mobile_money', 'moov_money']));
    expect(values('BJ')).not.toContain('orange_money');
  });

  it('lists Niger wallets mapped in MoneyFusion (incl. MTN)', () => {
    expect(values('NE')).toEqual(
      expect.arrayContaining([
        'airtel_money',
        'mtn_mobile_money',
        'moov_money',
        'amana',
        'zamani_cash',
        'nita',
      ])
    );
    expect(values('NE')).not.toContain('orange_money');
  });

  it('lists MTN / Airtel for Ghana without inventing Orange Money', () => {
    expect(values('GH')).toContain('mtn_mobile_money');
    expect(values('GH')).toContain('airtel_money');
    expect(values('GH')).not.toContain('orange_money');
    expect(values('GH')).not.toContain('wave');
  });

  it('does not expose Maghreb / EcoCash countries without MF payout map', () => {
    for (const iso of ['MA', 'TN', 'DZ', 'BI', 'ZW', 'LS', 'NG', 'ZA', 'LR']) {
      expect(countryHasMobileMoney(iso)).toBe(false);
    }
  });

  it('does not invent West-African wallets for France or the US', () => {
    expect(getMobileMoneyOperatorsForCountry('FR')).toEqual([]);
    expect(getMobileMoneyOperatorsForCountry('US')).toEqual([]);
    expect(countryHasMobileMoney('FR')).toBe(false);
    expect(getDefaultOperatorForCountry('FR')).toBe('other');
    expect(isOperatorAvailableInCountry('FR', 'orange_money')).toBe(false);
  });

  it('accepts lowercase country codes', () => {
    expect(getDefaultOperatorForCountry('sn')).toBe('orange_money');
  });

  it('always ends operator lists with "other"', () => {
    for (const ops of Object.values(MOBILE_MONEY_OPERATORS_BY_COUNTRY)) {
      expect(ops[ops.length - 1]?.value).toBe('other');
    }
  });
});
