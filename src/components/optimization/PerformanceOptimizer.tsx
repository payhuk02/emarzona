import { useEffect, useState } from 'react';
import { getPerformanceMonitor } from '@/lib/performance-monitor';
import { logger } from '@/lib/logger';

/**
 * Composant d'optimisation des performances mobile
 * Applique des optimisations spécifiques pour les appareils mobiles
 */
export const MobilePerformanceOptimizer = () => {
  useEffect(() => {
    const optimizeForMobile = () => {
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // Réduire les animations sur mobile pour économiser la batterie
        document.documentElement.style.setProperty('--transition-smooth', 'all 0.2s ease');

        // Optimiser les images pour mobile
        // ⚠️ LCP: ne pas forcer `loading="lazy"` sur les images au-dessus de la ligne de flottaison.
        // On vise uniquement les images hors écran / non critiques.
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          const rect = img.getBoundingClientRect();
          const isAboveTheFold = rect.top >= 0 && rect.top < window.innerHeight;
          const isExplicitEager = img.getAttribute('loading') === 'eager';
          const isOptOut = img.hasAttribute('data-no-mobile-opt');

          if (!isAboveTheFold && !isExplicitEager && !isOptOut) {
            img.loading = 'lazy';
          }
          img.decoding = 'async';

          // Ajouter des attributs pour l'optimisation mobile
          if (!img.getAttribute('sizes')) {
            img.setAttribute('sizes', '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw');
          }
        });

        // Suppression des préchargements non garantis (évite 404/CSP en production)
      }
    };

    // Appliquer les optimisations au chargement
    optimizeForMobile();

    // Réappliquer lors du redimensionnement
    const handleResize = () => {
      optimizeForMobile();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null;
};

/**
 * Composant d'amélioration de l'accessibilité
 * Ajoute des améliorations d'accessibilité automatiques
 */
export const AccessibilityEnhancer = () => {
  useEffect(() => {
    // Ajouter des attributs ARIA manquants
    const enhanceAccessibility = () => {
      // ⚠️ PERF: éviter de scanner tout le DOM et d'ajouter des listeners à chaque élément.
      // On applique uniquement des fallbacks légers d'attributs quand ils sont manquants.

      // Boutons sans texte (souvent des boutons icône)
      document.querySelectorAll('button').forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
          button.setAttribute('aria-label', 'Bouton');
        }
      });

      // Images sans alt (fallback minimal)
      document.querySelectorAll('img').forEach(img => {
        if (!img.getAttribute('alt')) {
          img.setAttribute('alt', 'Image');
        }
      });

      // Liens sans texte (fallback minimal)
      document.querySelectorAll('a').forEach(link => {
        if (!link.getAttribute('aria-label') && !link.textContent?.trim()) {
          link.setAttribute('aria-label', 'Lien');
        }
      });
    };

    // Appliquer les améliorations
    enhanceAccessibility();

    // Observer les changements DOM pour appliquer aux nouveaux éléments
    let rafId: number | null = null;
    const observer = new MutationObserver(mutations => {
      // Filtrer: ne réagir que si des noeuds sont ajoutés.
      const hasAddedNodes = mutations.some(m => m.addedNodes && m.addedNodes.length > 0);
      if (!hasAddedNodes) return;

      // Debounce via rAF pour éviter d'exécuter N fois par frame.
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        enhanceAccessibility();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
      }
      observer.disconnect();
    };
  }, []);

  return null;
};

/**
 * Hook pour détecter les préférences utilisateur
 */
export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    darkMode: false,
    highContrast: false,
  });

  useEffect(() => {
    // Détecter les préférences système
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
    };

    const updatePreferences = () => {
      setPreferences({
        reducedMotion: mediaQueries.reducedMotion.matches,
        darkMode: mediaQueries.darkMode.matches,
        highContrast: mediaQueries.highContrast.matches,
      });
    };

    // Appliquer les préférences initiales
    updatePreferences();

    // Écouter les changements
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, []);

  return preferences;
};

/**
 * Composant d'optimisation des performances globales
 */
export const PerformanceOptimizer = () => {
  const preferences = useUserPreferences();

  useEffect(() => {
    // Différer l'initialisation du monitoring des performances
    const initPerformanceMonitoring = () => {
      const monitor = getPerformanceMonitor();

      // Logger le rapport de performance après 10 secondes (différé)
      setTimeout(() => {
        const report = monitor.getReport();
        if (import.meta.env.DEV) {
          logger.info('📊 Performance Report', { report });
        }
      }, 10000); // Augmenté à 10 secondes
    };

    // Initialiser seulement si pas en mode production ou si demandé
    if (import.meta.env.DEV || window.location.search.includes('perf=1')) {
      // Différer encore plus en production
      setTimeout(initPerformanceMonitoring, 2000);
    }
    // Appliquer les préférences utilisateur
    if (preferences.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Optimisations de performance
    const optimizePerformance = () => {
      // Lazy loading pour les images
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src || '';
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));

      // Ne pas précharger des ressources qui peuvent ne pas exister côté CDN
    };

    optimizePerformance();
  }, [preferences]);

  return (
    <>
      <MobilePerformanceOptimizer />
      <AccessibilityEnhancer />
    </>
  );
};
