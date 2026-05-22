/**
 * Enregistrement du Service Worker pour PWA
 */

import { logger } from './logger';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `/sw.js?v=${import.meta.env.VITE_BUILD_ID || 'dev'}`;
      navigator.serviceWorker
        .register(swUrl, { scope: '/', updateViaCache: 'none' })
        .then(registration => {
          logger.info('Service Worker enregistré avec succès', { scope: registration.scope });

          // Vérifier les mises à jour périodiquement
          setInterval(() => {
            registration.update();
          }, 60000); // Toutes les minutes

          // Écouter les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  logger.info('Nouveau Service Worker disponible');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  if (confirm('Une nouvelle version est disponible. Recharger la page ?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(error => {
          logger.error("Erreur lors de l'enregistrement du Service Worker", { error });
        });
    });
  }
}
