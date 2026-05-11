/**
 * Utilitaires pour la manipulation du scroll
 * Fournit des fonctions réutilisables pour gérer le scroll
 */

export interface ScrollOptions {
  /**
   * Comportement du scroll
   * @default 'smooth'
   */
  behavior?: ScrollBehavior;
  /**
   * Offset vertical en pixels
   * @default 0
   */
  offset?: number;
  /**
   * Offset horizontal en pixels
   * @default 0
   */
  offsetX?: number;
}

/**
 * Scroll vers une position spécifique
 */
export function scrollToPosition(
  x: number,
  y: number,
  options: ScrollOptions = {}
): void {
  const { behavior = 'smooth' } = options;
  window.scrollTo({ left: x, top: y, behavior });
}

/**
 * Scroll vers le haut de la page
 */
export function scrollToTop(options: ScrollOptions = {}): void {
  const { behavior = 'smooth', offset = 0 } = options;
  window.scrollTo({ top: offset, behavior });
}

/**
 * Scroll vers le bas de la page
 */
export function scrollToBottom(options: ScrollOptions = {}): void {
  const { behavior = 'smooth', offset = 0 } = options;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  window.scrollTo({
    top: scrollHeight - clientHeight - offset,
    behavior,
  });
}

/**
 * Scroll vers un élément spécifique
 */
export function scrollToElement(
  element: HTMLElement | string,
  options: ScrollOptions = {}
): void {
  const { behavior = 'smooth', offset = 0 } = options;
  const targetElement =
    typeof element === 'string'
      ? document.querySelector<HTMLElement>(element)
      : element;

  if (!targetElement) return;

  const elementPosition = targetElement.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });
}

/**
 * Scroll horizontal vers une position spécifique
 */
export function scrollToHorizontalPosition(
  element: HTMLElement,
  position: number,
  options: ScrollOptions = {}
): void {
  const { behavior = 'smooth' } = options;
  element.scrollTo({ left: position, behavior });
}

/**
 * Scroll horizontal vers le début
 */
export function scrollToHorizontalStart(
  element: HTMLElement,
  options: ScrollOptions = {}
): void {
  scrollToHorizontalPosition(element, 0, options);
}

/**
 * Scroll horizontal vers la fin
 */
export function scrollToHorizontalEnd(
  element: HTMLElement,
  options: ScrollOptions = {}
): void {
  const { behavior = 'smooth' } = options;
  element.scrollTo({ left: element.scrollWidth, behavior });
}

/**
 * Obtient la position actuelle du scroll
 */
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop,
  };
}

/**
 * Obtient la position relative d'un élément par rapport à la fenêtre
 */
export function getElementPosition(element: HTMLElement): {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    bottom: rect.bottom + window.pageYOffset,
    right: rect.right + window.pageXOffset,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Vérifie si un élément est visible dans le viewport
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Vérifie si un élément est partiellement visible dans le viewport
 */
export function isElementPartiallyVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.top < windowHeight &&
    rect.bottom > 0 &&
    rect.left < windowWidth &&
    rect.right > 0
  );
}

/**
 * Obtient le pourcentage de scroll vertical
 */
export function getScrollPercentage(): number {
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (documentHeight <= windowHeight) return 0;

  return (scrollTop / (documentHeight - windowHeight)) * 100;
}

/**
 * Lock le scroll du body
 */
export function lockBodyScroll(): void {
  document.body.style.overflow = 'hidden';
}

/**
 * Unlock le scroll du body
 */
export function unlockBodyScroll(): void {
  document.body.style.overflow = '';
}

/**
 * Scroll jusqu'à ce qu'un élément soit visible
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement | string,
  options: ScrollOptions = {}
): void {
  const { behavior = 'smooth', offset = 0 } = options;
  const targetElement =
    typeof element === 'string'
      ? document.querySelector<HTMLElement>(element)
      : element;

  if (!targetElement) return;

  if (!isElementPartiallyVisible(targetElement)) {
    scrollToElement(targetElement, { behavior, offset });
  }
}







