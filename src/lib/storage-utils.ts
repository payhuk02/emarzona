/**
 * Utilitaires pour la gestion du stockage (localStorage, sessionStorage)
 * Fournit des fonctions réutilisables pour gérer le stockage de manière sécurisée
 */

// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export type StorageType = 'localStorage' | 'sessionStorage';

export interface StorageOptions {
  /**
   * Type de stockage
   * @default 'localStorage'
   */
  type?: StorageType;
  /**
   * Encoder/décoder automatiquement en JSON
   * @default true
   */
  json?: boolean;
}

/**
 * Obtient l'objet Storage approprié
 */
function getStorage(type: StorageType = 'localStorage'): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return type === 'localStorage' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Vérifie si le stockage est disponible
 */
export function isStorageAvailable(type: StorageType = 'localStorage'): boolean {
  const storage = getStorage(type);
  if (!storage) {
    return false;
  }

  try {
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Définit une valeur dans le stockage
 */
export function setStorageItem(key: string, value: unknown, options: StorageOptions = {}): boolean {
  const { type = 'localStorage', json = true } = options;
  const storage = getStorage(type);

  if (!storage) {
    // ✅ PHASE 2: Remplacer console.warn par logger
    logger.warn(`Storage (${type}) is not available`);
    return false;
  }

  try {
    const stringValue = json ? JSON.stringify(value) : String(value);
    storage.setItem(key, stringValue);
    return true;
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error(`Error setting storage item ${key}`, { error, key, type });
    return false;
  }
}

/**
 * Obtient une valeur du stockage
 */
export function getStorageItem<T = unknown>(key: string, options: StorageOptions = {}): T | null {
  const { type = 'localStorage', json = true } = options;
  const storage = getStorage(type);

  if (!storage) {
    return null;
  }

  try {
    const item = storage.getItem(key);
    if (item === null) {
      return null;
    }

    if (json) {
      return JSON.parse(item) as T;
    }

    return item as T;
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error(`Error getting storage item ${key}`, { error, key, type });
    return null;
  }
}

/**
 * Supprime une valeur du stockage
 */
export function removeStorageItem(key: string, type: StorageType = 'localStorage'): boolean {
  const storage = getStorage(type);

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(key);
    return true;
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error(`Error removing storage item ${key}`, { error, key, type });
    return false;
  }
}

/**
 * Vérifie si une clé existe dans le stockage
 */
export function hasStorageItem(key: string, type: StorageType = 'localStorage'): boolean {
  const storage = getStorage(type);
  if (!storage) {
    return false;
  }

  return storage.getItem(key) !== null;
}

/**
 * Obtient toutes les clés du stockage
 */
export function getStorageKeys(type: StorageType = 'localStorage'): string[] {
  const storage = getStorage(type);
  if (!storage) {
    return [];
  }

  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Obtient toutes les valeurs du stockage
 */
export function getAllStorageItems(type: StorageType = 'localStorage'): Record<string, unknown> {
  const storage = getStorage(type);
  if (!storage) {
    return {};
  }

  const items: Record<string, unknown> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      try {
        const value = storage.getItem(key);
        if (value) {
          items[key] = JSON.parse(value);
        }
      } catch {
        // Si le parsing échoue, garder la valeur brute
        const value = storage.getItem(key);
        if (value) {
          items[key] = value;
        }
      }
    }
  }
  return items;
}

/**
 * Vide tout le stockage
 */
export function clearStorage(type: StorageType = 'localStorage'): boolean {
  const storage = getStorage(type);
  if (!storage) {
    return false;
  }

  try {
    storage.clear();
    return true;
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error(`Error clearing storage (${type})`, { error, type });
    return false;
  }
}

/**
 * Obtient la taille du stockage utilisée (approximative)
 */
export function getStorageSize(type: StorageType = 'localStorage'): number {
  const storage = getStorage(type);
  if (!storage) {
    return 0;
  }

  let size = 0;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      const value = storage.getItem(key);
      if (value) {
        size += key.length + value.length;
      }
    }
  }
  return size;
}

/**
 * Obtient ou définit une valeur avec une valeur par défaut
 */
export function getOrSetStorageItem<T>(
  key: string,
  defaultValue: T,
  options: StorageOptions = {}
): T {
  const existing = getStorageItem<T>(key, options);
  if (existing !== null) {
    return existing;
  }

  setStorageItem(key, defaultValue, options);
  return defaultValue;
}

/**
 * Supprime plusieurs clés du stockage
 */
export function removeStorageItems(keys: string[], type: StorageType = 'localStorage'): number {
  let removed = 0;
  for (const key of keys) {
    if (removeStorageItem(key, type)) {
      removed++;
    }
  }
  return removed;
}

/**
 * Supprime toutes les clés correspondant à un préfixe
 */
export function removeStorageItemsByPrefix(
  prefix: string,
  type: StorageType = 'localStorage'
): number {
  const keys = getStorageKeys(type);
  const matchingKeys = keys.filter(key => key.startsWith(prefix));
  return removeStorageItems(matchingKeys, type);
}

/**
 * Migre une valeur d'un type de stockage à un autre
 */
export function migrateStorageItem(key: string, from: StorageType, to: StorageType): boolean {
  const value = getStorageItem(key, { type: from });
  if (value === null) {
    return false;
  }

  const success = setStorageItem(key, value, { type: to });
  if (success) {
    removeStorageItem(key, from);
  }
  return success;
}
