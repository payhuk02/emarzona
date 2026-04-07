/**
 * Hook useStorage - Gestion unifiée du localStorage et sessionStorage
 * Fournit une API simple et type-safe pour le stockage
 *
 * @example
 * ```tsx
 * const [value, setValue, removeValue] = useStorage('key', 'default', 'local');
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

type StorageType = 'local' | 'session';

interface UseStorageOptions<T> {
  /**
   * Type de stockage (localStorage ou sessionStorage)
   * @default 'local'
   */
  storageType?: StorageType;
  /**
   * Serializer personnalisé
   */
  serializer?: {
    read: (value: string) => T;
    write: (value: T) => string;
  };
  /**
   * Callback appelé quand la valeur change
   */
  onUpdate?: (value: T) => void;
}

/**
 * Hook pour gérer le stockage (localStorage/sessionStorage)
 */
export function useStorage<T>(
  key: string,
  initialValue: T,
  options: UseStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    storageType = 'local',
    serializer = {
      read: (value: string) => {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      },
      write: (value: T) => {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      },
    },
    onUpdate,
  } = options;

  const storage = storageType === 'local' ? localStorage : sessionStorage;
  const isMountedRef = useRef(true);

  // Fonction pour lire depuis le stockage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = storage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return serializer.read(item);
    } catch (error) {
      // ✅ PHASE 2: Remplacer console.warn par logger
      logger.warn(`Error reading storage key "${key}"`, { error, key, storageType });
      return initialValue;
    }
  }, [key, initialValue, storage, serializer, storageType]);

  // État initial
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Fonction pour mettre à jour la valeur
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (!isMountedRef.current) return;

      try {
        // Permettre la mise à jour fonctionnelle
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        // Sauvegarder dans le state
        setStoredValue(valueToStore);

        // Sauvegarder dans le storage
        if (typeof window !== 'undefined') {
          storage.setItem(key, serializer.write(valueToStore));
        }

        // Appeler le callback
        onUpdate?.(valueToStore);
      } catch (error) {
        // ✅ PHASE 2: Remplacer console.warn par logger
        logger.warn(`Error setting storage key "${key}"`, { error, key, storageType });
      }
    },
    [key, storedValue, storage, serializer, onUpdate, storageType]
  );

  // Fonction pour supprimer la valeur
  const removeValue = useCallback(() => {
    if (!isMountedRef.current) return;

    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        storage.removeItem(key);
      }
      onUpdate?.(initialValue);
    } catch (error) {
      // ✅ PHASE 2: Remplacer console.warn par logger
      logger.warn(`Error removing storage key "${key}"`, { error, key, storageType });
    }
  }, [key, initialValue, storage, onUpdate, storageType]);

  // Écouter les changements depuis d'autres onglets/fenêtres
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.storageArea === storage) {
        setStoredValue(readValue());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storage, readValue]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook spécialisé pour localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseStorageOptions<T>, 'storageType'>
) {
  return useStorage(key, initialValue, { ...options, storageType: 'local' });
}

/**
 * Hook spécialisé pour sessionStorage
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options?: Omit<UseStorageOptions<T>, 'storageType'>
) {
  return useStorage(key, initialValue, { ...options, storageType: 'session' });
}






