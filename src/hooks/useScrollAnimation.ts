/**
 * Hook pour animer les éléments au scroll (IntersectionObserver).
 * Mobile-safe : threshold 0, scroll parent détecté, fallback si IO ne déclenche pas.
 */

import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  /** Fraction visible pour déclencher (0 = dès qu'un pixel entre dans la zone). */
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  /** Désactive l'animation (contenu critique toujours visible). */
  disabled?: boolean;
  /** Force l'affichage si IO ne déclenche pas (ms). 0 = pas de fallback. */
  fallbackMs?: number;
}

export function getScrollParent(element: HTMLElement): Element | null {
  let parent = element.parentElement;
  while (parent) {
    const { overflowY, overflow } = getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflowY) || /(auto|scroll|overlay)/.test(overflow)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function revealElement(element: HTMLElement) {
  element.classList.add('animate-in');
}

export function useScrollAnimation<T extends HTMLElement>(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0,
    rootMargin = '80px 0px',
    triggerOnce = true,
    disabled = false,
    fallbackMs = 2000,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    if (prefersReducedMotion()) {
      revealElement(element);
      return;
    }

    let revealed = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      revealElement(element);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };

    const scrollRoot = getScrollParent(element);
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            reveal();
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove('animate-in');
          }
        });
      },
      {
        threshold,
        rootMargin,
        root: scrollRoot,
      }
    );

    element.classList.add('animate-on-scroll');
    observer.observe(element);

    if (fallbackMs > 0) {
      fallbackTimer = setTimeout(reveal, fallbackMs);
    }

    return () => {
      observer.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [threshold, rootMargin, triggerOnce, disabled, fallbackMs]);

  return ref;
}

/**
 * Hook pour animer une liste d'éléments avec un effet de cascade
 */
export function useStaggerAnimation(itemCount: number, delayIncrement: number = 100) {
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    refs.current = refs.current.slice(0, itemCount);

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '80px 0px',
      }
    );

    refs.current.forEach((el, index) => {
      if (el) {
        el.classList.add('animate-on-scroll');
        el.style.transitionDelay = `${index * delayIncrement}ms`;
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [itemCount, delayIncrement]);

  const setRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return setRef;
}

/**
 * Hook pour détecter si un élément est visible
 */
export function useInView<T extends HTMLElement>(
  options: Omit<UseScrollAnimationOptions, 'disabled'> = {}
) {
  const { threshold = 0, rootMargin = '80px 0px', fallbackMs = 2000 } = options;
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const scrollRoot = getScrollParent(element);

    const markVisible = () => {
      setIsInView(true);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            markVisible();
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin, root: scrollRoot }
    );

    observer.observe(element);

    if (fallbackMs > 0) {
      fallbackTimer = setTimeout(markVisible, fallbackMs);
    }

    return () => {
      observer.disconnect();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [threshold, rootMargin, fallbackMs]);

  return { ref, isInView };
}
