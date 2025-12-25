/**
 * Système de z-index cohérent pour toute l'application
 * Garantit qu'il n'y a pas de conflits entre les couches
 */
export const zIndex = {
  /** Éléments de base */
  base: 0,
  
  /** Éléments sticky (headers, navs) */
  sticky: 10,
  
  /** Éléments fixed (boutons flottants) */
  fixed: 20,
  
  /** Dropdowns et menus déroulants */
  dropdown: 1000,
  
  /** Éléments sticky avancés (nav sticky avec backdrop) */
  stickyBackdrop: 1020,
  
  /** Éléments fixed avancés (boutons avec backdrop) */
  fixedBackdrop: 1030,
  
  /** Backdrop des modals (overlay) */
  modalBackdrop: 1040,
  
  /** Contenu des modals (dialogs, alerts) */
  modal: 1050,
  
  /** Popovers (tooltips, hints) */
  popover: 1060,
  
  /** Tooltips (au-dessus des popovers) */
  tooltip: 1070,
  
  /** Toasts et notifications (au-dessus de tout) */
  toast: 1080,
} as const;

/**
 * Helper pour obtenir la valeur z-index
 */
export const getZIndex = (key: keyof typeof zIndex): number => {
  return zIndex[key];
};

