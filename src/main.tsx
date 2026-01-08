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
import { installConsoleGuard } from './lib/console-guard';

// Install console guard first to neutralize console.* in production
installConsoleGuard();

// Setup global error handlers (critique pour la gestion d'erreurs)
setupGlobalErrorHandlers();

// ✅ PERFORMANCE: Render immédiat pour améliorer FCP
// Les initialisations non-critiques seront effectuées après le render
createRoot(document.getElementById('root')!).render(<App />);

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
      // Validation d'environnement (non-bloquant)
      import('./lib/env-validator').then(({ validateEnv }) => {
        try {
          validateEnv();
          // logger sera importé ci-dessous
          import('./lib/logger').then(({ logger }) => {
            logger.info("✅ Variables d'environnement validées");
          });
        } catch (error) {
          import('./lib/logger').then(({ logger }) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error("❌ Erreur de validation des variables d'environnement", {
              error: errorMessage,
            });
            // En production, on ne peut pas continuer sans les variables requises
            if (import.meta.env.PROD) {
              throw error;
            }
          });
        }
      }),
      // Nettoyer le cache (non-bloquant)
      import('./utils/clearPayhukLogoCache').then(
        ({ clearPayhukLogoCache, clearAllPayhukReferences }) => {
          clearPayhukLogoCache();
          clearAllPayhukReferences();
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

    // Register Service Worker for PWA (production only) - Non-bloquant
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', {
            scope: '/',
            updateViaCache: 'none', // Toujours récupérer la dernière version du SW
          })
          .catch( error => {
            // Logger silencieusement
            import('./lib/logger').then(({ logger }) => {
              logger.warn('Service Worker registration failed', { error });
            });
          });
      });
    }
  });
}






