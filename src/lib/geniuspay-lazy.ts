/**
 * Lazy loading pour les modules GeniusPay
 * Optimise le bundle initial en chargeant GeniusPay uniquement lors du checkout
 * 
 * @module geniuspay-lazy
 */

/**
 * Charge le module de paiement GeniusPay de manière asynchrone
 * 
 * @returns {Promise<typeof import('./geniuspay-payment')>} Module de paiement GeniusPay
 * 
 * @example
 * ```typescript
 * const { initiateGeniusPayPayment } = await loadGeniusPayPayment();
 * const result = await initiateGeniusPayPayment({...});
 * ```
 */
export async function loadGeniusPayPayment() {
  const module = await import('./geniuspay-payment');
  return module;
}

/**
 * Charge le client GeniusPay de manière asynchrone
 * 
 * @returns {Promise<typeof import('./geniuspay-client')>} Client GeniusPay
 * 
 * @example
 * ```typescript
 * const { geniuspayClient } = await loadGeniusPayClient();
 * const payment = await geniuspayClient.createPayment({...});
 * ```
 */
export async function loadGeniusPayClient() {
  const module = await import('./geniuspay-client');
  return module;
}

/**
 * Charge les statistiques GeniusPay de manière asynchrone
 * 
 * @returns {Promise<typeof import('./geniuspay-stats')>} Module de statistiques GeniusPay
 * 
 * @example
 * ```typescript
 * const { getAllGeniusPayStats } = await loadGeniusPayStats();
 * const stats = await getAllGeniusPayStats();
 * ```
 */
export async function loadGeniusPayStats() {
  const module = await import('./geniuspay-stats');
  return module;
}

/**
 * Précharge les modules GeniusPay pour améliorer les performances
 * Appelé lors du hover sur le bouton de paiement ou lors de la navigation vers le checkout
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   prefetchGeniusPay();
 * }, []);
 * ```
 */
export function prefetchGeniusPay() {
  if (typeof window === 'undefined') {
    return; // SSR
  }

  // Utiliser requestIdleCallback si disponible (meilleure performance)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        loadGeniusPayPayment().catch(() => {
          // Ignorer les erreurs de préchargement silencieusement
        });
      },
      { timeout: 2000 } // Timeout de 2 secondes
    );
  } else {
    // Fallback pour les navigateurs sans requestIdleCallback
    // Utiliser setTimeout avec un délai raisonnable
    setTimeout(() => {
      loadGeniusPayPayment().catch(() => {
        // Ignorer les erreurs de préchargement silencieusement
      });
    }, 100);
  }
}






