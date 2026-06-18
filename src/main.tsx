// CRITIQUE: Importer React explicitement en premier pour garantir qu'il est disponible
// avant tous les autres imports qui pourraient utiliser React.forwardRef ou React.memo
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
// ✅ PERFORMANCE: CSS critiques chargés immédiatement pour FCP
// Note: Vite optimise automatiquement les imports CSS (minification, code splitting)
import './index.css';
import './styles/product-banners.css';
import './styles/reviews-dark-mode.css';
import './styles/reviews-mobile.css';

// ✅ PERFORMANCE: Injecter le CSS critique pour améliorer le FCP
import { injectCriticalCSS, loadNonCriticalCSS } from './lib/critical-css';
injectCriticalCSS();

// ✅ PERFORMANCE: Charger le CSS non-critique après le rendu initial
// Utilise requestIdleCallback pour ne pas bloquer le FCP
loadNonCriticalCSS();

// ✅ PERFORMANCE: Initialisations critiques uniquement (nécessaires pour le fonctionnement de base)
import { setupGlobalErrorHandlers } from './lib/error-logger';
import { installChunkLoadRecovery } from './lib/chunk-load-recovery';
import { installConsoleGuard } from './lib/console-guard';
import { validateEnv } from './lib/env-validator';

// Valider les variables d'environnement au démarrage pour "fail fast"
try {
  validateEnv();
} catch (error) {
  if (import.meta.env.PROD) {
    throw error;
  } else {
    console.error("❌ Erreur de validation des variables d'environnement", error);
  }
}

const LOVABLE_HOST_REGEX = /(?:^|\.)lovable\.app$/i;

const cleanupHostedServiceWorkerArtifacts = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter(name => name.startsWith('emarzona-')).map(name => caches.delete(name))
      );
    }

    import('./lib/logger').then(({ logger }) =>
      logger.info('Hosted SW artifacts cleared (lovable.app)')
    );
  } catch (error) {
    import('./lib/logger').then(({ logger }) =>
      logger.warn('Unable to clear hosted SW artifacts', { error })
    );
  }
};

// Install console guard first to neutralize console.* in production
installConsoleGuard();

// Setup global error handlers (critique pour la gestion d'erreurs)
setupGlobalErrorHandlers();
installChunkLoadRecovery();

// ✅ PERFORMANCE: Render immédiat pour améliorer FCP
// Les initialisations non-critiques seront effectuées après le render
createRoot(document.getElementById('root')!).render(<App />);

// Retire le contenu SEO statique injecté dans index.html après hydratation React
// (il reste visible pour les crawlers/LLM qui n'exécutent pas le JS).
if (typeof document !== 'undefined') {
  const seoFallback = document.getElementById('seo-fallback');
  if (seoFallback) seoFallback.remove();
  document.querySelectorAll('script[data-seo-static]').forEach(el => el.remove());
}

// ✅ PERFORMANCE: Initialisations non-critiques après le premier render
// Ces initialisations ne bloquent pas le FCP (First Contentful Paint)
if (typeof window !== 'undefined') {
  // Utiliser requestIdleCallback si disponible, sinon setTimeout avec délai minimal
  const scheduleNonCriticalInit = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 0);
    }
  };

  scheduleNonCriticalInit(() => {
    // Initialiser les modules non-critiques de manière asynchrone
    Promise.all([
      // Nettoyer le cache (non-bloquant)
      import('./utils/clearLegacyLogoCache').then(
        ({ clearLegacyLogoCache, clearAllLegacyLogoReferences }) => {
          clearLegacyLogoCache();
          clearAllLegacyLogoReferences();
        }
      ),
      // Initialiser i18n (non-critique pour FCP)
      import('./i18n/config'),
      // Monitoring APM (non-critique pour FCP)
      import('./lib/apm-monitoring').then(({ initAPMMonitoring }) => {
        initAPMMonitoring();
      }),
      // Connexions CDN (non-critique pour FCP)
      import('./lib/cdn-config').then(({ initCDNConnections }) => {
        initCDNConnections();
      }),
      // Accessibilité (non-critique pour FCP)
      import('./lib/accessibility').then(({ initAccessibility }) => {
        initAccessibility();
      }),
    ]).catch(error => {
      // Logger l'erreur silencieusement
      import('./lib/logger')
        .then(({ logger }) => {
          logger.error('Error initializing non-critical modules', { error });
        })
        .catch(() => {
          // Fallback silencieux si logger n'est pas disponible
          // Ne pas utiliser console.error ici pour éviter les warnings
        });
    });

    // Service Worker: désactivé sur lovable.app pour éviter les caches/chunks obsolètes
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const isLovableHosted = LOVABLE_HOST_REGEX.test(window.location.hostname);

      if (isLovableHosted) {
        void cleanupHostedServiceWorkerArtifacts();
      } else {
        const swUrl = `/sw.js?v=${import.meta.env.VITE_BUILD_ID || 'dev'}`;

        const registerServiceWorker = () => {
          navigator.serviceWorker
            .register(swUrl, {
              scope: '/',
              updateViaCache: 'none',
            })
            .then(registration => {
              registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                  if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                    worker.postMessage({ type: 'SKIP_WAITING' });
                    import('./lib/logger').then(({ logger }) => {
                      logger.info('Service Worker update — reloading app');
                    });
                    window.location.reload();
                  }
                });
              });
            })
            .catch(error => {
              import('./lib/logger').then(({ logger }) => {
                logger.warn('Service Worker registration failed', { error });
              });
            });
        };

        window.addEventListener('load', registerServiceWorker);
      }
    }
  });
}
