export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getStoreDomain = (): string => {
  // Détermine le domaine racine utilisé pour les boutiques.
  // Priorité :
  // 1. Variable d'environnement explicite (recommandée en production)
  // 2. Domaine actuel (hostname) comme fallback
  const meta = import.meta as unknown as {
    env?: {
      VITE_PUBLIC_STORE_DOMAIN?: string;
      VITE_APP_DOMAIN?: string;
      VITE_SITE_URL?: string;
    };
  };

  const envDomain =
    meta.env?.VITE_PUBLIC_STORE_DOMAIN || meta.env?.VITE_APP_DOMAIN || meta.env?.VITE_SITE_URL;

  if (envDomain && typeof envDomain === 'string') {
    // Normaliser : retirer le protocole et les éventuels slashs de fin
    return envDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }

  // Fallback : on utilise le hostname courant (dev ou prod)
  const hostname = window.location.hostname;
  return hostname;
};

export const generateStoreUrl = (slug: string, customDomain?: string): string => {
  const domain = customDomain || getStoreDomain();
  const protocol = window.location.protocol;
  return `${protocol}//${slug}.${domain}`;
};

export const generateProductUrl = (
  storeSlug: string,
  productSlug: string,
  customDomain?: string
): string => {
  const domain = customDomain || getStoreDomain();
  const protocol = window.location.protocol;
  return `${protocol}//${storeSlug}.${domain}/${productSlug}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (_err2) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
