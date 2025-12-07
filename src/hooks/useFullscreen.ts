/**
 * Hook useFullscreen - Gestion du mode plein écran
 * Fournit une API simple pour entrer/sortir du mode plein écran
 * 
 * @example
 * ```tsx
 * const { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen } = useFullscreen();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface UseFullscreenOptions {
  /**
   * Élément à mettre en plein écran (par défaut: document.documentElement)
   */
  element?: HTMLElement | null;
  /**
   * Callback appelé quand on entre en plein écran
   */
  onEnter?: () => void;
  /**
   * Callback appelé quand on sort du plein écran
   */
  onExit?: () => void;
}

export interface UseFullscreenReturn {
  /**
   * Indique si on est en mode plein écran
   */
  isFullscreen: boolean;
  /**
   * Indique si le mode plein écran est supporté
   */
  isSupported: boolean;
  /**
   * Entrer en mode plein écran
   */
  enterFullscreen: () => Promise<void>;
  /**
   * Sortir du mode plein écran
   */
  exitFullscreen: () => Promise<void>;
  /**
   * Basculer le mode plein écran
   */
  toggleFullscreen: () => Promise<void>;
}

/**
 * Hook pour gérer le mode plein écran
 */
export function useFullscreen(
  options: UseFullscreenOptions = {}
): UseFullscreenReturn {
  const { element, onEnter, onExit } = options;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const elementRef = useRef<HTMLElement | null>(element || null);

  // Vérifier le support
  useEffect(() => {
    const supported =
      !!document.fullscreenEnabled ||
      !!(document as any).webkitFullscreenEnabled ||
      !!(document as any).mozFullScreenEnabled ||
      !!(document as any).msFullscreenEnabled;

    setIsSupported(supported);

    if (!elementRef.current) {
      elementRef.current = document.documentElement;
    }
  }, []);

  // Écouter les changements de plein écran
  useEffect(() => {
    if (!isSupported) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        !!document.fullscreenElement ||
        !!(document as any).webkitFullscreenElement ||
        !!(document as any).mozFullScreenElement ||
        !!(document as any).msFullscreenElement;

      setIsFullscreen(isCurrentlyFullscreen);

      if (isCurrentlyFullscreen) {
        onEnter?.();
      } else {
        onExit?.();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isSupported, onEnter, onExit]);

  const enterFullscreen = useCallback(async () => {
    if (!isSupported || !elementRef.current) return;

    try {
      const el = elementRef.current;

      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      } else if ((el as any).mozRequestFullScreen) {
        await (el as any).mozRequestFullScreen();
      } else if ((el as any).msRequestFullscreen) {
        await (el as any).msRequestFullscreen();
      }
    } catch (error) {
      logger.error('Error entering fullscreen', { error });
    }
  }, [isSupported]);

  const exitFullscreen = useCallback(async () => {
    if (!isSupported) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      logger.error('Error exiting fullscreen', { error });
    }
  }, [isSupported]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

