import { describe, expect, it } from 'vitest';
import {
  buildProductWhatsAppMessage,
  buildWhatsAppClickUrl,
  normalizeWhatsAppDigits,
  splitWhatsAppNumber,
} from '../whatsapp-url';

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

  it('splits country code without + from a Burkina number', () => {
    expect(splitWhatsAppNumber('226 70 12 34 56')).toEqual({
      countryCode: '226',
      localNumber: '70123456',
    });
  });

  it('builds a prefilled payment message', () => {
    const message = buildProductWhatsAppMessage(
      'Ebook Premium',
      'https://digitallog.myemarzona.shop/pay/ebook-premium'
    );
    expect(message).toContain('Ebook Premium');
    expect(message).toContain('Payer ici en sécurité');
    expect(message).toContain('https://digitallog.myemarzona.shop/pay/ebook-premium');
  });
});
