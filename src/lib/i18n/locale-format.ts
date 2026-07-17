/** Map i18n language code to BCP 47 locale for Intl formatters. */
export function resolveIntlLocale(language?: string | null): string {
  if (!language) return 'fr-FR';
  if (language.startsWith('en')) return 'en-US';
  if (language.startsWith('es')) return 'es-ES';
  if (language.startsWith('de')) return 'de-DE';
  if (language.startsWith('pt')) return 'pt-PT';
  return 'fr-FR';
}

export function formatLocaleNumber(value: number, language?: string | null): string {
  return value.toLocaleString(resolveIntlLocale(language));
}

export function formatLocaleDate(value: Date, language?: string | null): string {
  return value.toLocaleDateString(resolveIntlLocale(language));
}

const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatLocaleDateTime(
  value: Date,
  language?: string | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTIONS
): string {
  return value.toLocaleString(resolveIntlLocale(language), options);
}
