/**
 * Hook pour gérer le scroll horizontal avec indicateurs dynamiques
 * Date: Janvier 2025
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseHorizontalScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scrollLeft: () => void;
  scrollRight: () => void;
  scrollToStart: () => void;
  scrollToEnd: () => void;
}

export function useHorizontalScroll(): UseHorizontalScrollReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScrollLeft = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < maxScrollLeft - 1); // -1 pour éviter les problèmes de précision
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Vérifier au montage
    checkScrollability();

    // Vérifier lors du scroll
    element.addEventListener('scroll', checkScrollability);
    
    // Vérifier lors du resize
    const resizeObserver = new ResizeObserver(checkScrollability);
    resizeObserver.observe(element);

    // Vérifier lors du changement de contenu
    const mutationObserver = new MutationObserver(checkScrollability);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      element.removeEventListener('scroll', checkScrollability);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [checkScrollability]);

  const scrollLeft = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const scrollRight = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  }, []);

  const scrollToStart = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: 0,
      behavior: 'smooth',
    });
  }, []);

  const scrollToEnd = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      left: scrollRef.current.scrollWidth,
      behavior: 'smooth',
    });
  }, []);

  return {
    scrollRef,
    canScrollLeft,
    canScrollRight,
    scrollLeft,
    scrollRight,
    scrollToStart,
    scrollToEnd,
  };
}

