/**
 * Hook pour obtenir le logo de la plateforme selon le thème
 * Utilise les logos personnalisés depuis la configuration si disponibles
 * Optimisé pour éviter les flashs et garantir la stabilité
 */

import { useMemo, useState, useEffect } from 'react';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';
import payhukLogo from '@/assets/payhuk-logo.png';

/**
 * Obtient le logo approprié selon le thème actuel
 * @returns URL du logo (light ou dark) ou logo par défaut
 */
export const usePlatformLogo = () => {
  const { customizationData } = usePlatformCustomizationContext();
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);

  // Précharger le logo personnalisé pour éviter les flashs
  useEffect(() => {
    if (customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark) {
      const logosToPreload = [
        customizationData.design.logo.light,
        customizationData.design.logo.dark,
      ].filter(Boolean) as string[];

      logosToPreload.forEach((logoUrl) => {
        const img = new Image();
        img.src = logoUrl;
        img.onload = () => setIsLogoLoaded(true);
        img.onerror = () => {
          // Si le logo personnalisé ne charge pas, on garde le logo par défaut
          setIsLogoLoaded(false);
        };
      });
    } else {
      setIsLogoLoaded(true); // Logo par défaut toujours disponible
    }
  }, [customizationData?.design?.logo]);

  const logo = useMemo(() => {
    // Si pas de données de personnalisation, utiliser le logo par défaut
    if (!customizationData?.design?.logo) {
      return payhukLogo;
    }

    // Déterminer le thème actuel de manière stable
    const isDark = document.documentElement.classList.contains('dark');
    const theme = customizationData.design.theme || 'auto';

    let shouldUseDark = false;

    if (theme === 'dark') {
      shouldUseDark = true;
    } else if (theme === 'light') {
      shouldUseDark = false;
    } else if (theme === 'auto') {
      // Suivre les préférences système de manière stable
      shouldUseDark = isDark || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Retourner le logo approprié ou le logo par défaut
    // Priorité : logo personnalisé selon thème > logo light > logo dark > logo par défaut
    if (shouldUseDark && customizationData.design.logo.dark) {
      return customizationData.design.logo.dark;
    } else if (!shouldUseDark && customizationData.design.logo.light) {
      return customizationData.design.logo.light;
    }

    // Fallback : utiliser le logo light s'il existe, sinon dark, sinon par défaut
    return customizationData.design.logo.light || 
           customizationData.design.logo.dark || 
           payhukLogo;
  }, [customizationData]);

  // Retourner le logo (sera stable une fois chargé)
  return logo;
};

/**
 * Obtient le logo light spécifiquement
 */
export const usePlatformLogoLight = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.light || payhukLogo;
};

/**
 * Obtient le logo dark spécifiquement
 */
export const usePlatformLogoDark = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.dark || payhukLogo;
};

/**
 * Obtient le favicon
 */
export const usePlatformFavicon = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.favicon || null;
};

