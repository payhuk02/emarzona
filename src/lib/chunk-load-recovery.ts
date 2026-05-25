/**
 * Récupération automatique après échec de chargement de chunk Vite (souvent corrigé par F5).
 */
const CHUNK_RELOAD_SESSION_KEY = 'emarzona_chunk_reload_at';
const CHUNK_RELOAD_COOLDOWN_MS = 15_000;

function getErrorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message;
  if (typeof reason === 'string') return reason;
  if (reason && typeof reason === 'object' && 'message' in reason) {
    return String((reason as { message: unknown }).message);
  }
  return String(reason ?? '');
}

export function isChunkLoadErrorMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch dynamically imported module') ||
    lower.includes('importing a module script failed') ||
    lower.includes('error loading dynamically imported module') ||
    lower.includes('chunkloaderror') ||
    lower.includes('loading chunk') ||
    lower.includes('dynamically imported module')
  );
}

function shouldReloadForChunkError(): boolean {
  const last = sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY);
  if (!last) return true;
  const elapsed = Date.now() - Number(last);
  return Number.isNaN(elapsed) || elapsed > CHUNK_RELOAD_COOLDOWN_MS;
}

function reloadOnceForChunkError(): boolean {
  if (!shouldReloadForChunkError()) return false;
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, String(Date.now()));
  window.location.reload();
  return true;
}

/**
 * À appeler une fois au démarrage (main.tsx).
 */
export function installChunkLoadRecovery(): void {
  window.addEventListener('unhandledrejection', event => {
    const message = getErrorMessage(event.reason);
    if (!isChunkLoadErrorMessage(message)) return;
    if (reloadOnceForChunkError()) {
      event.preventDefault();
    }
  });

  window.addEventListener(
    'error',
    event => {
      const message = event.message || getErrorMessage(event.error);
      if (!isChunkLoadErrorMessage(message)) return;
      if (reloadOnceForChunkError()) {
        event.preventDefault();
      }
    },
    true
  );
}
