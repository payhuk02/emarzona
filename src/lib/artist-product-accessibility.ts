/**
 * ♿ ARTIST PRODUCT ACCESSIBILITY - Phase 4 Accessibilité
 * Date: 31 Janvier 2025
 *
 * Utilitaires d'accessibilité pour le wizard "Oeuvre d'artiste"
 * Conformité WCAG 2.1 Level AA
 */

/**
 * Génère les attributs ARIA pour un champ de formulaire
 */
export interface AriaFieldAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'false' | 'true' | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-errormessage'?: string;
  role?: string;
}

/**
 * Crée les attributs ARIA pour un champ de formulaire
 */
export function createAriaFieldAttributes(options: {
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: string | null;
  errorId?: string;
  hintId?: string;
  describedBy?: string;
}): AriaFieldAttributes {
  const { id, label, required = false, error, hint, errorId, hintId, describedBy } = options;

  const  attributes: AriaFieldAttributes = {};

  // aria-labelledby: Référence au label
  attributes['aria-labelledby'] = `${id}-label`;

  // aria-describedby: Combine hint et error
  const  describedByParts: string[] = [];
  if (hint && hintId) {
    describedByParts.push(hintId);
  }
  if (error && errorId) {
    describedByParts.push(errorId);
  }
  if (describedBy) {
    describedByParts.push(describedBy);
  }
  if (describedByParts.length > 0) {
    attributes['aria-describedby'] = describedByParts.join(' ');
  }

  // aria-invalid: Indique si le champ est invalide
  if (error) {
    attributes['aria-invalid'] = true;
  }

  // aria-required: Indique si le champ est requis
  if (required) {
    attributes['aria-required'] = true;
  }

  return attributes;
}

/**
 * Crée les attributs ARIA pour un message d'erreur
 */
export function createAriaErrorAttributes(errorId: string): {
  id: string;
  role: 'alert';
  'aria-live': 'polite';
  'aria-atomic': boolean;
} {
  return {
    id: errorId,
    role: 'alert',
    'aria-live': 'polite',
    'aria-atomic': true,
  };
}

/**
 * Crée les attributs ARIA pour un message d'aide
 */
export function createAriaHintAttributes(hintId: string): {
  id: string;
  role?: string;
} {
  return {
    id: hintId,
  };
}

/**
 * Crée les attributs ARIA pour un label
 */
export function createAriaLabelAttributes(
  id: string,
  required?: boolean
): {
  id: string;
  htmlFor: string;
} {
  return {
    id: `${id}-label`,
    htmlFor: id,
  };
}

/**
 * Génère un ID unique pour un élément ARIA
 */
export function generateAriaId(prefix: string, fieldId: string, suffix?: string): string {
  return suffix ? `${fieldId}-${prefix}-${suffix}` : `${fieldId}-${prefix}`;
}

/**
 * Crée les attributs ARIA pour un groupe de champs (fieldset)
 */
export function createAriaFieldsetAttributes(options: { legend: string; describedBy?: string }): {
  role: 'group';
  'aria-labelledby': string;
  'aria-describedby'?: string;
} {
  const { legend, describedBy } = options;
  const legendId = `legend-${Date.now()}`;

  const  attributes: {
    role: 'group';
    'aria-labelledby': string;
    'aria-describedby'?: string;
  } = {
    role: 'group',
    'aria-labelledby': legendId,
  };

  if (describedBy) {
    attributes['aria-describedby'] = describedBy;
  }

  return attributes;
}

/**
 * Crée les attributs ARIA pour un bouton d'action
 */
export function createAriaButtonAttributes(options: {
  label: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  describedBy?: string;
}): {
  'aria-label': string;
  'aria-pressed'?: boolean | 'false' | 'true' | 'mixed';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-describedby'?: string;
} {
  const { label, pressed, expanded, controls, describedBy } = options;

  const  attributes: {
    'aria-label': string;
    'aria-pressed'?: boolean | 'false' | 'true' | 'mixed';
    'aria-expanded'?: boolean;
    'aria-controls'?: string;
    'aria-describedby'?: string;
  } = {
    'aria-label': label,
  };

  if (pressed !== undefined) {
    attributes['aria-pressed'] = pressed;
  }

  if (expanded !== undefined) {
    attributes['aria-expanded'] = expanded;
  }

  if (controls) {
    attributes['aria-controls'] = controls;
  }

  if (describedBy) {
    attributes['aria-describedby'] = describedBy;
  }

  return attributes;
}

/**
 * Crée les attributs ARIA pour une région live (mises à jour dynamiques)
 */
export function createAriaLiveRegionAttributes(options: {
  id: string;
  atomic?: boolean;
  assertive?: boolean;
}): {
  id: string;
  role: 'status';
  'aria-live': 'polite' | 'assertive';
  'aria-atomic': boolean;
} {
  const { id, atomic = true, assertive = false } = options;

  return {
    id,
    role: 'status',
    'aria-live': assertive ? 'assertive' : 'polite',
    'aria-atomic': atomic,
  };
}

/**
 * Crée les attributs ARIA pour un onglet (tab)
 */
export function createAriaTabAttributes(options: {
  id: string;
  controls: string;
  selected: boolean;
  label: string;
}): {
  id: string;
  role: 'tab';
  'aria-controls': string;
  'aria-selected': boolean;
  'aria-label': string;
  tabIndex: number;
} {
  const { id, controls, selected, label } = options;

  return {
    id,
    role: 'tab',
    'aria-controls': controls,
    'aria-selected': selected,
    'aria-label': label,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * Crée les attributs ARIA pour un panneau d'onglet (tabpanel)
 */
export function createAriaTabPanelAttributes(options: {
  id: string;
  labelledBy: string;
  hidden?: boolean;
}): {
  id: string;
  role: 'tabpanel';
  'aria-labelledby': string;
  'aria-hidden'?: boolean;
  tabIndex?: number;
} {
  const { id, labelledBy, hidden = false } = options;

  const  attributes: {
    id: string;
    role: 'tabpanel';
    'aria-labelledby': string;
    'aria-hidden'?: boolean;
    tabIndex?: number;
  } = {
    id,
    role: 'tabpanel',
    'aria-labelledby': labelledBy,
  };

  if (hidden) {
    attributes['aria-hidden'] = true;
  } else {
    attributes.tabIndex = 0;
  }

  return attributes;
}

/**
 * Annonce un changement pour les lecteurs d'écran
 */
export function announceToScreenReader(message: string, assertive: boolean = false): void {
  const announcementId = `sr-announcement-${Date.now()}`;
  const announcement = document.createElement('div');

  announcement.id = announcementId;
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Retirer après annonce
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Vérifie si un élément est visible pour les lecteurs d'écran
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);

  // Vérifier si l'élément est caché
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  // Vérifier aria-hidden
  const ariaHidden = element.getAttribute('aria-hidden');
  if (ariaHidden === 'true') {
    return false;
  }

  return true;
}

/**
 * Masque visuellement mais garde accessible aux lecteurs d'écran
 */
export const srOnly =
  'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

/**
 * Classe CSS pour masquer visuellement mais garder accessible
 */
export const screenReaderOnly = srOnly;






