/**
 * Hook pour le feedback haptique sur mobile
 * Améliore l'expérience utilisateur avec des vibrations subtiles
 */

import { useCallback } from 'react';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticFeedbackOptions {
  type?: HapticFeedbackType;
  enabled?: boolean;
}

/**
 * Hook pour utiliser le feedback haptique
 *
 * @example
 * ```tsx
 * const { triggerHaptic } = useHapticFeedback();
 *
 * <button onClick={() => {
 *   triggerHaptic('medium');
 *   handleClick();
 * }}>
 *   Cliquer
 * </button>
 * ```
 */
export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const { enabled = true } = options;

  const triggerHaptic = useCallback(
    (type: HapticFeedbackType = 'medium') => {
      if (!enabled) return;

      // Vérifier si l'API Vibration est disponible
      if (!('vibrate' in navigator)) {
        return;
      }

      // Patterns de vibration selon le type
      const patterns: Record<HapticFeedbackType, number | number[]> = {
        light: 10, // Vibration légère (10ms)
        medium: 20, // Vibration moyenne (20ms)
        heavy: 40, // Vibration forte (40ms)
        success: [20, 10, 20], // Success: vibration double
        warning: [30, 20, 30], // Warning: vibration triple
        error: [50, 30, 50, 30, 50], // Error: vibration multiple
      };

      const pattern = patterns[type];

      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // ✅ PHASE 2: Remplacer console.debug par logger (debug level)
        logger.debug('Haptic feedback not supported', { error, type });
      }
    },
    [enabled]
  );

  return { triggerHaptic };
}

/**
 * Hook pour wrapper un onClick avec feedback haptique
 *
 * @example
 * ```tsx
 * const { onClickWithHaptic } = useHapticFeedback();
 *
 * <button onClick={onClickWithHaptic(handleClick, 'medium')}>
 *   Cliquer
 * </button>
 * ```
 */
export function useHapticOnClick() {
  const { triggerHaptic } = useHapticFeedback();

  const onClickWithHaptic = useCallback(
    <T extends (...args: unknown[]) => unknown>(
      handler: T,
      type: HapticFeedbackType = 'medium'
    ) => {
      return (...args: Parameters<T>) => {
        triggerHaptic(type);
        return handler(...args);
      };
    },
    [triggerHaptic]
  );

  return { onClickWithHaptic };
}
