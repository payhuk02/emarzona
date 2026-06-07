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
import sidebarFR from './locales/sidebar-fr.json';
import sidebarEN from './locales/sidebar-en.json';
import landingPremiumFR from './locales/landing-premium/fr.json';
import landingPremiumEN from './locales/landing-premium/en.json';
import landingPremiumES from './locales/landing-premium/es.json';
import landingPremiumDE from './locales/landing-premium/de.json';
import landingPremiumPT from './locales/landing-premium/pt.json';

// Les ressources de traduction
const resources = {
  fr: {
    translation: { ...translationFR, ...sidebarFR, landingPremium: landingPremiumFR },
  },
  en: {
    translation: { ...translationEN, ...sidebarEN, landingPremium: landingPremiumEN },
  },
  es: {
    translation: { ...translationES, ...sidebarEN, landingPremium: landingPremiumES },
  },
  de: {
    translation: { ...translationDE, ...sidebarEN, landingPremium: landingPremiumDE },
  },
  pt: {
    translation: { ...translationPT, ...sidebarEN, landingPremium: landingPremiumPT },
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
    debug: import.meta.env.VITE_I18N_DEBUG === 'true',

    // Options de détection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'emarzona_language',
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
      useSuspense: false, // Désactivé pour compatibilité avec lazy loading
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
export type LanguageCode = (typeof AVAILABLE_LANGUAGES)[number]['code'];
