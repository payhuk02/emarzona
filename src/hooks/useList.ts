/**
 * Hook useList - Gestion simplifiée des listes
 * Fournit une API simple pour gérer des listes d'éléments
 * 
 * @example
 * ```tsx
 * const { items, add, remove, update, clear, find } = useList([{ id: 1, name: 'Item 1' }]);
 * 
 * add({ id: 2, name: 'Item 2' });
 * remove(1);
 * update(1, { name: 'Updated' });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseListOptions<T> {
  /**
   * Fonction pour obtenir l'ID d'un élément
   * @default (item) => (item as any).id
   */
  getId?: (item: T) => string | number;
  /**
   * Comparateur personnalisé pour trouver un élément
   */
  compare?: (item: T, id: string | number) => boolean;
}

export interface UseListReturn<T> {
  /**
   * Liste des éléments
   */
  items: T[];
  /**
   * Ajouter un élément
   */
  add: (item: T) => void;
  /**
   * Ajouter plusieurs éléments
   */
  addMany: (items: T[]) => void;
  /**
   * Supprimer un élément par ID
   */
  remove: (id: string | number) => void;
  /**
   * Supprimer plusieurs éléments
   */
  removeMany: (ids: (string | number)[]) => void;
  /**
   * Mettre à jour un élément
   */
  update: (id: string | number, updates: Partial<T> | ((item: T) => T)) => void;
  /**
   * Trouver un élément par ID
   */
  find: (id: string | number) => T | undefined;
  /**
   * Vérifier si un élément existe
   */
  has: (id: string | number) => boolean;
  /**
   * Réinitialiser la liste
   */
  clear: () => void;
  /**
   * Remplacer toute la liste
   */
  setItems: (items: T[]) => void;
  /**
   * Trier la liste
   */
  sort: (compareFn?: (a: T, b: T) => number) => void;
  /**
   * Filtrer la liste
   */
  filter: (predicate: (item: T) => boolean) => T[];
  /**
   * Longueur de la liste
   */
  length: number;
}

/**
 * Hook pour gérer une liste d'éléments
 */
export function useList<T>(
  initialItems: T[] = [],
  options: UseListOptions<T> = {}
): UseListReturn<T> {
  const { getId, compare } = options;
  const [items, setItems] = useState<T[]>(initialItems);

  const defaultGetId = useCallback((item: T): string | number => {
    return (item as any).id;
  }, []);

  const defaultCompare = useCallback(
    (item: T, id: string | number): boolean => {
      const itemId = (getId || defaultGetId)(item);
      return itemId === id;
    },
    [getId, defaultGetId]
  );

  const getItemId = getId || defaultGetId;
  const compareFn = compare || defaultCompare;

  const add = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item]);
    },
    []
  );

  const addMany = useCallback(
    (newItems: T[]) => {
      setItems((prev) => [...prev, ...newItems]);
    },
    []
  );

  const remove = useCallback(
    (id: string | number) => {
      setItems((prev) => prev.filter((item) => !compareFn(item, id)));
    },
    [compareFn]
  );

  const removeMany = useCallback(
    (ids: (string | number)[]) => {
      setItems((prev) => prev.filter((item) => !ids.some((id) => compareFn(item, id))));
    },
    [compareFn]
  );

  const update = useCallback(
    (id: string | number, updates: Partial<T> | ((item: T) => T)) => {
      setItems((prev) =>
        prev.map((item) => {
          if (compareFn(item, id)) {
            return typeof updates === 'function' ? updates(item) : { ...item, ...updates };
          }
          return item;
        })
      );
    },
    [compareFn]
  );

  const find = useCallback(
    (id: string | number): T | undefined => {
      return items.find((item) => compareFn(item, id));
    },
    [items, compareFn]
  );

  const has = useCallback(
    (id: string | number): boolean => {
      return items.some((item) => compareFn(item, id));
    },
    [items, compareFn]
  );

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const sort = useCallback((compareFn?: (a: T, b: T) => number) => {
    setItems((prev) => {
      const sorted = [...prev];
      sorted.sort(compareFn);
      return sorted;
    });
  }, []);

  const filter = useCallback(
    (predicate: (item: T) => boolean): T[] => {
      return items.filter(predicate);
    },
    [items]
  );

  const length = useMemo(() => items.length, [items.length]);

  return {
    items,
    add,
    addMany,
    remove,
    removeMany,
    update,
    find,
    has,
    clear,
    setItems,
    sort,
    filter,
    length,
  };
}







