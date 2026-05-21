/** Drapeaux SVG hébergés localement (public/landing/flags) */
const FLAG_CODES = [
  'bf',
  'sn',
  'ci',
  'ml',
  'bj',
  'tg',
  'ne',
  'cm',
  'gn',
  'gh',
  'ng',
  'ma',
  'tn',
  'dz',
  'za',
  'ke',
  'rw',
  'cd',
  'ga',
  'fr',
  'be',
  'ch',
  'de',
  'gb',
  'es',
  'it',
  'pt',
  'ca',
  'us',
  'ae',
] as const;

export type CountryFlagCode = (typeof FLAG_CODES)[number];

export function getCountryFlagUrl(isoCode: string): string {
  const code = isoCode.toLowerCase();
  return `/landing/flags/${code}.svg`;
}

export function isCountryFlagAvailable(isoCode: string): boolean {
  return FLAG_CODES.includes(isoCode.toLowerCase() as CountryFlagCode);
}
