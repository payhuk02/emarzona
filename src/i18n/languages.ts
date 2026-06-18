/**
 * Métadonnées langues — sans importer les JSON de traduction (bundle léger).
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
] as const;

export type LanguageCode = (typeof AVAILABLE_LANGUAGES)[number]['code'];

export function normalizeLanguageCode(lng: string): LanguageCode {
  const code = lng.split('-')[0].toLowerCase();
  const match = AVAILABLE_LANGUAGES.find(l => l.code === code);
  return match?.code ?? 'fr';
}
