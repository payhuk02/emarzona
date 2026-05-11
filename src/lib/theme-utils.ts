/**
 * Utilitaires pour appliquer le thème immédiatement
 * Utilisé pour éviter le flash de contenu non stylé (FOUC)
 */

import { getTheme, ThemeName } from './themes';

const THEME_STORAGE_KEY = 'emarzona-theme';

/**
 * Appliquer le thème immédiatement (sans React)
 * Utilisé dans ThemeProvider pour éviter le FOUC
 */
export const applyThemeImmediate = () => {
  // Récupérer le thème sauvegardé ou utiliser 'professional' par défaut
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName;
  const  themeName: ThemeName = savedTheme && ['professional', 'minimal', 'dark', 'spacious', 'classic', 'default'].includes(savedTheme)
    ? savedTheme
    : 'professional'; // Thème clair par défaut

  const theme = getTheme(themeName);
  const root = document.documentElement;

  // Appliquer les couleurs
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // Appliquer les couleurs de la sidebar
  Object.entries(theme.sidebar).forEach(([key, value]) => {
    root.style.setProperty(`--sidebar-${key}`, value);
  });

  // Appliquer le border radius
  root.style.setProperty('--radius', theme.borderRadius);

  // Appliquer les ombres
  root.style.setProperty('--shadow-soft', theme.shadows.soft);
  root.style.setProperty('--shadow-medium', theme.shadows.medium);
  root.style.setProperty('--shadow-large', theme.shadows.large);

  // Appliquer la police
  const fontFamily = theme.typography.fontFamily.join(', ');
  root.style.setProperty('--font-sans', fontFamily);

  // Gérer le mode sombre/clair
  if (themeName === 'dark' || themeName === 'default') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};








