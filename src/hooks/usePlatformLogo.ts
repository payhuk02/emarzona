/**
 * Hook pour obtenir le logo de la plateforme selon le thème
 * Utilise les logos personnalisés depuis la configuration si disponibles
 * Optimisé pour éviter les flashs et garantir la stabilité
 * 
 * IMPORTANT: Ne retourne que les logos personnalisés configurés.
 * Si aucun logo n'est configuré, retourne null pour éviter le clignotement.
 */

import { useMemo, useState, useEffect } from 'react';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';

/**
 * Obtient le logo approprié selon le thème actuel
 * @returns URL du logo (light ou dark) ou null si non configuré
 */
export const usePlatformLogo = () => {
  const { customizationData } = usePlatformCustomizationContext();
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Précharger le logo personnalisé pour éviter les flashs
  useEffect(() => {
    const hasCustomLogo = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
    
    if (hasCustomLogo) {
      // Déterminer le thème actuel de manière stable
      const isDark = document.documentElement.classList.contains('dark');
      const theme = customizationData?.design?.theme || 'auto';

      let shouldUseDark = false;

      if (theme === 'dark') {
        shouldUseDark = true;
      } else if (theme === 'light') {
        shouldUseDark = false;
      } else if (theme === 'auto') {
        // Suivre les préférences système de manière stable
        shouldUseDark = isDark || window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      // Déterminer l'URL du logo à utiliser
      let selectedLogoUrl: string | null = null;
      if (shouldUseDark && customizationData.design.logo.dark) {
        selectedLogoUrl = customizationData.design.logo.dark;
      } else if (!shouldUseDark && customizationData.design.logo.light) {
        selectedLogoUrl = customizationData.design.logo.light;
      } else {
        selectedLogoUrl = customizationData.design.logo.light || customizationData.design.logo.dark || null;
      }

      if (selectedLogoUrl) {
        // Précharger le logo pour éviter les flashs
        const img = new Image();
        img.src = selectedLogoUrl;
        img.onload = () => {
          setIsLogoLoaded(true);
          setLogoUrl(selectedLogoUrl);
        };
        img.onerror = () => {
          setIsLogoLoaded(false);
          setLogoUrl(null);
        };
      } else {
        setIsLogoLoaded(true);
        setLogoUrl(null);
      }
    } else {
      setIsLogoLoaded(true);
      setLogoUrl(null);
    }
  }, [customizationData?.design?.logo, customizationData?.design?.theme]);

  // Écouter les changements de thème système pour mettre à jour le logo
  useEffect(() => {
    const theme = customizationData?.design?.theme || 'auto';
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Forcer la mise à jour du logo en déclenchant un re-render
        const hasCustomLogo = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
        if (hasCustomLogo) {
          const isDark = document.documentElement.classList.contains('dark') || mediaQuery.matches;
          let selectedLogoUrl: string | null = null;
          if (isDark && customizationData?.design?.logo?.dark) {
            selectedLogoUrl = customizationData.design.logo.dark;
          } else if (!isDark && customizationData?.design?.logo?.light) {
            selectedLogoUrl = customizationData.design.logo.light;
          } else {
            selectedLogoUrl = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark || null;
          }
          setLogoUrl(selectedLogoUrl);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [customizationData?.design?.logo, customizationData?.design?.theme]);

  // Retourner le logo (sera stable une fois chargé)
  return logoUrl;
};

/**
 * Obtient le logo light spécifiquement
 */
export const usePlatformLogoLight = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.light || null;
};

/**
 * Obtient le logo dark spécifiquement
 */
export const usePlatformLogoDark = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.dark || null;
};

/**
 * Obtient le favicon
 */
export const usePlatformFavicon = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.favicon || null;
};

