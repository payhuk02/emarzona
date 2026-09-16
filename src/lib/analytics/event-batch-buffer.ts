/**
 * LOT 4 Disk I/O — buffer client pour INSERT analytics par lots.
 *
 * Event → buffer → flush (taille / délai / unload) → INSERT multi-rows
 *
 * Kill-switch (réversible) :
 *   localStorage.setItem('emarzona_analytics_batch', '0')
 *   ou VITE_ANALYTICS_BATCH=false
 */

import { logger } from '@/lib/logger';

export type BatchFlushFn<T> = (rows: T[]) => Promise<void>;

type BufferOptions = {
  name: string;
  maxBatchSize?: number;
  flushIntervalMs?: number;
};

const DEFAULT_MAX = 20;
const DEFAULT_INTERVAL_MS = 15_000;

function batchingEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (import.meta.env.VITE_ANALYTICS_BATCH === 'false') return false;
    if (localStorage.getItem('emarzona_analytics_batch') === '0') return false;
  } catch {
    // ignore storage errors
  }
  return true;
}

export function createEventBatchBuffer<T>(flushFn: BatchFlushFn<T>, options: BufferOptions) {
  const maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX;
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_INTERVAL_MS;
  let queue: T[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;
  let listenersBound = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const schedule = () => {
    if (timer || typeof window === 'undefined') return;
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, flushIntervalMs);
  };

  const flush = async (): Promise<void> => {
    if (flushing || queue.length === 0) return;
    flushing = true;
    clearTimer();
    const batch = queue;
    queue = [];
    try {
      await flushFn(batch);
    } catch (error) {
      logger.warn(`[analytics-batch] ${options.name} flush failed`, {
        error,
        count: batch.length,
      });
      // Remettre en tête (best-effort, plafonné)
      queue = [...batch.slice(0, maxBatchSize), ...queue].slice(0, maxBatchSize * 2);
      schedule();
    } finally {
      flushing = false;
      if (queue.length > 0) schedule();
    }
  };

  const bindLifecycle = () => {
    if (listenersBound || typeof window === 'undefined') return;
    listenersBound = true;

    const onHide = () => {
      void flush();
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') onHide();
    });
    window.addEventListener('pagehide', onHide);
  };

  const enqueue = (row: T, opts?: { immediate?: boolean }): void => {
    if (!batchingEnabled()) {
      void flushFn([row]).catch(error => {
        logger.warn(`[analytics-batch] ${options.name} sync insert failed`, { error });
      });
      return;
    }

    bindLifecycle();
    queue.push(row);

    if (opts?.immediate || queue.length >= maxBatchSize) {
      void flush();
      return;
    }
    schedule();
  };

  const pendingCount = () => queue.length;

  return { enqueue, flush, pendingCount, batchingEnabled };
}
