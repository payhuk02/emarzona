/**
 * Utilitaires pour les opérations sur les tableaux
 * Fournit des fonctions réutilisables pour manipuler les tableaux
 */

/**
 * Retire les doublons d'un tableau
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Retire les doublons d'un tableau d'objets par une clé
 */
export function uniqueBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Groupe un tableau d'objets par une clé
 */
export function groupBy<T>(
  array: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? String(key(item)) : String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Partitionne un tableau en deux selon une condition
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  return array.reduce(
    (acc, item) => {
      acc[predicate(item) ? 0 : 1].push(item);
      return acc;
    },
    [[], []] as [T[], T[]]
  );
}

/**
 * Obtient la différence entre deux tableaux
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => !array2.includes(item));
}

/**
 * Obtient l'intersection de deux tableaux
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((item) => array2.includes(item));
}

/**
 * Obtient l'union de deux tableaux
 */
export function union<T>(array1: T[], array2: T[]): T[] {
  return unique([...array1, ...array2]);
}

/**
 * Mélange un tableau (shuffle)
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Obtient un élément aléatoire d'un tableau
 */
export function random<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Obtient plusieurs éléments aléatoires d'un tableau
 */
export function randomSample<T>(array: T[], count: number): T[] {
  const shuffled = shuffle(array);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Chunk un tableau en groupes de taille spécifiée
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Aplatit un tableau à plusieurs niveaux
 */
export function flatten<T>(array: (T | T[])[], depth: number = 1): T[] {
  return depth > 0
    ? array.reduce(
        (acc, val) =>
          acc.concat(Array.isArray(val) ? flatten(val, depth - 1) : val),
        [] as T[]
      )
    : (array.slice() as T[]);
}

/**
 * Aplatit complètement un tableau
 */
export function flattenDeep<T>(array: (T | T[])[]): T[] {
  return flatten(array, Infinity);
}

/**
 * Retire les valeurs null/undefined d'un tableau
 */
export function compact<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item != null);
}

/**
 * Obtient les N premiers éléments d'un tableau
 */
export function take<T>(array: T[], n: number): T[] {
  return array.slice(0, n);
}

/**
 * Obtient les N derniers éléments d'un tableau
 */
export function takeRight<T>(array: T[], n: number): T[] {
  return array.slice(-n);
}

/**
 * Retire les N premiers éléments d'un tableau
 */
export function drop<T>(array: T[], n: number = 1): T[] {
  return array.slice(n);
}

/**
 * Retire les N derniers éléments d'un tableau
 */
export function dropRight<T>(array: T[], n: number = 1): T[] {
  return array.slice(0, -n);
}

/**
 * Obtient les valeurs uniques d'un tableau
 */
export function uniq<T>(array: T[]): T[] {
  return unique(array);
}

/**
 * Obtient les valeurs uniques d'un tableau d'objets par une clé
 */
export function uniqBy<T>(array: T[], key: keyof T | ((item: T) => any)): T[] {
  return uniqueBy(array, key);
}

/**
 * Trie un tableau d'objets par plusieurs clés
 */
export function sortBy<T>(
  array: T[],
  ...keys: Array<keyof T | ((item: T) => any)>
): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aValue = typeof key === 'function' ? key(a) : a[key];
      const bValue = typeof key === 'function' ? key(b) : b[key];

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
    }
    return 0;
  });
}

/**
 * Obtient la somme d'un tableau de nombres
 */
export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

/**
 * Obtient la moyenne d'un tableau de nombres
 */
export function average(array: number[]): number {
  return array.length > 0 ? sum(array) / array.length : 0;
}

/**
 * Obtient le minimum d'un tableau
 */
export function min<T>(array: T[], compareFn?: (a: T, b: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((min, current) => {
    if (compareFn) {
      return compareFn(min, current) < 0 ? min : current;
    }
    return min < current ? min : current;
  });
}

/**
 * Obtient le maximum d'un tableau
 */
export function max<T>(array: T[], compareFn?: (a: T, b: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  return array.reduce((max, current) => {
    if (compareFn) {
      return compareFn(max, current) > 0 ? max : current;
    }
    return max > current ? max : current;
  });
}

