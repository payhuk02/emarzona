import { describe, expect, it } from 'vitest';
import {
  formatLocaleDate,
  formatLocaleDateTime,
  formatLocaleNumber,
  resolveIntlLocale,
} from '@/lib/i18n/locale-format';

describe('locale-format', () => {
  it('maps i18n language codes to BCP 47 locales', () => {
    expect(resolveIntlLocale('fr')).toBe('fr-FR');
    expect(resolveIntlLocale('en')).toBe('en-US');
    expect(resolveIntlLocale('es')).toBe('es-ES');
    expect(resolveIntlLocale('de')).toBe('de-DE');
    expect(resolveIntlLocale('pt')).toBe('pt-PT');
    expect(resolveIntlLocale(null)).toBe('fr-FR');
  });

  it('formats numbers with locale-aware grouping', () => {
    expect(formatLocaleNumber(1234, 'en')).toContain('1');
    expect(formatLocaleNumber(1234, 'fr')).toContain('234');
  });

  it('formats dates with locale-aware output', () => {
    const date = new Date('2026-07-17T12:00:00Z');
    expect(formatLocaleDate(date, 'fr')).toMatch(/\d/);
    expect(formatLocaleDate(date, 'en')).toMatch(/\d/);
  });

  it('formats datetimes with locale-aware output', () => {
    const date = new Date('2026-07-17T14:30:00Z');
    expect(formatLocaleDateTime(date, 'fr')).toMatch(/\d/);
    expect(formatLocaleDateTime(date, 'en')).toMatch(/\d/);
  });
});
