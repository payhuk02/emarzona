/**
 * Import Optimization Utilities
 * Date: 28 Janvier 2025
 * 
 * Utilitaires pour optimiser les imports et réduire le bundle size
 */

import { logger } from '@/lib/logger';

/**
 * Lazy load un module avec gestion d'erreur
 */
export function lazyLoad<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<{ default: T }> {
  return importFn().catch((error) => {
    logger.error('Erreur lors du chargement du module', { error });
    if (fallback) {
      return { default: fallback };
    }
    throw error;
  });
}

/**
 * Précharger un module de manière asynchrone
 */
export function preloadModule<T>(
  importFn: () => Promise<{ default: T }>
): void {
  // Précharger le module en arrière-plan
  importFn().catch((error) => {
    logger.warn('Erreur lors du préchargement du module', { error });
  });
}

/**
 * Charger un module conditionnellement
 */
export async function conditionalImport<T>(
  condition: boolean,
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T | undefined> {
  if (!condition) {
    return fallback;
  }

  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    logger.error('Erreur lors de l\'import conditionnel', { error });
    return fallback;
  }
}

/**
 * Batch imports pour réduire les appels réseau
 */
export class ImportBatcher {
  private pending: Map<string, Promise<any>> = new Map();

  async batch<T>(
    key: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = importFn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pending.clear();
  }
}

export const importBatcher = new ImportBatcher();

