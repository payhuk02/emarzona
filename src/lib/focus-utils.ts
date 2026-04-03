/**
 * Utilitaires pour la gestion du focus
 * Fournit des fonctions réutilisables pour gérer le focus et l'accessibilité
 */

/**
 * Sélecteur pour les éléments focusables
 */
export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Obtient tous les éléments focusables dans un conteneur
 */
export function getFocusableElements(
  container: HTMLElement | Document = document
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter((el) => {
    // Filtrer les éléments cachés
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      !el.hasAttribute('disabled') &&
      el.tabIndex !== -1
    );
  });
}

/**
 * Obtient le premier élément focusable
 */
export function getFirstFocusable(
  container: HTMLElement | Document = document
): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}

/**
 * Obtient le dernier élément focusable
 */
export function getLastFocusable(
  container: HTMLElement | Document = document
): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] || null;
}

/**
 * Focus le premier élément focusable
 */
export function focusFirst(
  container: HTMLElement | Document = document
): boolean {
  const first = getFirstFocusable(container);
  if (first) {
    first.focus();
    return true;
  }
  return false;
}

/**
 * Focus le dernier élément focusable
 */
export function focusLast(
  container: HTMLElement | Document = document
): boolean {
  const last = getLastFocusable(container);
  if (last) {
    last.focus();
    return true;
  }
  return false;
}

/**
 * Focus un élément par son sélecteur ou référence
 */
export function focusElement(
  element: HTMLElement | string
): boolean {
  const targetElement =
    typeof element === 'string'
      ? document.querySelector<HTMLElement>(element)
      : element;

  if (targetElement) {
    targetElement.focus();
    return true;
  }
  return false;
}

/**
 * Retire le focus de l'élément actuellement focusé
 */
export function blurActiveElement(): void {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}

/**
 * Vérifie si un élément est focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled') || element.tabIndex === -1) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }

  return element.matches(FOCUSABLE_SELECTOR);
}

/**
 * Crée un trap de focus pour une modale
 */
export function createFocusTrap(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);

  // Focus le premier élément
  firstElement?.focus();

  // Fonction de nettoyage
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Restaure le focus à un élément précédent
 */
export function restoreFocus(element: HTMLElement | null): void {
  if (element && isFocusable(element)) {
    element.focus();
  }
}

/**
 * Sauvegarde l'élément actuellement focusé
 */
export function saveActiveElement(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;
}

/**
 * Focus le prochain élément focusable
 */
export function focusNext(
  currentElement: HTMLElement,
  container: HTMLElement | Document = document
): boolean {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(currentElement);

  if (currentIndex === -1 || currentIndex === elements.length - 1) {
    return false;
  }

  const nextElement = elements[currentIndex + 1];
  if (nextElement) {
    nextElement.focus();
    return true;
  }

  return false;
}

/**
 * Focus l'élément précédent focusable
 */
export function focusPrevious(
  currentElement: HTMLElement,
  container: HTMLElement | Document = document
): boolean {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(currentElement);

  if (currentIndex === -1 || currentIndex === 0) {
    return false;
  }

  const previousElement = elements[currentIndex - 1];
  if (previousElement) {
    previousElement.focus();
    return true;
  }

  return false;
}

/**
 * Annonce un message aux lecteurs d'écran
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Retirer après un délai
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}







