const DEFAULT_WHATSAPP_BASE = 'https://wa.me';

/** Normalise un numéro saisi par le vendeur (ex. 226 7X XX XX XX) en chiffres E.164 sans +. */
export function normalizeWhatsAppDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export function isValidWhatsAppDigits(digits: string): boolean {
  return digits.length >= 8 && digits.length <= 15;
}

/** Construit l'URL de clic WhatsApp à partir de la base admin et du numéro produit. */
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
