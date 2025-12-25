/**
 * Utilitaires pour les opérations sur les objets
 * Fournit des fonctions réutilisables pour manipuler les objets
 */

/**
 * Clone profond d'un objet
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * Fusionne deux objets de manière récursive
 */
export function deepMerge<T extends object, U extends object>(
  target: T,
  source: U
): T & U {
  const output = { ...target } as T & U;

  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach((key) => {
      const sourceKey = key as keyof U;
      const targetKey = key as keyof T;

      if (
        typeof source[sourceKey] === 'object' &&
        !Array.isArray(source[sourceKey]) &&
        source[sourceKey] !== null &&
        target[targetKey] &&
        typeof target[targetKey] === 'object' &&
        !Array.isArray(target[targetKey]) &&
        target[targetKey] !== null
      ) {
        output[targetKey as keyof (T & U)] = deepMerge(
          target[targetKey] as object,
          source[sourceKey] as object
        ) as (T & U)[keyof (T & U)];
      } else {
        output[targetKey as keyof (T & U)] = source[sourceKey] as (T & U)[keyof (T & U)];
      }
    });
  }

  return output;
}

/**
 * Sélectionne certaines propriétés d'un objet
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Omet certaines propriétés d'un objet
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * Vérifie si un objet est vide
 */
export function isEmpty(obj: object | null | undefined): boolean {
  if (obj == null) return true;
  return Object.keys(obj).length === 0;
}

/**
 * Obtient les clés d'un objet
 */
export function keys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * Obtient les valeurs d'un objet
 */
export function values<T extends object>(obj: T): Array<T[keyof T]> {
  return Object.values(obj);
}

/**
 * Obtient les paires clé-valeur d'un objet
 */
export function entries<T extends object>(
  obj: T
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

/**
 * Crée un objet à partir de paires clé-valeur
 */
export function fromEntries<T>(
  entries: Array<[string, T]>
): Record<string, T> {
  return Object.fromEntries(entries) as Record<string, T>;
}

/**
 * Mappe les valeurs d'un objet
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  Object.keys(obj).forEach((key) => {
    result[key] = fn(obj[key], key);
  });
  return result;
}

/**
 * Mappe les clés d'un objet
 */
export function mapKeys<T>(
  obj: Record<string, T>,
  fn: (key: string, value: T) => string
): Record<string, T> {
  const result: Record<string, T> = {};
  Object.keys(obj).forEach((key) => {
    result[fn(key, obj[key])] = obj[key];
  });
  return result;
}

/**
 * Filtre les propriétés d'un objet selon une condition
 */
export function filterObject<T extends Record<string, any>>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    const typedKey = key as keyof T;
    if (predicate(obj[typedKey], typedKey)) {
      result[typedKey] = obj[typedKey];
    }
  });
  return result;
}

/**
 * Inverse les clés et valeurs d'un objet
 */
export function invert<T extends Record<string, string | number>>(
  obj: T
): Record<string, keyof T> {
  const result: Record<string, keyof T> = {};
  Object.keys(obj).forEach((key) => {
    result[String(obj[key])] = key as keyof T;
  });
  return result;
}

/**
 * Obtient une valeur imbriquée d'un objet par un chemin
 */
export function get<T>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T | undefined {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result == null || !(key in result)) {
      return defaultValue;
    }
    result = result[key];
  }

  return result as T;
}

/**
 * Définit une valeur imbriquée dans un objet par un chemin
 */
export function set<T extends object>(
  obj: T,
  path: string | string[],
  value: any
): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  const cloned = deepClone(obj);
  let current: any = cloned;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return cloned;
}

/**
 * Vérifie si un objet a une propriété imbriquée
 */
export function has(obj: any, path: string | string[]): boolean {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current == null || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

/**
 * Omet les propriétés avec des valeurs null/undefined
 */
export function compactObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return filterObject(obj, (value) => value != null);
}

