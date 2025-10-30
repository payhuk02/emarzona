import { useEffect, useState } from 'react';

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
        const images = document.querySelectorAll('img');
        images.forEach(img => {
          img.loading = 'lazy';
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
      // Boutons sans texte
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
          button.setAttribute('aria-label', 'Bouton');
        }
      });

      // Images sans alt
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.getAttribute('alt')) {
          img.setAttribute('alt', 'Image');
        }
      });

      // Liens sans texte
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        if (!link.getAttribute('aria-label') && !link.textContent?.trim()) {
          link.setAttribute('aria-label', 'Lien');
        }
      });

      // Améliorer la navigation au clavier
      const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
      focusableElements.forEach(element => {
        element.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            element.click();
          }
        });
      });
    };

    // Appliquer les améliorations
    enhanceAccessibility();

    // Observer les changements DOM pour appliquer aux nouveaux éléments
    const observer = new MutationObserver(() => {
      enhanceAccessibility();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
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
    highContrast: false
  });

  useEffect(() => {
    // Détecter les préférences système
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
      highContrast: window.matchMedia('(prefers-contrast: high)')
    };

    const updatePreferences = () => {
      setPreferences({
        reducedMotion: mediaQueries.reducedMotion.matches,
        darkMode: mediaQueries.darkMode.matches,
        highContrast: mediaQueries.highContrast.matches
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
      const imageObserver = new IntersectionObserver((entries) => {
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
