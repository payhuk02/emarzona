/**
 * Hook pour les micro-interactions
 * Ajoute des animations subtiles et du feedback visuel
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useHapticFeedback } from './useHapticFeedback';

interface MicroInteractionOptions {
  haptic?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  animation?: 'scale' | 'bounce' | 'pulse' | 'glow';
  duration?: number;
}

/**
 * Hook pour ajouter des micro-interactions aux éléments
 * 
 * @example
 * ```tsx
 * const { interactionProps, isInteracting } = useMicroInteractions({
 *   haptic: true,
 *   animation: 'scale'
 * });
 * 
 * <button {...interactionProps} onClick={handleClick}>
 *   Cliquer
 * </button>
 * ```
 */
export function useMicroInteractions(options: MicroInteractionOptions = {}) {
  const {
    haptic = false,
    hapticType = 'medium',
    animation = 'scale',
    duration = 200,
  } = options;

  const [isInteracting, setIsInteracting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { triggerHaptic } = useHapticFeedback();

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
    
    if (haptic) {
      triggerHaptic(hapticType);
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, duration);
  }, [haptic, hapticType, duration, triggerHaptic]);

  const handleInteractionEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsInteracting(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Classes CSS selon l'animation
  const animationClass = {
    scale: isInteracting ? 'scale-95' : 'scale-100',
    bounce: isInteracting ? 'animate-bounce-slow' : '',
    pulse: isInteracting ? 'animate-pulse-slow' : '',
    glow: isInteracting ? 'shadow-glow' : '',
  }[animation];

  const interactionProps = {
    onMouseDown: handleInteractionStart,
    onMouseUp: handleInteractionEnd,
    onTouchStart: handleInteractionStart,
    onTouchEnd: handleInteractionEnd,
    className: `transition-all duration-${duration} ${animationClass}`,
  };

  return {
    interactionProps,
    isInteracting,
  };
}

/**
 * Hook pour animer un compteur
 */
export function useAnimatedCounter(
  targetValue: number,
  duration: number = 1000
) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) {
      setDisplayValue(0);
      return;
    }

    const startValue = displayValue;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue, duration]);

  return displayValue;
}

/**
 * Hook pour détecter le scroll et animer les éléments
 */
export function useScrollAnimation(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  return {
    ref: elementRef,
    isVisible,
    className: isVisible
      ? 'animate-in fade-in slide-in-from-bottom-4 duration-700'
      : 'opacity-0',
  };
}







