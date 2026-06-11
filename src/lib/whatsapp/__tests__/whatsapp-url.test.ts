import { describe, expect, it } from 'vitest';
import { buildWhatsAppClickUrl, normalizeWhatsAppDigits } from '../whatsapp-url';

describe('whatsapp-url', () => {
  it('normalizes Burkina Faso style numbers', () => {
    expect(normalizeWhatsAppDigits('226 70 12 34 56')).toBe('22670123456');
  });

  it('builds wa.me link from admin base and vendor number', () => {
    expect(buildWhatsAppClickUrl('https://wa.me', '226 70 12 34 56')).toBe(
      'https://wa.me/22670123456'
    );
  });

  it('appends optional message', () => {
    const url = buildWhatsAppClickUrl('https://wa.me/', '+22670123456', 'Bonjour');
    expect(url).toBe('https://wa.me/22670123456?text=Bonjour');
  });

  it('rejects too-short numbers', () => {
    expect(buildWhatsAppClickUrl('https://wa.me', '123')).toBeNull();
  });
});
