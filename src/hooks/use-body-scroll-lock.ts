/**
 * Hook pour verrouiller le scroll du body pendant l'ouverture d'un menu
 *
 * Objectifs mobile :
 * - Empêcher le scroll de fond pendant l'ouverture d'un Select / Dropdown
 * - Laisser uniquement le scroll interne du menu
 * - Éviter les conflits avec d'autres overlays (restaure toujours les styles initiaux)
 */

import { useEffect } from 'react';

/**
 * Verrouille le scroll du body tant que `enabled` est true.
 *
 * Important :
 * - Ne pas utiliser côté serveur (check `typeof document`)
 * - Toujours restaurer les styles à la désactivation/unmount
 */
export function useBodyScrollLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      return;
    }

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousTouchAction = (body.style as CSSStyleDeclaration & { touchAction?: string })
      .touchAction;

    // Bloquer le scroll de fond tout en laissant les interactions tactiles internes
    body.style.overflow = 'hidden';
    // Limiter les gestes globaux pour réduire les scrolls involontaires
    (body.style as CSSStyleDeclaration & { touchAction?: string }).touchAction = 'none';

    return () => {
      body.style.overflow = previousOverflow;
      (body.style as CSSStyleDeclaration & { touchAction?: string }).touchAction =
        previousTouchAction ?? '';
    };
  }, [enabled]);
}






