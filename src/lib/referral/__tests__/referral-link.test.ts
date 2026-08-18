import { describe, expect, it } from 'vitest';
import {
  buildReferralShortPath,
  buildReferralShortUrl,
  extractReferralCodeFromPath,
} from '../referral-link';
import { normalizeReferralSlug, validateReferralSlug } from '../referral-slug';

describe('referral slug', () => {
  it('normalizes to lowercase alphanumeric', () => {
    expect(normalizeReferralSlug('  Ab-CD_12 ')).toBe('abcd12');
  });

  it('treats the same letters in different case as one slug', () => {
    expect(normalizeReferralSlug('AbCdEf')).toBe(normalizeReferralSlug('abcdef'));
    expect(normalizeReferralSlug('A4074059')).toBe('a4074059');
  });

  it('accepts 4–20 character codes', () => {
    expect(validateReferralSlug('abcd')).toBeNull();
    expect(validateReferralSlug('abcdef')).toBeNull();
    expect(validateReferralSlug('A4074059')).toBeNull();
    expect(validateReferralSlug('ab')).not.toBeNull();
    expect(validateReferralSlug('admin')).not.toBeNull();
  });
});

describe('referral short link', () => {
  it('builds /p/{slug} paths', () => {
    expect(buildReferralShortPath('A4074059')).toBe('/p/a4074059');
    expect(buildReferralShortPath('abcdef')).toBe('/p/abcdef');
  });

  it('extracts codes from short paths', () => {
    expect(extractReferralCodeFromPath('/p/abcdef')).toBe('abcdef');
    expect(extractReferralCodeFromPath('/p/A4074059/')).toBe('A4074059');
    expect(extractReferralCodeFromPath('/register')).toBeNull();
  });

  it('uses a professional public URL', () => {
    expect(buildReferralShortUrl('ABCDEF')).toMatch(/\/p\/abcdef$/);
  });

  it('keeps the live host so copied links resolve', () => {
    expect(buildReferralShortUrl('abcdef')).toContain('/p/abcdef');
    expect(buildReferralShortUrl('abcdef')).not.toContain('?ref=');
  });
});
