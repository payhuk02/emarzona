/**
 * Utilitaires pour la gestion des événements
 * Fournit des fonctions réutilisables pour gérer les événements DOM
 */

export type EventHandler<T = Event> = (event: T) => void;
export type EventTarget = Window | Document | HTMLElement | Element;

/**
 * Options pour addEventListener
 */
export interface EventListenerOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

/**
 * Ajoute un écouteur d'événement avec options
 */
export function addEventListener<T extends EventTarget>(
  target: T,
  event: string,
  handler: EventHandler,
  options?: EventListenerOptions
): () => void {
  target.addEventListener(event, handler as EventListener, options);
  return () => {
    target.removeEventListener(event, handler as EventListener, options);
  };
}

/**
 * Ajoute plusieurs écouteurs d'événements
 */
export function addEventListeners(
  target: EventTarget,
  events: Record<string, EventHandler>,
  options?: EventListenerOptions
): () => void {
  const removers = Object.entries(events).map(([event, handler]) =>
    addEventListener(target, event, handler, options)
  );

  return () => {
    removers.forEach((remove) => remove());
  };
}

/**
 * Crée un événement personnalisé
 */
export function createCustomEvent<T = any>(
  name: string,
  detail?: T,
  options?: CustomEventInit
): CustomEvent<T> {
  return new CustomEvent(name, {
    detail,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

/**
 * Dispatch un événement personnalisé
 */
export function dispatchCustomEvent<T = any>(
  target: EventTarget,
  name: string,
  detail?: T,
  options?: CustomEventInit
): boolean {
  const event = createCustomEvent(name, detail, options);
  return target.dispatchEvent(event);
}

/**
 * Délègue un événement à un élément parent
 */
export function delegateEvent(
  parent: HTMLElement,
  selector: string,
  event: string,
  handler: (event: Event, element: HTMLElement) => void,
  options?: EventListenerOptions
): () => void {
  const eventHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target && target.matches(selector)) {
      handler(e, target);
    }
  };

  return addEventListener(parent, event, eventHandler, options);
}

/**
 * Délègue plusieurs événements à un élément parent
 */
export function delegateEvents(
  parent: HTMLElement,
  selector: string,
  events: Record<string, (event: Event, element: HTMLElement) => void>,
  options?: EventListenerOptions
): () => void {
  const removers = Object.entries(events).map(([event, handler]) =>
    delegateEvent(parent, selector, event, handler, options)
  );

  return () => {
    removers.forEach((remove) => remove());
  };
}

/**
 * Préviens le comportement par défaut d'un événement
 */
export function preventDefault(event: Event): void {
  event.preventDefault();
}

/**
 * Arrête la propagation d'un événement
 */
export function stopPropagation(event: Event): void {
  event.stopPropagation();
}

/**
 * Arrête la propagation immédiate d'un événement
 */
export function stopImmediatePropagation(event: Event): void {
  event.stopImmediatePropagation();
}

/**
 * Préviens le comportement par défaut et arrête la propagation
 */
export function preventDefaultAndStopPropagation(event: Event): void {
  preventDefault(event);
  stopPropagation(event);
}

/**
 * Vérifie si un événement est annulable
 */
export function isCancelable(event: Event): boolean {
  return event.cancelable;
}

/**
 * Vérifie si la propagation a été arrêtée
 */
export function isPropagationStopped(event: Event): boolean {
  return event.defaultPrevented;
}

/**
 * Obtient le target d'un événement
 */
export function getEventTarget(event: Event): EventTarget | null {
  return event.target;
}

/**
 * Obtient le currentTarget d'un événement
 */
export function getCurrentTarget(event: Event): EventTarget | null {
  return event.currentTarget;
}

/**
 * Obtient les coordonnées de la souris depuis un événement
 */
export function getMouseCoordinates(event: MouseEvent): { x: number; y: number } {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Obtient les coordonnées du clic depuis un événement
 */
export function getClickCoordinates(event: MouseEvent): { x: number; y: number } {
  return getMouseCoordinates(event);
}

/**
 * Obtient les touches depuis un événement clavier
 */
export function getKeyboardKeys(event: KeyboardEvent): {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
} {
  return {
    key: event.key,
    code: event.code,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
  };
}

/**
 * Vérifie si une touche spécifique est pressée
 */
export function isKeyPressed(
  event: KeyboardEvent,
  key: string | string[]
): boolean {
  const keys = Array.isArray(key) ? key : [key];
  return keys.some((k) => event.key === k || event.code === k);
}

/**
 * Vérifie si Ctrl/Cmd est pressé
 */
export function isCtrlOrCmdPressed(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

/**
 * Obtient les données de transfert depuis un événement drag
 */
export function getDragData(
  event: DragEvent,
  format?: string
): string | null {
  if (format) {
    return event.dataTransfer?.getData(format) || null;
  }
  return event.dataTransfer?.getData('text') || null;
}

/**
 * Définit les données de transfert pour un événement drag
 */
export function setDragData(
  event: DragEvent,
  format: string,
  data: string
): void {
  event.dataTransfer?.setData(format, data);
}

/**
 * Obtient les fichiers depuis un événement drag
 */
export function getDragFiles(event: DragEvent): FileList | null {
  return event.dataTransfer?.files || null;
}

/**
 * Crée un événement synthétique
 */
export function createSyntheticEvent<T extends Event>(
  type: string,
  init?: EventInit
): T {
  return new Event(type, init) as T;
}

/**
 * Crée un événement de clic synthétique
 */
export function createSyntheticClickEvent(
  init?: MouseEventInit
): MouseEvent {
  return new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    ...init,
  });
}







