/**
 * Utilitaires pour la comparaison d'objets
 * Fournit des fonctions réutilisables pour comparer des objets en profondeur
 */

/**
 * Compare deux valeurs en profondeur
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  // Comparer les tableaux
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let  i= 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Comparer les objets
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Compare deux valeurs de manière superficielle (shallow)
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}

/**
 * Compare deux objets en ignorant certaines clés
 */
export function deepEqualIgnoreKeys(
  a: any,
  b: any,
  ignoreKeys: string[]
): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  const keysA = Object.keys(a).filter((key) => !ignoreKeys.includes(key));
  const keysB = Object.keys(b).filter((key) => !ignoreKeys.includes(key));

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Compare deux objets en comparant seulement certaines clés
 */
export function deepEqualOnlyKeys(
  a: any,
  b: any,
  onlyKeys: string[]
): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  for (const key of onlyKeys) {
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Trouve les différences entre deux objets
 */
export function getObjectDiff(a: any, b: any): Record<string, { old: any; new: any }> {
  const  diff: Record<string, { old: any; new: any }> = {};

  if (a == null || b == null) return diff;
  if (typeof a !== 'object' || typeof b !== 'object') return diff;

  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);

  for (const key of allKeys) {
    if (!deepEqual(a[key], b[key])) {
      diff[key] = {
        old: a[key],
        new: b[key],
      };
    }
  }

  return diff;
}

/**
 * Vérifie si un objet contient toutes les clés d'un autre objet avec les mêmes valeurs
 */
export function containsObject(a: any, b: any): boolean {
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysB = Object.keys(b);

  for (const key of keysB) {
    if (!(key in a)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

/**
 * Compare deux tableaux en ignorant l'ordre
 */
export function arrayEqualIgnoreOrder(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return deepEqual(sortedA, sortedB);
}

/**
 * Compare deux tableaux d'objets en ignorant l'ordre
 */
export function arrayOfObjectsEqualIgnoreOrder(
  a: any[],
  b: any[],
  compareFn?: (a: any, b: any) => boolean
): boolean {
  if (a.length !== b.length) return false;

  const compare = compareFn || deepEqual;

  for (const itemA of a) {
    const found = b.find((itemB) => compare(itemA, itemB));
    if (!found) return false;
  }

  return true;
}







