/**
 * Hook pour obtenir le logo de la plateforme selon le thème
 * Utilise les logos personnalisés depuis la configuration si disponibles
 * Optimisé pour éviter les flashs et garantir la stabilité
 *
 * IMPORTANT: Retourne toujours un logo (personnalisé ou par défaut).
 * Si aucun logo personnalisé n'est configuré, retourne le logo Emarzona par défaut.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';

const LOGO_CACHE_KEY = 'platform-logo-cache';
// Logo Emarzona par défaut (toujours disponible)
const DEFAULT_LOGO = '/emarzona-logo.png';

/**
 * Obtient le logo approprié selon le thème actuel
 * @returns URL du logo (personnalisé ou par défaut, jamais null)
 */
export const usePlatformLogo = () => {
  const { customizationData } = usePlatformCustomizationContext();
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO);
  const [isLoading, setIsLoading] = useState(true);
  const preloadImageRef = useRef<HTMLImageElement | null>(null);

  // Nettoyer le cache au montage si il contient l'ancien logo Payhuk
  useEffect(() => {
    try {
      const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
      if (cachedLogo) {
        const cached = JSON.parse(cachedLogo);
        const hasPayhukReference =
          (cached.light && (cached.light.includes('payhuk') || cached.light.includes('Payhuk'))) ||
          (cached.dark && (cached.dark.includes('payhuk') || cached.dark.includes('Payhuk')));

        if (hasPayhukReference) {
          localStorage.removeItem(LOGO_CACHE_KEY);
        }
      }
    } catch (error) {
      // Ignorer les erreurs
    }
  }, []);

  // Précharger le logo par défaut dès le montage du composant
  useEffect(() => {
    const img = new Image();
    img.src = DEFAULT_LOGO;
    // Pas besoin d'attendre le chargement, le logo par défaut est déjà défini dans useState
  }, []);

  // Fonction pour déterminer l'URL du logo selon le thème
  const getLogoUrl = useMemo(() => {
    return (logoData: { light?: string | null; dark?: string | null }, theme?: string) => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
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
      return logoData.light || logoData.dark || DEFAULT_LOGO;
    };
  }, []);

  // Charger le logo depuis le cache ou les données réelles
  useEffect(() => {
    let isMounted = true;

    // Nettoyer le cache si il contient l'ancien logo Payhuk
    try {
      const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
      if (cachedLogo) {
        const cached = JSON.parse(cachedLogo);
        // Vérifier si le cache contient des références à Payhuk
        const hasPayhukReference =
          (cached.light && (cached.light.includes('payhuk') || cached.light.includes('Payhuk'))) ||
          (cached.dark && (cached.dark.includes('payhuk') || cached.dark.includes('Payhuk')));

        if (hasPayhukReference) {
          // Nettoyer le cache si il contient l'ancien logo
          localStorage.removeItem(LOGO_CACHE_KEY);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de cache
    }

    // 1. Essayer de charger depuis le cache localStorage (pour mobile)
    const loadFromCache = () => {
      try {
        const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
        if (cachedLogo) {
          const cached = JSON.parse(cachedLogo);
          const hasRealData =
            customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;

          // Vérifier que le cache ne contient pas l'ancien logo Payhuk
          const hasPayhukReference =
            (cached.light &&
              (cached.light.includes('payhuk') || cached.light.includes('Payhuk'))) ||
            (cached.dark && (cached.dark.includes('payhuk') || cached.dark.includes('Payhuk')));

          if (hasPayhukReference) {
            // Nettoyer le cache et utiliser le logo par défaut
            localStorage.removeItem(LOGO_CACHE_KEY);
            return false;
          }

          // Utiliser le cache seulement si les données réelles ne sont pas encore chargées
          if (!hasRealData && (cached.light || cached.dark)) {
            const cachedUrl = getLogoUrl(cached, cached.theme || 'auto');
            if (cachedUrl && isMounted) {
              // Vérifier que l'URL ne contient pas Payhuk
              if (cachedUrl.includes('payhuk') || cachedUrl.includes('Payhuk')) {
                localStorage.removeItem(LOGO_CACHE_KEY);
                setLogoUrl(DEFAULT_LOGO);
                setIsLoading(false);
                return false;
              }

              // Précharger l'image depuis le cache pour vérifier qu'elle est accessible
              const img = new Image();
              img.src = cachedUrl;
              img.onload = () => {
                if (isMounted) {
                  setLogoUrl(cachedUrl);
                  setIsLoading(false);
                }
              };
              img.onerror = () => {
                // Si l'image du cache ne charge pas, utiliser le logo par défaut
                if (isMounted) {
                  setIsLoading(false);
                  setLogoUrl(DEFAULT_LOGO);
                }
              };
              // Si l'image est déjà en cache navigateur
              if (img.complete && isMounted) {
                setLogoUrl(cachedUrl);
                setIsLoading(false);
              }
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
      const hasCustomLogo =
        customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;

      if (hasCustomLogo) {
        // Sauvegarder dans le cache pour les prochains chargements
        try {
          localStorage.setItem(
            LOGO_CACHE_KEY,
            JSON.stringify({
              light: customizationData.design.logo.light || null,
              dark: customizationData.design.logo.dark || null,
              theme: customizationData.design.theme || 'auto',
              timestamp: Date.now(),
            })
          );
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
            // Si le logo personnalisé ne charge pas, utiliser le logo par défaut
            logger.warn('Custom logo failed to load, falling back to default', {
              failedUrl: selectedLogoUrl,
              defaultLogo: DEFAULT_LOGO,
            });
            if (isMounted && preloadImageRef.current === img) {
              // Essayer le logo par défaut
              const defaultImg = new Image();
              defaultImg.src = DEFAULT_LOGO;
              defaultImg.onload = () => {
                if (isMounted) {
                  setLogoUrl(DEFAULT_LOGO);
                  setIsLoading(false);
                }
              };
              defaultImg.onerror = () => {
                // Même le logo par défaut ne charge pas, garder l'URL mais logger l'erreur
                logger.error('Default logo also failed to load', { defaultLogo: DEFAULT_LOGO });
                if (isMounted) {
                  setLogoUrl(DEFAULT_LOGO); // Retourner quand même l'URL pour le fallback UI
                  setIsLoading(false);
                }
              };
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
          // Si aucun logo valide n'est trouvé, utiliser le logo par défaut
          if (isMounted) {
            setLogoUrl(DEFAULT_LOGO);
            setIsLoading(false);
          }
        }
      } else {
        // Aucun logo personnalisé configuré, utiliser le logo par défaut
        if (isMounted) {
          setLogoUrl(DEFAULT_LOGO);
          setIsLoading(false);
          // Nettoyer le cache si aucun logo personnalisé n'est configuré
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
    const hasRealData =
      customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;

    if (hasRealData) {
      loadFromData();
    } else {
      const cacheLoaded = loadFromCache();
      if (!cacheLoaded) {
        // Aucun logo personnalisé ni cache, utiliser le logo par défaut
        setIsLoading(false);
        setLogoUrl(DEFAULT_LOGO);
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
        const hasCustomLogo =
          customizationData?.design?.logo?.light || customizationData?.design?.logo?.dark;
        if (hasCustomLogo && customizationData?.design?.logo) {
          const selectedLogoUrl = getLogoUrl(customizationData.design.logo, theme);
          setLogoUrl(selectedLogoUrl);
        } else {
          // Essayer depuis le cache, sinon utiliser le logo par défaut
          try {
            const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
            if (cachedLogo) {
              const cached = JSON.parse(cachedLogo);
              if (cached.light || cached.dark) {
                const cachedUrl = getLogoUrl(cached, cached.theme || 'auto');
                setLogoUrl(cachedUrl || DEFAULT_LOGO);
              } else {
                setLogoUrl(DEFAULT_LOGO);
              }
            } else {
              setLogoUrl(DEFAULT_LOGO);
            }
          } catch (error) {
            // En cas d'erreur, utiliser le logo par défaut
            setLogoUrl(DEFAULT_LOGO);
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
  return customizationData?.design?.logo?.light || DEFAULT_LOGO;
};

/**
 * Obtient le logo dark spécifiquement
 */
export const usePlatformLogoDark = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.dark || DEFAULT_LOGO;
};

/**
 * Obtient le favicon
 */
export const usePlatformFavicon = () => {
  const { customizationData } = usePlatformCustomizationContext();
  return customizationData?.design?.logo?.favicon || null;
};
