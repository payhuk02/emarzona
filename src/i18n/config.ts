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
import sidebarES from './locales/sidebar-es.json';
import sidebarDE from './locales/sidebar-de.json';
import sidebarPT from './locales/sidebar-pt.json';
import landingPremiumFR from './locales/landing-premium/fr.json';
import landingPremiumEN from './locales/landing-premium/en.json';
import storeFormFR from './locales/store-form-fr.json';
import storeFormEN from './locales/store-form-en.json';
import { AVAILABLE_LANGUAGES, type LanguageCode } from './languages';

const mergeStoreLocale = (
  baseStore: (typeof translationFR)['store'],
  storeForm: typeof storeFormFR
) => ({
  ...baseStore,
  ...storeForm,
  tabs: {
    ...(baseStore?.tabs ?? {}),
    ...storeForm.tabs,
  },
});

export { AVAILABLE_LANGUAGES, type LanguageCode };

// landingPremium FR/EN dans le bundle initial (pages publiques /blog sans passer par la landing)
const resources = {
  fr: {
    translation: {
      ...translationFR,
      ...sidebarFR,
      landingPremium: landingPremiumFR,
      store: mergeStoreLocale(translationFR.store, storeFormFR),
    },
  },
  en: {
    translation: {
      ...translationEN,
      ...sidebarEN,
      landingPremium: landingPremiumEN,
      store: mergeStoreLocale(translationEN.store, storeFormEN),
    },
  },
  es: {
    translation: { ...translationES, ...sidebarES },
  },
  de: {
    translation: { ...translationDE, ...sidebarDE },
  },
  pt: {
    translation: { ...translationPT, ...sidebarPT },
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
    lng: 'fr',
    fallbackLng: 'fr',
    debug: import.meta.env.VITE_I18N_DEBUG === 'true',

    // Options de détection — htmlTag (lang="fr") avant navigator pour l'indexation Google
    detection: {
      order: ['querystring', 'localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'emarzona_language',
      lookupQuerystring: 'lang',
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
