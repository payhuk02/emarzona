/**
 * Hook useIntersectionObserver - Gestion améliorée de l'Intersection Observer
 * Fournit une API simple et flexible pour observer les éléments
 * 
 * @example
 * ```tsx
 * const { ref, isIntersecting, entry } = useIntersectionObserver({
 *   threshold: 0.1,
 *   rootMargin: '50px',
 * });
 * ```
 */

import { useState, useEffect, useRef, RefObject } from 'react';

export interface UseIntersectionObserverOptions {
  /**
   * Seuil de visibilité (0-1)
   * @default 0
   */
  threshold?: number | number[];
  /**
   * Marge autour du root
   * @default '0px'
   */
  rootMargin?: string;
  /**
   * Élément root pour l'observer
   */
  root?: Element | null;
  /**
   * Arrêter l'observation après la première intersection
   * @default false
   */
  triggerOnce?: boolean;
  /**
   * Activer/désactiver l'observer
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback appelé quand l'intersection change
   */
  onIntersect?: (entry: IntersectionObserverEntry) => void;
}

export interface UseIntersectionObserverReturn {
  /**
   * Ref à attacher à l'élément à observer
   */
  ref: RefObject<HTMLElement>;
  /**
   * Indique si l'élément est en intersection
   */
  isIntersecting: boolean;
  /**
   * Ratio d'intersection (0-1)
   */
  intersectionRatio: number;
  /**
   * Dernière entrée d'intersection
   */
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook pour observer l'intersection d'un élément
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    triggerOnce = false,
    enabled = true,
    onIntersect,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;

    // Créer l'observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [firstEntry] = entries;
        if (!firstEntry) return;

        const isIntersecting = firstEntry.isIntersecting;
        const ratio = firstEntry.intersectionRatio;

        setIsIntersecting(isIntersecting);
        setIntersectionRatio(ratio);
        setEntry(firstEntry);

        // Appeler le callback
        onIntersect?.(firstEntry);

        // Arrêter l'observation si triggerOnce
        if (triggerOnce && isIntersecting && observerRef.current) {
          observerRef.current.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    // Observer l'élément
    observerRef.current.observe(element);

    // Nettoyer
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [threshold, rootMargin, root, triggerOnce, enabled, onIntersect]);

  return {
    ref,
    isIntersecting,
    intersectionRatio,
    entry,
  };
}

/**
 * Hook pour observer plusieurs éléments
 */
export function useIntersectionObserverMultiple(
  refs: RefObject<HTMLElement>[],
  options: Omit<UseIntersectionObserverOptions, 'onIntersect'> & {
    onIntersect?: (entry: IntersectionObserverEntry, index: number) => void;
  } = {}
) {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    triggerOnce = false,
    enabled = true,
    onIntersect,
  } = options;

  const [intersections, setIntersections] = useState<Map<number, IntersectionObserverEntry>>(
    new Map()
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const elements = refs
      .map((ref) => ref.current)
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Créer l'observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = refs.findIndex((ref) => ref.current === entry.target);
          if (index !== -1) {
            setIntersections((prev) => {
              const next = new Map(prev);
              next.set(index, entry);
              return next;
            });

            onIntersect?.(entry, index);

            // Arrêter l'observation si triggerOnce
            if (triggerOnce && entry.isIntersecting && observerRef.current) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    // Observer tous les éléments
    elements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    // Nettoyer
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [refs, threshold, rootMargin, root, triggerOnce, enabled, onIntersect]);

  return intersections;
}

