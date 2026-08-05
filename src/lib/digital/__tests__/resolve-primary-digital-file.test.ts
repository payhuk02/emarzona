import { describe, expect, it } from 'vitest';
import { resolvePrimaryDigitalFile } from '@/lib/digital/resolve-primary-digital-file';

describe('resolvePrimaryDigitalFile', () => {
  it('prefers the file marked is_main', () => {
    const files = [
      { name: 'bonus.pdf', url: 'https://example.com/bonus.pdf', is_main: false },
      { name: 'main.pdf', url: 'https://example.com/main.pdf', is_main: true },
    ];

    expect(resolvePrimaryDigitalFile(files)?.url).toBe('https://example.com/main.pdf');
  });

  it('falls back to the first file when none is marked main', () => {
    const files = [{ name: 'first.pdf', url: 'https://example.com/first.pdf' }];

    expect(resolvePrimaryDigitalFile(files)?.url).toBe('https://example.com/first.pdf');
  });

  it('returns undefined for empty input', () => {
    expect(resolvePrimaryDigitalFile([])).toBeUndefined();
    expect(resolvePrimaryDigitalFile(undefined)).toBeUndefined();
  });
});
