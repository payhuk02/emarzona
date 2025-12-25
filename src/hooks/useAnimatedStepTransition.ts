/**
 * Hook pour animations fluides de transition entre étapes
 * Utilise requestAnimationFrame pour performance optimale
 * Date: 28 Janvier 2025
 */

import { useCallback, useRef } from 'react';

interface AnimatedStepTransitionOptions {
  duration?: number;
  easing?: (t: number) => number;
  onStart?: () => void;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

/**
 * Easing functions pour animations fluides
 */
export const easings = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: (t: number) => t * (2 - t),
  easeIn: (t: number) => t * t,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

/**
 * Hook pour animations de transition entre étapes avec requestAnimationFrame
 */
export function useAnimatedStepTransition() {
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const animate = useCallback(
    (options: AnimatedStepTransitionOptions = {}) => {
      const {
        duration = 300,
        easing = easings.easeInOut,
        onStart,
        onProgress,
        onComplete,
      } = options;

      // Annuler animation précédente si en cours
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startTime = performance.now();
      startTimeRef.current = startTime;

      onStart?.();

      const animateFrame = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easing(progress);

        onProgress?.(easedProgress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animateFrame);
        } else {
          animationFrameRef.current = null;
          startTimeRef.current = null;
          onComplete?.();
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateFrame);
    },
    []
  );

  const cancel = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      startTimeRef.current = null;
    }
  }, []);

  return { animate, cancel };
}

