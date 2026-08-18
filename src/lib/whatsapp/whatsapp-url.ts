const DEFAULT_WHATSAPP_BASE = 'https://wa.me';

/** Indicatifs fréquents (Afrique de l'Ouest / Maghreb / Europe), plus longs d'abord. */
export const WHATSAPP_COUNTRY_CODES = [
  '226',
  '225',
  '221',
  '223',
  '227',
  '228',
  '229',
  '233',
  '234',
  '237',
  '241',
  '242',
  '243',
  '250',
  '254',
  '255',
  '256',
  '258',
  '260',
  '261',
  '212',
  '213',
  '216',
  '218',
  '220',
  '224',
  '230',
  '231',
  '232',
  '235',
  '236',
  '238',
  '239',
  '240',
  '244',
  '245',
  '248',
  '249',
  '251',
  '252',
  '253',
  '257',
  '27',
  '33',
  '32',
  '34',
  '39',
  '44',
  '49',
  '1',
] as const;

export const DEFAULT_WHATSAPP_COUNTRY_CODE = '226';

/** Normalise un numéro saisi par le vendeur (ex. 226 7X XX XX XX) en chiffres E.164 sans +. */
export function normalizeWhatsAppDigits(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

export function isValidWhatsAppDigits(digits: string): boolean {
  return digits.length >= 8 && digits.length <= 15;
}

export function combineWhatsAppNumber(countryCode: string, localNumber: string): string {
  return `${normalizeWhatsAppDigits(countryCode)}${normalizeWhatsAppDigits(localNumber)}`;
}

export function splitWhatsAppNumber(phoneNumber: string): {
  countryCode: string;
  localNumber: string;
} {
  const digits = normalizeWhatsAppDigits(phoneNumber);
  if (!digits) {
    return { countryCode: DEFAULT_WHATSAPP_COUNTRY_CODE, localNumber: '' };
  }

  const codes = [...WHATSAPP_COUNTRY_CODES].sort((a, b) => b.length - a.length);
  for (const code of codes) {
    if (digits.startsWith(code)) {
      return { countryCode: code, localNumber: digits.slice(code.length) };
    }
  }

  return { countryCode: DEFAULT_WHATSAPP_COUNTRY_CODE, localNumber: digits };
}

/** Message prérempli : intérêt produit + lien de paiement sécurisé (wa.me ne supporte pas de vrai bouton). */
export function buildProductWhatsAppMessage(productName: string, paymentUrl: string): string {
  const name = productName.trim() || 'ce produit';
  const url = paymentUrl.trim();
  if (!url) {
    return `Bonjour, je suis intéressé(e) par « ${name} ».`;
  }
  return `Bonjour, je suis intéressé(e) par « ${name} ».

Payer ici en sécurité :
${url}`;
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
