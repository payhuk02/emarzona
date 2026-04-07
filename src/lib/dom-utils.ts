/**
 * Utilitaires pour la manipulation du DOM
 * Fournit des fonctions réutilisables pour manipuler le DOM
 */

/**
 * Obtient un élément par sélecteur
 */
export function querySelector<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T | null {
  return parent.querySelector<T>(selector);
}

/**
 * Obtient tous les éléments par sélecteur
 */
export function querySelectorAll<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): NodeListOf<T> {
  return parent.querySelectorAll<T>(selector);
}

/**
 * Obtient un élément par ID
 */
export function getElementById<T extends HTMLElement = HTMLElement>(
  id: string
): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Obtient des éléments par nom de classe
 */
export function getElementsByClassName<T extends Element = Element>(
  className: string,
  parent: Document | Element = document
): HTMLCollectionOf<T> {
  return parent.getElementsByClassName(className) as HTMLCollectionOf<T>;
}

/**
 * Obtient des éléments par nom de balise
 */
export function getElementsByTagName<T extends Element = Element>(
  tagName: string,
  parent: Document | Element = document
): HTMLCollectionOf<T> {
  return parent.getElementsByTagName(tagName) as HTMLCollectionOf<T>;
}

/**
 * Crée un élément
 */
export function createElement<T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  options?: ElementCreationOptions
): HTMLElementTagNameMap[T];
export function createElement(
  tagName: string,
  options?: ElementCreationOptions
): HTMLElement {
  return document.createElement(tagName, options);
}

/**
 * Crée un élément avec attributs
 */
export function createElementWithAttributes(
  tagName: string,
  attributes: Record<string, string>,
  textContent?: string
): HTMLElement {
  const element = createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}

/**
 * Crée un élément de texte
 */
export function createTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Ajoute un enfant à un élément
 */
export function appendChild<T extends Node>(
  parent: Node,
  child: T
): T {
  return parent.appendChild(child);
}

/**
 * Supprime un enfant d'un élément
 */
export function removeChild<T extends Node>(
  parent: Node,
  child: T
): T {
  return parent.removeChild(child);
}

/**
 * Remplace un enfant d'un élément
 */
export function replaceChild<T extends Node>(
  parent: Node,
  newChild: Node,
  oldChild: T
): T {
  return parent.replaceChild(newChild, oldChild);
}

/**
 * Insère un élément avant un autre
 */
export function insertBefore<T extends Node>(
  parent: Node,
  newNode: Node,
  referenceNode: T | null
): T {
  return parent.insertBefore(newNode, referenceNode) as T;
}

/**
 * Obtient le parent d'un élément
 */
export function getParentElement(element: Element): Element | null {
  return element.parentElement;
}

/**
 * Obtient les enfants d'un élément
 */
export function getChildren(element: Element): HTMLCollection {
  return element.children;
}

/**
 * Obtient le premier enfant d'un élément
 */
export function getFirstChild(element: Element): Element | null {
  return element.firstElementChild;
}

/**
 * Obtient le dernier enfant d'un élément
 */
export function getLastChild(element: Element): Element | null {
  return element.lastElementChild;
}

/**
 * Obtient le prochain élément sibling
 */
export function getNextSibling(element: Element): Element | null {
  return element.nextElementSibling;
}

/**
 * Obtient le précédent élément sibling
 */
export function getPreviousSibling(element: Element): Element | null {
  return element.previousElementSibling;
}

/**
 * Vérifie si un élément contient un autre
 */
export function contains(parent: Element, child: Element): boolean {
  return parent.contains(child);
}

/**
 * Vérifie si un élément correspond à un sélecteur
 */
export function matches(element: Element, selector: string): boolean {
  return element.matches(selector);
}

/**
 * Obtient les styles calculés d'un élément
 */
export function getComputedStyles(
  element: Element,
  pseudoElement?: string | null
): CSSStyleDeclaration {
  return window.getComputedStyle(element, pseudoElement);
}

/**
 * Obtient une propriété CSS calculée
 */
export function getComputedStyleProperty(
  element: Element,
  property: string,
  pseudoElement?: string | null
): string {
  return getComputedStyles(element, pseudoElement).getPropertyValue(property);
}

/**
 * Définit un style inline
 */
