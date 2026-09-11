import { describe, expect, it } from 'vitest';
import {
  looksLikeEmail,
  resolveUserFullName,
  sanitizeDisplayName,
  splitFullName,
} from './userDisplayName';

describe('userDisplayName', () => {
  it('detects email-like strings', () => {
    expect(looksLikeEmail('a@b.com')).toBe(true);
    expect(looksLikeEmail('Ada Lovelace')).toBe(false);
  });

  it('sanitizes display names that are emails', () => {
    expect(sanitizeDisplayName('a@b.com', 'a@b.com')).toBeNull();
    expect(sanitizeDisplayName('Ada Lovelace', 'a@b.com')).toBe('Ada Lovelace');
  });

  it('splits full names', () => {
    expect(splitFullName('Ada Lovelace')).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('resolves full name without falling back to email', () => {
    expect(
      resolveUserFullName({
        firstName: null,
        lastName: null,
        displayName: 'nizia@gmail.com',
        metaFullName: 'Nizia Nirfane',
        email: 'nizia@gmail.com',
      })
    ).toBe('Nizia Nirfane');

    expect(
      resolveUserFullName({
        firstName: 'Ada',
        lastName: 'Lovelace',
        displayName: 'a@b.com',
        email: 'a@b.com',
      })
    ).toBe('Ada Lovelace');

    expect(
      resolveUserFullName({
        displayName: 'a@b.com',
        email: 'a@b.com',
      })
    ).toBe('N/A');
  });
});
