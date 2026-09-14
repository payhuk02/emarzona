/**
 * Navigation SPA : évite les rechargements complets quand la cible est same-origin.
 */
import type { NavigateFunction } from 'react-router-dom';

export function isAbsoluteHttpUrl(to: string): boolean {
  return /^https?:\/\//i.test(to);
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