export function setStyle(
  element: HTMLElement,
  property: string,
  value: string
): void {
  element.style.setProperty(property, value);
}

/**
 * Définit plusieurs styles inline
 */
export function setStyles(
  element: HTMLElement,
  styles: Record<string, string>
): void {
  Object.entries(styles).forEach(([property, value]) => {
    setStyle(element, property, value);
  });
}

/**
 * Obtient un style inline
 */
export function getStyle(element: HTMLElement, property: string): string {
  return element.style.getPropertyValue(property);
}

/**
 * Supprime un style inline
 */
export function removeStyle(element: HTMLElement, property: string): void {
  element.style.removeProperty(property);
}

/**
 * Ajoute une classe à un élément
 */
export function addClass(element: Element, className: string): void {
  element.classList.add(className);
}

/**
 * Supprime une classe d'un élément
 */
export function removeClass(element: Element, className: string): void {
  element.classList.remove(className);
}

/**
 * Toggle une classe sur un élément
 */
export function toggleClass(
  element: Element,
  className: string,
  force?: boolean
): boolean {
  return element.classList.toggle(className, force);
}

/**
 * Vérifie si un élément a une classe
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * Ajoute plusieurs classes à un élément
 */
export function addClasses(element: Element, classNames: string[]): void {
  element.classList.add(...classNames);
}

/**
 * Supprime plusieurs classes d'un élément
 */
export function removeClasses(element: Element, classNames: string[]): void {
  element.classList.remove(...classNames);
}

/**
 * Obtient les attributs d'un élément
 */
export function getAttributes(element: Element): NamedNodeMap {
  return element.attributes;
}

/**
 * Obtient un attribut d'un élément
 */
export function getAttribute(element: Element, name: string): string | null {
  return element.getAttribute(name);
}

/**
 * Définit un attribut sur un élément
 */
export function setAttribute(
  element: Element,
  name: string,
  value: string
): void {
  element.setAttribute(name, value);
}

/**
 * Supprime un attribut d'un élément
 */
export function removeAttribute(element: Element, name: string): void {
  element.removeAttribute(name);
}

/**
 * Vérifie si un élément a un attribut
 */
export function hasAttribute(element: Element, name: string): boolean {
  return element.hasAttribute(name);
}

/**
 * Obtient le texte d'un élément
 */
export function getTextContent(element: Element): string {
  return element.textContent || '';
}

/**
 * Définit le texte d'un élément
 */
export function setTextContent(element: Element, text: string): void {
  element.textContent = text;
}

/**
 * Obtient le HTML d'un élément
 */
export function getInnerHTML(element: Element): string {
  return element.innerHTML;
}

/**
 * Définit le HTML d'un élément
 */
export function setInnerHTML(element: Element, html: string): void {
  element.innerHTML = html;
}

/**
 * Obtient les dimensions d'un élément
 */
export function getDimensions(element: HTMLElement): {
  width: number;
  height: number;
} {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

/**
 * Obtient la position d'un élément
 */
export function getPosition(element: HTMLElement): {
  x: number;
  y: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
  };
}

/**
 * Obtient le rectangle de bounding d'un élément
 */
export function getBoundingClientRect(element: Element): DOMRect {
  return element.getBoundingClientRect();
}

/**
 * Scroll vers un élément
 */
export function scrollToElement(
  element: Element,
  options?: ScrollIntoViewOptions
): void {
  element.scrollIntoView(options);
}

/**
 * Focus sur un élément
 */
export function focusElement(element: HTMLElement): void {
  element.focus();
}

/**
 * Blur un élément
 */
export function blurElement(element: HTMLElement): void {
  element.blur();
}

/**
 * Vérifie si un élément est visible
 */
export function isVisible(element: HTMLElement): boolean {
  const styles = getComputedStyles(element);
  return (
    styles.display !== 'none' &&
    styles.visibility !== 'hidden' &&
    styles.opacity !== '0'
  );
}

/**
 * Vérifie si un élément est focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.tabIndex;

  if (tabIndex < 0) return false;

  if (
    tagName === 'input' ||
    tagName === 'select' ||
    tagName === 'textarea' ||
    tagName === 'button' ||
    tagName === 'a'
  ) {
    return !element.hasAttribute('disabled');
  }

  return tabIndex >= 0;
}







