/**
 * Compteur de chunks de route en cours de chargement (Suspense fallback monté).
 * Permet à LoadingBar d'attendre la fin réelle du lazy(), pas un timer cosmétique.
 */

type Listener = () => void;

let chunkPending = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function beginRouteChunkLoad(): void {
  chunkPending += 1;
  emit();
}

export function endRouteChunkLoad(): void {
  chunkPending = Math.max(0, chunkPending - 1);
  emit();
}

export function getRouteChunkPendingCount(): number {
  return chunkPending;
}

export function subscribeRouteChunkPending(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper */
export function __resetRouteChunkPendingForTests(): void {
  chunkPending = 0;
  emit();
}
