import { describe, expect, it } from 'vitest';
import {
  countryHasMobileMoney,
  getDefaultOperatorForCountry,
  getMobileMoneyOperatorsForCountry,
  isOperatorAvailableInCountry,
} from '@/lib/mobile-money-operators';

const values = (iso: string) => getMobileMoneyOperatorsForCountry(iso).map(op => op.value);

describe('mobile-money-operators', () => {
  it('lists Wave / Orange / Moov for Burkina Faso', () => {
    expect(values('BF')).toEqual(expect.arrayContaining(['orange_money', 'moov_money', 'wave']));
  });

  it('lists MTN, Moov, Orange and Wave for Côte d’Ivoire', () => {
    expect(values('CI')).toEqual(
      expect.arrayContaining(['orange_money', 'mtn_mobile_money', 'moov_money', 'wave'])
    );
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

  it('lists Niger wallets actually used there (Airtel, Moov, Amana, Zamani, Nita)', () => {
    expect(values('NE')).toEqual(
      expect.arrayContaining(['airtel_money', 'moov_money', 'amana', 'zamani_cash', 'nita'])
    );
    expect(values('NE')).not.toContain('orange_money');
  });

  it('lists MTN for Ghana without inventing Orange Money', () => {
    expect(values('GH')).toContain('mtn_mobile_money');
    expect(values('GH')).not.toContain('orange_money');
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
});
