import { describe, expect, it } from 'vitest';
import {
  sanitizeHexColor,
  sanitizeStoreFont,
  sanitizeCssSize,
} from '@/lib/storefront/css-sanitize';

describe('css-sanitize', () => {
  it('accepts valid hex colors', () => {
    expect(sanitizeHexColor('#3b82f6', '#000')).toBe('#3b82f6');
  });

  it('rejects css injection in colors', () => {
    expect(sanitizeHexColor('#3b82f6; } body { display:none', '#000')).toBe('#000');
  });

  it('whitelists fonts', () => {
    expect(sanitizeStoreFont('Roboto', 'Inter')).toBe('Roboto');
    expect(sanitizeStoreFont("Evil');@import url(x)", 'Inter')).toBe('Inter');
  });

  it('validates css sizes and normal', () => {
    expect(sanitizeCssSize('16px', '1rem')).toBe('16px');
    expect(sanitizeCssSize('normal', '1rem')).toBe('normal');
    expect(sanitizeCssSize('16px; evil', '1rem')).toBe('1rem');
  });
});
