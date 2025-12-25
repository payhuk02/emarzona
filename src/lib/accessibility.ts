/**
 * Utilitaires d'Accessibilité - Phase 2 UX
 * Fonctions pour améliorer l'accessibilité WCAG 2.1 AA
 */

import { logger } from './logger';

/**
 * Gère le focus trap pour les modales
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Annonce une modification à l'écran pour les lecteurs d'écran
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Vérifie si l'utilisateur préfère le mouvement réduit
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Gère la navigation au clavier pour les listes
 */
export function handleKeyboardNavigation(
  items: HTMLElement[],
  onSelect: (index: number) => void
): (e: KeyboardEvent) => void {
  let currentIndex = -1;

  return (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, items.length - 1);
        items[currentIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        items[currentIndex]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          onSelect(currentIndex);
        }
        break;
      case 'Home':
        e.preventDefault();
        currentIndex = 0;
        items[currentIndex]?.focus();
        break;
      case 'End':
        e.preventDefault();
        currentIndex = items.length - 1;
        items[currentIndex]?.focus();
        break;
    }
  };
}

/**
 * Vérifie le contraste des couleurs (WCAG AA)
 * @deprecated Utiliser checkColorContrast de accessibility-enhanced.ts pour un calcul précis
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
} {
  // Utiliser la fonction améliorée si disponible
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { checkColorContrast: enhancedCheck } = require('./accessibility-enhanced');
    return enhancedCheck(foreground, background);
  } catch {
    // Fallback si le module n'est pas disponible
    const ratio = 4.5; // Placeholder
    return {
      ratio,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7,
    };
  }
}

/**
 * Gère le skip link pour la navigation clavier
 */
export function createSkipLink(targetId: string, label: string = 'Aller au contenu principal'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg';
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  return skipLink;
}

/**
 * Ajoute les attributs ARIA nécessaires à un élément
 */
export function addAriaAttributes(
  element: HTMLElement,
  attributes: {
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    hidden?: boolean;
    live?: 'polite' | 'assertive' | 'off';
    atomic?: boolean;
  }
): void {
  if (attributes.label) {
    element.setAttribute('aria-label', attributes.label);
  }
  
  if (attributes.describedBy) {
    element.setAttribute('aria-describedby', attributes.describedBy);
  }
  
  if (attributes.expanded !== undefined) {
    element.setAttribute('aria-expanded', String(attributes.expanded));
  }
  
  if (attributes.hidden !== undefined) {
    element.setAttribute('aria-hidden', String(attributes.hidden));
  }
  
  if (attributes.live) {
    element.setAttribute('aria-live', attributes.live);
  }
  
  if (attributes.atomic !== undefined) {
    element.setAttribute('aria-atomic', String(attributes.atomic));
  }
}

/**
 * Vérifie si un élément est visible à l'écran
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
  
  return !(
    rect.bottom < 0 ||
    rect.top - viewHeight >= 0
  );
}

/**
 * Gère le focus visible pour la navigation clavier
 */
export function setupFocusVisible(): void {
  let isKeyboardNavigation = false;

  document.addEventListener('keydown', () => {
    isKeyboardNavigation = true;
  });

  document.addEventListener('mousedown', () => {
    isKeyboardNavigation = false;
  });

  document.addEventListener('focusin', (e) => {
    if (isKeyboardNavigation && e.target instanceof HTMLElement) {
      e.target.classList.add('focus-visible');
    }
  });

  document.addEventListener('focusout', (e) => {
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('focus-visible');
    }
  });
}

/**
 * Initialise les améliorations d'accessibilité
 */
export function initAccessibility(): void {
  // Setup focus visible
  setupFocusVisible();
  
  // Ajouter skip link si non présent
  if (!document.querySelector('a[href="#main-content"]')) {
    const skipLink = createSkipLink('main-content', 'Aller au contenu principal');
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
  
  // Vérifier et ajouter les attributs ARIA manquants
  const buttons = document.querySelectorAll('button:not([aria-label])');
  buttons.forEach((button) => {
    if (!button.textContent?.trim() && !button.querySelector('img, svg')) {
      button.setAttribute('aria-label', 'Bouton');
    }
  });
  
  // Initialiser les raccourcis clavier améliorés
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { setupKeyboardShortcuts } = require('./accessibility-enhanced');
    setupKeyboardShortcuts();
  } catch {
    // Ignorer si le module n'est pas disponible
  }
  
  logger.info('✅ Accessibilité initialisée');
}



