/**
 * Utilitaires pour la transformation et le mapping de données
 * Fournit des fonctions réutilisables pour transformer des données
 */

export type TransformFunction<T, R> = (value: T, index?: number, array?: T[]) => R;
export type PredicateFunction<T> = (value: T, index?: number, array?: T[]) => boolean;
export type KeyFunction<T, K> = (value: T) => K;

/**
 * Transforme un tableau avec une fonction
 */
export function transformArray<T, R>(
  array: T[],
  transform: TransformFunction<T, R>
): R[] {
  return array.map(transform);
}

/**
 * Transforme un objet avec une fonction
 */
export function transformObject<T, R>(
  obj: Record<string, T>,
  transform: TransformFunction<T, R>
): Record<string, R> {
  const  result: Record<string, R> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = transform(value);
  }
  return result;
}

/**
 * Transforme les valeurs d'un objet
 */
export function transformObjectValues<T, R>(
  obj: Record<string, T>,
  transform: (value: T, key: string) => R
): Record<string, R> {
  const  result: Record<string, R> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = transform(value, key);
  }
  return result;
}

/**
 * Transforme les clés d'un objet
 */
export function transformObjectKeys<T>(
  obj: Record<string, T>,
  transform: (key: string, value: T) => string
): Record<string, T> {
  const  result: Record<string, T> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[transform(key, value)] = value;
  }
  return result;
}

/**
 * Groupe un tableau par une clé
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: KeyFunction<T, K>
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

/**
 * Indexe un tableau par une clé
 */
export function indexBy<T, K extends string | number>(
  array: T[],
  keyFn: KeyFunction<T, K>
): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of array) {
    const key = keyFn(item);
    result[key] = item;
  }
  return result;
}

/**
 * Partitionne un tableau en deux selon un prédicat
 */
export function partition<T>(
  array: T[],
  predicate: PredicateFunction<T>
): [T[], T[]] {
  const  truthy: T[] = [];
  const  falsy: T[] = [];

  for (const item of array) {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  }

  return [truthy, falsy];
}

/**
 * Mappe un tableau en objet
 */
export function mapToObject<T, K extends string | number, V>(
  array: T[],
  keyFn: KeyFunction<T, K>,
  valueFn: TransformFunction<T, V>
): Record<K, V> {
  const result = {} as Record<K, V>;
  for (const item of array) {
    const key = keyFn(item);
    result[key] = valueFn(item);
  }
  return result;
}

/**
 * Flatten un tableau de tableaux
 */
export function flatten<T>(array: (T | T[])[]): T[] {
  const  result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...item);
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * Flatten profondément un tableau
 */
export function flattenDeep<T>(array: any[]): T[] {
  const  result: T[] = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

/**
 * Transforme un objet en tableau
 */
export function objectToArray<T>(
  obj: Record<string, T>,
  transform?: (value: T, key: string) => any
): Array<{ key: string; value: T }> {
  const  result: Array<{ key: string; value: T }> = [];
  for (const [key, value] of Object.entries(obj)) {
    result.push({
      key,
      value: transform ? transform(value, key) : value,
    });
  }
  return result;
}

/**
 * Transforme un tableau en objet
 */
export function arrayToObject<T, K extends string | number, V>(
  array: T[],
  keyFn: KeyFunction<T, K>,
  valueFn?: TransformFunction<T, V>
): Record<K, V> {
  const result = {} as Record<K, V>;
  for (const item of array) {
    const key = keyFn(item);
    result[key] = valueFn ? valueFn(item) : (item as unknown as V);
  }
  return result;
}

/**
 * Transforme les valeurs null/undefined
 */
export function transformNullish<T, R>(
  value: T | null | undefined,
  transform: (value: T) => R,
  defaultValue: R
): R {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  return transform(value);
}

/**
 * Transforme conditionnellement
 */
export function transformIf<T, R>(
  value: T,
  condition: PredicateFunction<T>,
  transform: TransformFunction<T, R>,
  defaultValue: R
): R {
  if (condition(value)) {
    return transform(value);
  }
  return defaultValue;
}

/**
 * Compose plusieurs transformations
 */
export function composeTransforms<T, R1, R2>(
  transform1: TransformFunction<T, R1>,
  transform2: TransformFunction<R1, R2>
): TransformFunction<T, R2> {
  return (value: T) => transform2(transform1(value));
}

/**
 * Pipe plusieurs transformations
 */
export function pipeTransforms<T>(
  ...transforms: Array<TransformFunction<any, any>>
): TransformFunction<T, any> {
  return (value: T) => {
    return transforms.reduce((acc, transform) => transform(acc), value);
  };
}

/**
 * Transforme avec un mapping
 */
export function transformWithMap<T, R>(
  value: T,
  map: Record<string | number, R>,
  defaultValue?: R
): R | undefined {
  const key = String(value);
  return map[key] !== undefined ? map[key] : defaultValue;
}

/**
 * Normalise un tableau d'objets
 */
export function normalizeArray<T extends Record<string, any>>(
  array: T[],
  keyField: keyof T
): { byId: Record<string, T>; allIds: string[] } {
  const  byId: Record<string, T> = {};
  const  allIds: string[] = [];

  for (const item of array) {
    const id = String(item[keyField]);
    byId[id] = item;
    allIds.push(id);
  }

  return { byId, allIds };
}

/**
 * Dénormalise un objet normalisé
 */
export function denormalizeArray<T extends Record<string, any>>(
  normalized: { byId: Record<string, T>; allIds: string[] }
): T[] {
  return normalized.allIds.map((id) => normalized.byId[id]).filter(Boolean);
}







