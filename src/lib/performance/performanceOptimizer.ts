/**
 * Performance Optimizer
 * Date: 30 Janvier 2025
 * 
 * Utilitaires pour optimiser les performances de l'application
 */

import { useMemo, useCallback, memo } from 'react';
import { logger } from '../logger';

// =====================================================
// DEBOUNCE & THROTTLE
// =====================================================

/**
 * Debounce function - Retarde l'exécution d'une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - Limite l'exécution d'une fonction
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// =====================================================
// LAZY LOADING
// =====================================================

/**
 * Lazy load images
 */
export function lazyLoadImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });
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

// =====================================================
// MEMOIZATION HELPERS
// =====================================================

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
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
 * Clear memoization cache
 */
export function clearMemoizationCache<T extends (...args: any[]) => any>(
  memoizedFunc: T
): void {
  // This is a placeholder - actual implementation depends on cache structure
  // In a real scenario, you'd need to expose the cache or use a WeakMap
}

// =====================================================
// CODE SPLITTING HELPERS
// =====================================================

/**
 * Dynamic import helper
 */
export async function dynamicImport<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    logger.error('Dynamic import failed', { error });
    throw error;
  }
}

// =====================================================
// PERFORMANCE MONITORING
// =====================================================

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  label: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;

  if (duration > 100) {
    logger.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  } else {
    logger.log(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Measure async function execution time
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (duration > 1000) {
    logger.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  } else {
    logger.log(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  }

  return result;
}

// =====================================================
// REACT PERFORMANCE HELPERS
// =====================================================

/**
 * Memoized component wrapper
 */
export function memoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return memo(Component, areEqual);
}

/**
 * Custom hook for memoized callbacks
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

/**
 * Custom hook for memoized values
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

// =====================================================
// BUNDLE OPTIMIZATION
// =====================================================

/**
 * Preload resource
 */
export function preloadResource(href: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Prefetch resource
 */
export function prefetchResource(href: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Preconnect to domain
 */
export function preconnectDomain(href: string): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  document.head.appendChild(link);
}

// =====================================================
// CACHE MANAGEMENT
// =====================================================

/**
 * Simple in-memory cache
 */
export class SimpleCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 5 * 60 * 1000) {
    this.ttl = ttl;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: K): boolean {
    return this.cache.has(key) && this.get(key) !== undefined;
  }
}

