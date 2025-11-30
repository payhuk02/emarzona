/**
 * Hook pour obtenir le logo de la plateforme selon le thème
 * Utilise les logos personnalisés depuis la configuration si disponibles
 * Optimisé pour éviter les flashs et garantir la stabilité
 * 
 * IMPORTANT: Ne retourne que les logos personnalisés configurés.
 * Si aucun logo n'est configuré, retourne null pour éviter le clignotement.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';

const LOGO_CACHE_KEY = 'platform-logo-cache';

/**
 * Obtient le logo approprié selon le thème actuel
 * @returns URL du logo (light ou dark) ou null si non configuré
 */
export const usePlatformLogo = () => {
  const { customizationData } = usePlatformCustomizationContext();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preloadImageRef = useRef<HTMLImageElement | null>(null);

  // Fonction pour déterminer l'URL du logo selon le thème
  const getLogoUrl = useMemo(() => {
    return (logoData: { light?: string | null; dark?: string | null }, theme?: string) => {
      const isDark = document.documentElement.classList.contains('dark') || 
                    window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let shouldUseDark = false;
      if (theme === 'dark') {
        shouldUseDark = true;
      } else if (theme === 'light') {
        shouldUseDark = false;
      } else if (theme === 'auto' || !theme) {
        shouldUseDark = isDark;
      }

      if (shouldUseDark && logoData.dark) {
        return logoData.dark;
      } else if (!shouldUseDark && logoData.light) {
        return logoData.light;
      }
      return logoData.light || logoData.dark || null;
    };
  }, []);

  // Charger le logo depuis le cache ou les données réelles
  useEffect(() => {
    let isMounted = true;

    // 1. Essayer de charger depuis le cache localStorage (pour mobile)
    const loadFromCache = () => {
      try {
        const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
        if (cachedLogo) {
          const cached = JSON.parse(cachedLogo);
          const hasRealData = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
          
          // Utiliser le cache seulement si les données réelles ne sont pas encore chargées
          if (!hasRealData && (cached.light || cached.dark)) {
            const cachedUrl = getLogoUrl(cached, cached.theme);
            if (cachedUrl && isMounted) {
              setLogoUrl(cachedUrl);
              setIsLoading(false);
              return true;
            }
          }
        }
      } catch (error) {
        // Ignorer les erreurs de cache
      }
      return false;
    };

    // 2. Charger depuis les données réelles
    const loadFromData = () => {
      const hasCustomLogo = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
      
      if (hasCustomLogo) {
        // Sauvegarder dans le cache pour les prochains chargements
        try {
          localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify({
            light: customizationData.design.logo.light || null,
            dark: customizationData.design.logo.dark || null,
            theme: customizationData.design.theme || 'auto',
            timestamp: Date.now(),
          }));
        } catch (error) {
          // Ignorer les erreurs localStorage
        }

        const selectedLogoUrl = getLogoUrl(
          customizationData.design.logo,
          customizationData.design.theme
        );

        if (selectedLogoUrl) {
          // Précharger le logo pour éviter les flashs
          if (preloadImageRef.current) {
            preloadImageRef.current = null;
          }

          const img = new Image();
          preloadImageRef.current = img;
          img.src = selectedLogoUrl;
          
          img.onload = () => {
            if (isMounted && preloadImageRef.current === img) {
              setLogoUrl(selectedLogoUrl);
              setIsLoading(false);
            }
          };
          
          img.onerror = () => {
            if (isMounted && preloadImageRef.current === img) {
              setLogoUrl(null);
              setIsLoading(false);
            }
          };

          // Si l'image est déjà en cache du navigateur, onload peut ne pas se déclencher
          if (img.complete) {
            if (isMounted && preloadImageRef.current === img) {
              setLogoUrl(selectedLogoUrl);
              setIsLoading(false);
            }
          }
        } else {
          if (isMounted) {
            setLogoUrl(null);
            setIsLoading(false);
          }
        }
      } else {
        // Aucun logo configuré
        if (isMounted) {
          setLogoUrl(null);
          setIsLoading(false);
          // Nettoyer le cache si aucun logo n'est configuré
          try {
            localStorage.removeItem(LOGO_CACHE_KEY);
          } catch (error) {
            // Ignorer les erreurs localStorage
          }
        }
      }
    };

    // Stratégie de chargement :
    // 1. Si les données réelles sont disponibles, les utiliser
    // 2. Sinon, utiliser le cache
    const hasRealData = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
    
    if (hasRealData) {
      loadFromData();
    } else {
      const cacheLoaded = loadFromCache();
      if (!cacheLoaded) {
        setIsLoading(false);
        setLogoUrl(null);
      }
    }

    return () => {
      isMounted = false;
      if (preloadImageRef.current) {
        preloadImageRef.current.onload = null;
        preloadImageRef.current.onerror = null;
        preloadImageRef.current = null;
      }
    };
  }, [customizationData?.design?.logo, customizationData?.design?.theme, getLogoUrl]);

  // Écouter les changements de thème système pour mettre à jour le logo
  useEffect(() => {
    const theme = customizationData?.design?.theme || 'auto';
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Forcer la mise à jour du logo en recalculant l'URL
        const hasCustomLogo = customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
        if (hasCustomLogo && customizationData?.design?.logo) {
          const selectedLogoUrl = getLogoUrl(customizationData.design.logo, theme);
          setLogoUrl(selectedLogoUrl);
        } else {
          // Essayer depuis le cache
          try {
            const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
            if (cachedLogo) {
              const cached = JSON.parse(cachedLogo);
              if (cached.light || cached.dark) {
                const cachedUrl = getLogoUrl(cached, cached.theme || 'auto');
                setLogoUrl(cachedUrl);
              }
            }
          } catch (error) {
            // Ignorer les erreurs
          }
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [customizationData?.design?.logo, customizationData?.design?.theme, getLogoUrl]);

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

