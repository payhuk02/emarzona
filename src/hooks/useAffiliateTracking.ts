/**
 * Hook: useAffiliateTracking
 * Description: Utilitaire pour récupérer et gérer le cookie d'affiliation
 */

/**
 * Récupère le cookie d'affiliation stocké dans le navigateur
 */
export function getAffiliateTrackingCookie(): string | null {
  // Essayer de récupérer depuis le cookie
  const nameEQ = 'affiliate_tracking_cookie=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }

  // Essayer depuis localStorage (backup)
  try {
    const stored = localStorage.getItem('affiliate_tracking_info');
    if (stored) {
      const info = JSON.parse(stored);
      if (info.tracking_cookie && new Date(info.expires_at) > new Date()) {
        return info.tracking_cookie;
      }
    }
  } catch (error) {
    // Ignore parse errors
  }

  return null;
}

/**
 * Récupère les informations complètes de tracking d'affiliation
 */
export function getAffiliateTrackingInfo(): {
  tracking_cookie: string;
  product_id: string;
  store_id: string;
  expires_at: string;
} | null {
  try {
    const stored = localStorage.getItem('affiliate_tracking_info');
    if (stored) {
      const info = JSON.parse(stored);
      if (info.tracking_cookie && new Date(info.expires_at) > new Date()) {
        return info;
      }
    }
  } catch (error) {
    // Ignore parse errors
  }

  return null;
}

/**
 * Vérifie si un cookie d'affiliation valide existe
 */
export function hasAffiliateTracking(): boolean {
  return getAffiliateTrackingCookie() !== null;
}

