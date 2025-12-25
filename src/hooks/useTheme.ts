/**
 * Hook pour gérer le thème de l'application
 */

import { useState, useEffect } from 'react';
import { ThemeName, getTheme, themeNames } from '@/lib/themes';

const THEME_STORAGE_KEY = 'emarzona-theme';

/**
 * Hook pour gérer le thème
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(() => {
    // Récupérer le thème depuis le localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeName;
      if (savedTheme && themeNames.includes(savedTheme)) {
        return savedTheme;
      }
    }
    return 'professional'; // Thème par défaut: Professionnel (clair)
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Appliquer le thème au chargement
    applyTheme(theme);
    setIsLoading(false);
  }, [theme]);

  /**
   * Changer de thème
   */
  const changeTheme = (newTheme: ThemeName) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  /**
   * Appliquer le thème au DOM
   */
  const applyTheme = (themeName: ThemeName) => {
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

    // Ajouter une classe au body pour identifier le thème
    root.classList.remove(...themeNames.map(t => `theme-${t}`));
    root.classList.add(`theme-${themeName}`);

    // Gérer le mode sombre/clair
    if (themeName === 'dark' || themeName === 'default') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  return {
    theme,
    themeConfig: getTheme(theme),
    changeTheme,
    isLoading,
  };
};

