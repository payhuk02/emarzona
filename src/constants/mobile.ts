/**
 * Constantes pour l'optimisation mobile
 * Centralise toutes les valeurs utilisées pour la détection et l'optimisation mobile
 */

// Breakpoints (cohérents avec Tailwind)
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1280;

// Touch targets (Apple/Google guidelines)
export const MIN_TOUCH_TARGET = 44; // pixels

// Spacing pour mobile
export const MOBILE_COLLISION_PADDING = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

export const DESKTOP_COLLISION_PADDING = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

// Side offsets
export const MOBILE_SIDE_OFFSET = 4;
export const DESKTOP_SIDE_OFFSET = 8;

// Délais (si nécessaire)
export const MOBILE_ANIMATION_DELAY = 0; // ms
export const DESKTOP_ANIMATION_DELAY = 0; // ms

