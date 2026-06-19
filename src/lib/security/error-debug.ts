/**
 * Contrôle l'affichage des détails d'erreur techniques dans l'UI.
 *
 * En production, les messages techniques ne sont jamais exposés via un simple
 * query param public. Un token secret (VITE_ERROR_DEBUG_TOKEN) est requis.
 */
export function canShowErrorDetails(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }

  const debugToken = import.meta.env.VITE_ERROR_DEBUG_TOKEN;
  if (!debugToken || typeof debugToken !== 'string' || debugToken.length < 16) {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('debug_token') === debugToken;
}
