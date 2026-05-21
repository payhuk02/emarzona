const CURRENCY_LOGO_CODES = [
  'xof',
  'xaf',
  'eur',
  'usd',
  'gbp',
  'ngn',
  'ghs',
  'kes',
  'zar',
  'ugx',
  'tzs',
  'rwf',
  'etb',
  'mad',
  'cad',
  'chf',
  'aed',
] as const;

export type CurrencyLogoCode = (typeof CURRENCY_LOGO_CODES)[number];

export function getCurrencyLogoUrl(isoCode: string): string {
  const code = isoCode.toLowerCase();
  return `/landing/currencies/${code}.svg`;
}

export function isCurrencyLogoAvailable(isoCode: string): boolean {
  return CURRENCY_LOGO_CODES.includes(isoCode.toLowerCase() as CurrencyLogoCode);
}
