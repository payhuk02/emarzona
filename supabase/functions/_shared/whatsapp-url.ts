const DEFAULT_WHATSAPP_BASE = 'https://wa.me';

export function normalizeWhatsAppDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export function isValidWhatsAppDigits(digits: string): boolean {
  return digits.length >= 8 && digits.length <= 15;
}

export function buildWhatsAppClickUrl(
  clickUrlBase: string,
  phoneNumber: string,
  message?: string
): string | null {
  const digits = normalizeWhatsAppDigits(phoneNumber);
  if (!isValidWhatsAppDigits(digits)) return null;

  const base = (clickUrlBase || DEFAULT_WHATSAPP_BASE).replace(/\/+$/, '');
  const url = `${base}/${digits}`;
  if (!message?.trim()) return url;
  return `${url}?text=${encodeURIComponent(message.trim())}`;
}

export { DEFAULT_WHATSAPP_BASE };
