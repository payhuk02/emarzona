import { useEffect, useRef } from 'react';

/** Intervalle par défaut pour remplacer les abonnements Realtime « liste » (90s). */
export const POLLING_INTERVAL_MS = 90_000;

/**
 * Rafraîchit les données par intervalle uniquement quand l’onglet est visible.
 * Réduit les connexions Realtime Supabase sur les écrans dashboard/admin.
 */
export function useVisibilityAwarePolling(
  callback: () => void,
  intervalMs = POLLING_INTERVAL_MS,
  enabled = true
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current();
      }
    };

    const intervalId = window.setInterval(tick, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs]);
}
