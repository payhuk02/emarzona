/**
 * Optimisations de Performance
 * Date: 1 Février 2025
 * 
 * Utilitaires pour améliorer les performances de l'application
 */

import { lazy, ComponentType } from 'react';

/**
 * Lazy loading avec preload
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadFn?: () => Promise<void>
) {
  const LazyComponent = lazy(importFn);

  if (preloadFn) {
    // Précharger le composant
    preloadFn();
  }

  return LazyComponent;
}

/**
 * Debounce amélioré avec options
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
): (...args: Parameters<T>) => void {
  let  timeoutId: NodeJS.Timeout | null = null;
  let  maxTimeoutId: NodeJS.Timeout | null = null;
  let  lastCallTime: number | null = null;
  let  lastInvokeTime= 0;
  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;
  const maxWait = options?.maxWait;

  const invokeFunc = (time: number) => {
    const args = lastCallTime !== null ? [] : [];
    lastInvokeTime = time;
    func(...args);
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : undefined;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === null ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  };

  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  };

  const trailingEdge = (time: number) => {
    timeoutId = null;

    if (trailing && lastCallTime !== null) {
      return invokeFunc(time);
    }
    lastCallTime = null;
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId);
    }
    lastInvokeTime = 0;
    lastCallTime = null;
    timeoutId = null;
    maxTimeoutId = null;
  };

  const flush = () => {
    return timeoutId === null ? undefined : trailingEdge(Date.now());
  };

  const pending = () => {
    return timeoutId !== null;
  };

  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(time);
      }
      if (maxWait !== undefined) {
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(time);
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait);
    }
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

/**
 * Throttle amélioré
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): (...args: Parameters<T>) => void {
  let  timeoutId: NodeJS.Timeout | null = null;
  let  lastCallTime= 0;
  const leading = options?.leading ?? true;
  const trailing = options?.trailing ?? true;

  const invokeFunc = (time: number) => {
    lastCallTime = time;
    func();
  };

  const leadingEdge = (time: number) => {
    lastCallTime = time;
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing) {
        invokeFunc(Date.now());
      }
    }, wait);
    return leading ? invokeFunc(time) : undefined;
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const timeSinceLastCall = time - lastCallTime;

    if (timeSinceLastCall >= wait) {
      return leadingEdge(time);
    }

    if (timeoutId === null && trailing) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        invokeFunc(Date.now());
      }, wait - timeSinceLastCall);
    }
  };

  return throttled;
}

/**
 * Intersection Observer pour lazy loading
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

/**
 * Virtual scrolling helper
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 5
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}

/**
 * Memoization avec cache LRU
 */
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      const value = this.cache.get(key)!;
      // Déplacer à la fin (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Supprimer le premier élément (least recently used)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Image lazy loading avec placeholder
 */
export function createImageLoader(
  src: string,
  placeholder?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (placeholder) {
      img.src = placeholder;
    }

    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Prefetch resources
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' | 'font' = 'script'): void {
  const link = document.createElement('link');
  link.rel = type === 'script' ? 'prefetch' : 'preload';
  link.href = url;
  
  if (type === 'style') {
    link.as = 'style';
  } else if (type === 'image') {
    link.as = 'image';
  } else if (type === 'font') {
    link.as = 'font';
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Batch updates pour React
 */
export function batchUpdates<T>(updates: (() => T)[], batchSize: number = 10): Promise<T[]> {
  return new Promise((resolve) => {
    const  results: T[] = [];
    let  index= 0;

    const processBatch = () => {
      const batch = updates.slice(index, index + batchSize);
      batch.forEach((update) => {
        results.push(update());
      });
      index += batchSize;

      if (index < updates.length) {
        requestAnimationFrame(processBatch);
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  measure(name: string, startMark?: string, endMark?: string): number | null {
    if (typeof performance !== 'undefined' && performance.measure) {
      if (startMark && endMark) {
        performance.measure(name, startMark, endMark);
      } else if (startMark) {
        performance.measure(name, startMark);
      } else {
        performance.measure(name);
      }

      const measure = performance.getEntriesByName(name, 'measure')[0] as PerformanceMeasure;
      if (measure) {
        this.measures.set(name, measure.duration);
        return measure.duration;
      }
    }
    return null;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Map<string, number> {
    return new Map(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();







