/**
 * Configuration i18next pour l'internationalisation
 * Supporte : Français (FR), Anglais (EN), Espagnol (ES), Allemand (DE), Portugais (PT)
 * Détection automatique de la langue du navigateur
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importation des traductions
import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';
import translationES from './locales/es.json';
import translationDE from './locales/de.json';
import translationPT from './locales/pt.json';

// Les ressources de traduction
const resources = {
  fr: {
    translation: translationFR,
  },
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  de: {
    translation: translationDE,
  },
  pt: {
    translation: translationPT,
  },
};

i18n
  // Détecte automatiquement la langue du navigateur
  .use(LanguageDetector)
  // Passe l'instance i18n à react-i18next
  .use(initReactI18next)
  // Initialise i18next
  .init({
    resources,
    fallbackLng: 'fr', // Langue par défaut
    debug: process.env.NODE_ENV === 'development',
    
    // Options de détection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'payhuk_language',
    },
    
    // Options d'interpolation
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    
    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation',
    
    // React options
    react: {
      useSuspense: true,
    },
  });

export default i18n;

/**
 * Langues disponibles
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
] as const;

/**
 * Type pour les codes de langue
 */
export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

