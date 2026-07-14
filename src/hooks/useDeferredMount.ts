import { useEffect, useState } from 'react';

/**
 * Retarde le montage d'une section non critique (graphiques, listes…) après le premier paint.
 */
export function useDeferredMount(enabled = true, idleTimeoutMs = 1200) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }

    const mount = () => setReady(true);

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(mount, { timeout: idleTimeoutMs });
      return () => cancelIdleCallback(id);
    }

    const timer = setTimeout(mount, 80);
    return () => clearTimeout(timer);
  }, [enabled, idleTimeoutMs]);

  return ready;
}
