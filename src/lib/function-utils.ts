/**
 * Utilitaires pour les fonctions
 * Fournit des fonctions réutilisables pour manipuler et optimiser les fonctions
 */

// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

/**
 * Crée une fonction debounced
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Crée une fonction debounced qui retourne une Promise
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolve: ((value: ReturnType<T>) => void) | null = null;
  let reject: ((error: unknown) => void) | null = null;

  return function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise<ReturnType<T>>((res, rej) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (resolve) {
        resolve = res;
      } else {
        resolve = res;
      }
      reject = rej;

      timeout = setTimeout(async () => {
        try {
          const result = await func.apply(this, args);
          resolve?.(result);
        } catch (error) {
          reject?.(error);
        } finally {
          resolve = null;
          reject = null;
        }
      }, wait);
    });
  };
}

/**
 * Crée une fonction throttled
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Crée une fonction throttled qui retourne une Promise
 */
export function throttleAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let inThrottle: boolean = false;
  let lastResult: Promise<ReturnType<T>> | null = null;

  return function (this: unknown, ...args: Parameters<T>): Promise<ReturnType<T>> {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult!;
  };
}

/**
 * Mémorise le résultat d'une fonction
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Crée une fonction qui ne peut être appelée qu'une fois
 */
export function once<T extends (...args: unknown[]) => unknown>(func: T): T {
  let called = false;
  let result: ReturnType<T>;

  return ((...args: Parameters<T>): ReturnType<T> => {
    if (!called) {
      called = true;
      result = func(...args);
    }
    return result;
  }) as T;
}

/**
 * Crée une fonction qui ignore les appels multiples rapides
 */
export function ignoreConcurrent<T extends (...args: unknown[]) => Promise<unknown>>(func: T): T {
  let inProgress = false;
  let lastPromise: Promise<ReturnType<T>> | null = null;

  return ((...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (inProgress && lastPromise) {
      return lastPromise;
    }

    inProgress = true;
    lastPromise = func(...args).finally(() => {
      inProgress = false;
    });

    return lastPromise;
  }) as T;
}

/**
 * Crée une fonction qui retry automatiquement en cas d'échec
 */
export function withRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  func: T,
  maxRetries: number = 3,
  delay: number = 1000
): T {
  return ((...args: Parameters<T>): Promise<ReturnType<T>> => {
    let _lastError: unknown;
    let attempt = 0;

    const execute = async (): Promise<ReturnType<T>> => {
      try {
        return await func(...args);
      } catch (error) {
        _lastError = error;
        attempt++;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          return execute();
        }

        throw error;
      }
    };

    return execute();
  }) as T;
}

/**
 * Crée une fonction qui mesure le temps d'exécution
 */
export function withTiming<T extends (...args: unknown[]) => unknown>(
  func: T,
  onTiming?: (duration: number, args: Parameters<T>) => void
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now();
    const result = func(...args);
    const duration = performance.now() - start;

    if (onTiming) {
      onTiming(duration, args);
    }

    return result;
  }) as T;
}

/**
 * Crée une fonction qui log les appels
 */
export function withLogging<T extends (...args: unknown[]) => unknown>(func: T, name?: string): T {
  const funcName = name || func.name || 'anonymous';

  return ((...args: Parameters<T>): ReturnType<T> => {
    // ✅ PHASE 2: Remplacer console.log par logger (debug level)
    logger.debug(`[${funcName}] Called with:`, { args, funcName });
    const result = func(...args);
    logger.debug(`[${funcName}] Returned:`, { result, funcName });
    return result;
  }) as T;
}

/**
 * Compose plusieurs fonctions
 */
export function compose<T extends (...args: unknown[]) => unknown>(
  ...funcs: Array<(arg: unknown) => unknown>
): T {
  return ((...args: unknown[]) => {
    return funcs.reduceRight((acc, func) => func(acc), funcs[funcs.length - 1](...args));
  }) as T;
}

/**
 * Pipe plusieurs fonctions
 */
export function pipe<T extends (...args: unknown[]) => unknown>(
  ...funcs: Array<(arg: unknown) => unknown>
): T {
  return ((...args: unknown[]) => {
    return funcs.reduce((acc, func) => func(acc), funcs[0](...args));
  }) as T;
}
