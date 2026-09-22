/**
 * Navigation SPA : évite les rechargements complets quand la cible est same-origin.
 * `registerSoftNavigate` permet softNavigateTo() hors composants (notifs, error class).
 */
import type { NavigateFunction } from 'react-router-dom';

export function isAbsoluteHttpUrl(to: string): boolean {
  return /^https?:\/\//i.test(to);
}

let registeredNavigate: NavigateFunction | null = null;

/** Enregistrer depuis un composant sous BrowserRouter (ex. AppContent). */
export function registerSoftNavigate(navigate: NavigateFunction | null): void {
  registeredNavigate = navigate;
}

/**
 * Chemins relatifs ou URL same-origin → chemin SPA.
 * URL cross-origin inchangée (hard nav volontaire).
 */
export function toSoftNavTarget(to: string): string {
  const target = to?.trim();
  if (!target) return target;

  if (!isAbsoluteHttpUrl(target)) {
    return target;
  }

  try {
    const url = new URL(target);
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    /* URL invalide */
  }

  return target;
}

/**
 * Soft nav sans registrant RR : pushState + popstate pour mettre à jour BrowserRouter
 * sans recharger le boot (évite location.assign).
 */
function softPushState(pathWithSearchHash: string): void {
  if (typeof window === 'undefined') return;
  const next = pathWithSearchHash.startsWith('/') ? pathWithSearchHash : `/${pathWithSearchHash}`;
  window.history.pushState(window.history.state, '', next);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

/**
 * Navigue en client-side si chemin relatif ou même origine ;
 * sinon assign hard (sous-domaine boutique / domaine custom).
 */
export function softNavigate(navigate: NavigateFunction, to: string): void {
  const target = to?.trim();
  if (!target) return;

  const soft = toSoftNavTarget(target);
  if (!isAbsoluteHttpUrl(soft)) {
    navigate(soft);
    return;
  }

  window.location.assign(soft);
}

/** Soft nav sans hook — utilise le navigate enregistré, sinon pushState (relatif) / assign. */
export function softNavigateTo(to: string): void {
  const target = to?.trim();
  if (!target) return;

  if (registeredNavigate) {
    softNavigate(registeredNavigate, target);
    return;
  }

  const soft = toSoftNavTarget(target);
  if (!isAbsoluteHttpUrl(soft)) {
    softPushState(soft);
    return;
  }

  window.location.assign(soft);
}
