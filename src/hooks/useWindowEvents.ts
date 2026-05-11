/**
 * Hook useWindowEvents - Gestion optimisée des événements window
 * Fournit des hooks pour resize, scroll, visibility avec throttling/debouncing
 * 
 * @example
 * ```tsx
 * const { width, height } = useWindowSize();
 * const { scrollY, scrollX } = useWindowScroll();
 * const isVisible = usePageVisibility();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useThrottle } from './useThrottle';

interface UseWindowSizeOptions {
  /**
   * Délai de throttling en ms
   * @default 150
   */
  throttleMs?: number;
  /**
   * Inclure la hauteur de la scrollbar
   * @default false
   */
  includeScrollbar?: boolean;
}

/**
 * Hook pour obtenir la taille de la fenêtre
 */
export function useWindowSize(options: UseWindowSizeOptions = {}) {
  const { throttleMs = 150, includeScrollbar = false } = options;
  const [size, setSize] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Throttler la fonction
    let  timeoutId: NodeJS.Timeout;
    const throttledHandleResize = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, throttleMs);
    };

    window.addEventListener('resize', throttledHandleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', throttledHandleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [throttleMs]);

  return size;
}

interface UseWindowScrollOptions {
  /**
   * Délai de throttling en ms
   * @default 100
   */
  throttleMs?: number;
}

/**
 * Hook pour obtenir la position de scroll
 */
export function useWindowScroll(options: UseWindowScrollOptions = {}) {
  const { throttleMs = 100 } = options;
  const [scroll, setScroll] = useState(() => {
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }
    return {
      x: window.scrollX || window.pageXOffset || 0,
      y: window.scrollY || window.pageYOffset || 0,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      setScroll({
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
      });
    };

    // Throttler la fonction
    let  timeoutId: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, throttleMs);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [throttleMs]);

  return scroll;
}

/**
 * Hook pour détecter si la page est visible
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Hook pour détecter si la fenêtre est focus
 */
export function useWindowFocus() {
  const [isFocused, setIsFocused] = useState(() => {
    if (typeof window === 'undefined') return true;
    return document.hasFocus();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isFocused;
}

/**
 * Hook combiné pour tous les événements window
 */
export function useWindowEvents(options: {
  onResize?: (size: { width: number; height: number }) => void;
  onScroll?: (scroll: { x: number; y: number }) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
} = {}) {
  const { onResize, onScroll, onVisibilityChange, onFocusChange } = options;
  const size = useWindowSize();
  const scroll = useWindowScroll();
  const isVisible = usePageVisibility();
  const isFocused = useWindowFocus();

  useEffect(() => {
    onResize?.(size);
  }, [size, onResize]);

  useEffect(() => {
    onScroll?.(scroll);
  }, [scroll, onScroll]);

  useEffect(() => {
    onVisibilityChange?.(isVisible);
  }, [isVisible, onVisibilityChange]);

  useEffect(() => {
    onFocusChange?.(isFocused);
  }, [isFocused, onFocusChange]);

  return {
    size,
    scroll,
    isVisible,
    isFocused,
  };
}







