import { describe, expect, it } from 'vitest';
import {
  CHECKOUT_DIAL_COUNTRIES,
  combineLocalPhone,
  countryFromTimezone,
  findDialCountry,
  flagUrlForIso,
  splitPhoneInput,
} from '@/lib/phone/country-dial';
import { COUNTRIES } from '@/lib/countries';
import { ISO_DIAL_CODES } from '@/lib/phone/iso-dial-codes';

describe('country-dial', () => {
  it('resolves Burkina Faso by name and timezone', () => {
    expect(findDialCountry('Burkina Faso').dial).toBe('226');
    expect(countryFromTimezone('Africa/Ouagadougou').iso).toBe('bf');
  });

  it('combines local digits with dial code', () => {
    expect(combineLocalPhone('226', '70 12 34 56')).toBe('+22670123456');
    expect(combineLocalPhone('226', '070123456')).toBe('+22670123456');
    expect(combineLocalPhone('226', '')).toBe('');
  });

  it('splits an international number back into dial + local', () => {
    const parsed = splitPhoneInput('+22670123456');
    expect(parsed.country.iso).toBe('bf');
    expect(parsed.localNumber).toBe('70123456');
  });

  it('parses +225 and 00 prefixes as international', () => {
    expect(splitPhoneInput('+22570123456').country.iso).toBe('ci');
    expect(splitPhoneInput('0022570123456').country.iso).toBe('ci');
    expect(splitPhoneInput('0022570123456').localNumber).toBe('70123456');
  });

  it('does not treat a local number as a foreign dial prefix', () => {
    const parsed = splitPhoneInput('70123456', "Côte d'Ivoire");
    expect(parsed.country.dial).toBe('225');
    expect(parsed.localNumber).toBe('70123456');
  });

  it('covers every ISO country in the picker', () => {
    const missingDial = COUNTRIES.filter(country => !ISO_DIAL_CODES[country.code]).map(
      country => country.code
    );
    expect(missingDial).toEqual([]);
    expect(CHECKOUT_DIAL_COUNTRIES.length).toBe(COUNTRIES.length);
    expect(CHECKOUT_DIAL_COUNTRIES.some(c => c.iso === 'fr')).toBe(true);
    expect(CHECKOUT_DIAL_COUNTRIES.some(c => c.iso === 'us')).toBe(true);
    expect(CHECKOUT_DIAL_COUNTRIES[0].iso).toBe('bf');
  });

  it('returns an image URL for countries without a local SVG flag', () => {
    expect(flagUrlForIso('ec')).toMatch(/flagcdn|ec\.svg/);
    expect(flagUrlForIso('ee')).toMatch(/flagcdn|ee\.svg/);
    expect(flagUrlForIso('bf')).toMatch(/\/landing\/flags\/bf\.svg/);
  });
});
