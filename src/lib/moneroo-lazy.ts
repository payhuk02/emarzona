/**
 * Lazy loading pour les modules Moneroo
 * Optimise le bundle initial en chargeant Moneroo uniquement lors du checkout
 * 
 * @module moneroo-lazy
 */

/**
 * Charge le module de paiement Moneroo de manière asynchrone
 * 
 * @returns {Promise<typeof import('./moneroo-payment')>} Module de paiement Moneroo
 * 
 * @example
 * ```typescript
 * const { initiateMonerooPayment } = await loadMonerooPayment();
 * const result = await initiateMonerooPayment({...});
 * ```
 */
export async function loadMonerooPayment() {
  const module = await import('./moneroo-payment');
  return module;
}

/**
 * Charge le client Moneroo de manière asynchrone
 * 
 * @returns {Promise<typeof import('./moneroo-client')>} Client Moneroo
 * 
 * @example
 * ```typescript
 * const { monerooClient } = await loadMonerooClient();
 * const payment = await monerooClient.createPayment({...});
 * ```
 */
export async function loadMonerooClient() {
  const module = await import('./moneroo-client');
  return module;
}

/**
 * Charge les statistiques Moneroo de manière asynchrone
 * 
 * @returns {Promise<typeof import('./moneroo-stats')>} Module de statistiques Moneroo
 * 
 * @example
 * ```typescript
 * const { getAllMonerooStats } = await loadMonerooStats();
 * const stats = await getAllMonerooStats();
 * ```
 */
export async function loadMonerooStats() {
  const module = await import('./moneroo-stats');
  return module;
}

/**
 * Précharge les modules Moneroo pour améliorer les performances
 * Appelé lors du hover sur le bouton de paiement ou lors de la navigation vers le checkout
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   prefetchMoneroo();
 * }, []);
 * ```
 */
export function prefetchMoneroo() {
  if (typeof window === 'undefined') {
    return; // SSR
  }

  // Utiliser requestIdleCallback si disponible (meilleure performance)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        loadMonerooPayment().catch(() => {
          // Ignorer les erreurs de préchargement silencieusement
        });
      },
      { timeout: 2000 } // Timeout de 2 secondes
    );
  } else {
    // Fallback pour les navigateurs sans requestIdleCallback
    // Utiliser setTimeout avec un délai raisonnable
    setTimeout(() => {
      loadMonerooPayment().catch(() => {
        // Ignorer les erreurs de préchargement silencieusement
      });
    }, 100);
  }
}
