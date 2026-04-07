/**
 * Utilitaires pour la sérialisation et désérialisation
 * Fournit des fonctions réutilisables pour sérialiser/désérialiser des données
 */

// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface SerializationOptions {
  /**
   * Espacement pour le formatage JSON
   * @default 2
   */
  space?: number | string;
  /**
   * Replacer pour la sérialisation JSON personnalisée
   */
  replacer?: (key: string, value: unknown) => unknown;
  /**
   * Reviver pour la désérialisation JSON personnalisée
   */
  reviver?: (key: string, value: unknown) => unknown;
}

/**
 * Sérialise un objet en JSON
 */
export function serialize<T>(value: T, options: SerializationOptions = {}): string {
  const { space = 2, replacer } = options;
  try {
    return JSON.stringify(value, replacer, space);
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error('Error serializing value', { error });
    throw new Error('Failed to serialize value');
  }
}

/**
 * Désérialise une chaîne JSON en objet
 */
export function deserialize<T>(json: string, options: SerializationOptions = {}): T {
  const { reviver } = options;
  try {
    return JSON.parse(json, reviver) as T;
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error('Error deserializing JSON', { error });
    throw new Error('Failed to deserialize JSON');
  }
}

/**
 * Sérialise avec gestion d'erreur (retourne null en cas d'erreur)
 */
export function safeSerialize<T>(value: T, options: SerializationOptions = {}): string | null {
  try {
    return serialize(value, options);
  } catch {
    return null;
  }
}

/**
 * Désérialise avec gestion d'erreur (retourne null en cas d'erreur)
 */
export function safeDeserialize<T>(json: string, options: SerializationOptions = {}): T | null {
  try {
    return deserialize<T>(json, options);
  } catch {
    return null;
  }
}

/**
 * Clone profond d'un objet via sérialisation
 */
export function deepClone<T>(value: T): T {
  return deserialize<T>(serialize(value));
}

/**
 * Vérifie si une chaîne est un JSON valide
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formate un JSON avec indentation
 */
export function formatJSON(json: string, space: number | string = 2): string {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, space);
  } catch {
    return json;
  }
}

/**
 * Minifie un JSON
 */
export function minifyJSON(json: string): string {
  try {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed);
  } catch {
    return json;
  }
}

/**
 * Sérialise avec compression Base64
 */
export function serializeBase64<T>(value: T): string {
  const json = serialize(value);
  if (typeof btoa === 'function') {
    return btoa(json);
  }
  // Fallback pour Node.js
  return Buffer.from(json).toString('base64');
}

/**
 * Désérialise depuis Base64
 */
export function deserializeBase64<T>(base64: string): T {
  let  json: string;
  if (typeof atob === 'function') {
    json = atob(base64);
  } else {
    // Fallback pour Node.js
    json = Buffer.from(base64, 'base64').toString('utf-8');
  }
  return deserialize<T>(json);
}

/**
 * Sérialise avec compression (simplifié - utilise JSON compact)
 */
export function serializeCompressed<T>(value: T): string {
  return serialize(value, { space: 0 });
}

/**
 * Sérialise avec support des dates
 */
export function serializeWithDates<T>(value: T): string {
  return serialize(value, {
    replacer: (key, val) => {
      if (val instanceof Date) {
        return { __type: 'Date', __value: val.toISOString() };
      }
      return val;
    },
  });
}

/**
 * Désérialise avec support des dates
 */
export function deserializeWithDates<T>(json: string): T {
  return deserialize<T>(json, {
    reviver: (key, val) => {
      if (val && typeof val === 'object' && val._type === 'Date') {
        return new Date(val.__value);
      }
      return val;
    },
  });
}

/**
 * Sérialise avec support des Map et Set
 */
export function serializeWithMapsAndSets<T>(value: T): string {
  return serialize(value, {
    replacer: (key, val) => {
      if (val instanceof Map) {
        return { __type: 'Map', __value: Array.from(val.entries()) };
      }
      if (val instanceof Set) {
        return { __type: 'Set', __value: Array.from(val) };
      }
      return val;
    },
  });
}

/**
 * Désérialise avec support des Map et Set
 */
export function deserializeWithMapsAndSets<T>(json: string): T {
  return deserialize<T>(json, {
    reviver: (key, val) => {
      if (val && typeof val === 'object' && val._type === 'Map') {
        return new Map(val.__value);
      }
      if (val && typeof val === 'object' && val._type === 'Set') {
        return new Set(val.__value);
      }
      return val;
    },
  });
}

/**
 * Compare deux objets via sérialisation
 */
export function compareBySerialization<T>(a: T, b: T): boolean {
  return serialize(a) === serialize(b);
}

/**
 * Obtient la taille d'un objet sérialisé (en octets)
 */
export function getSerializedSize<T>(value: T): number {
  const json = serialize(value);
  return new Blob([json]).size;
}






