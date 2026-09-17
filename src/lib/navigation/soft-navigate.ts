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
 * Navigue en client-side si chemin relatif ou même origine ;
 * sinon assign hard (sous-domaine boutique / domaine custom).
 */
export function softNavigate(navigate: NavigateFunction, to: string): void {
  const target = to?.trim();
  if (!target) return;

  if (!isAbsoluteHttpUrl(target)) {
    navigate(target);
    return;
  }

  try {
    const url = new URL(target);
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      navigate(`${url.pathname}${url.search}${url.hash}`);
      return;
    }
  } catch {
    /* URL invalide — fallback */
  }

  window.location.assign(target);
}

/** Soft nav sans hook — utilise le navigate enregistré, sinon hard assign. */
export function softNavigateTo(to: string): void {
  const target = to?.trim();
  if (!target) return;

  if (registeredNavigate) {
    softNavigate(registeredNavigate, target);
    return;
  }

  if (!isAbsoluteHttpUrl(target)) {
    window.location.assign(target);
    return;
  }

  try {
    const url = new URL(target);
    if (typeof window !== 'undefined' && url.origin === window.location.origin) {
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
      return;
    }
  } catch {
    /* fall through */
  }

  window.location.assign(target);
}
