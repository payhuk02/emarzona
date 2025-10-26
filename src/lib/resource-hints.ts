/**
 * Resource Hints pour optimiser le chargement
 * Preconnect, DNS-prefetch, Preload, Prefetch
 */

/**
 * Ajouter un resource hint
 */
function addResourceHint(rel: string, href: string, attributes?: Record<string, string>): HTMLLinkElement {
  // Vérifier si déjà présent
  const existing = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
  if (existing) {
    return existing as HTMLLinkElement;
  }

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      link.setAttribute(key, value);
    });
  }

  document.head.appendChild(link);
  return link;
}

/**
 * Preconnect : Établir une connexion précoce à un domaine
 */
export function preconnect(href: string, crossorigin?: boolean): HTMLLinkElement {
  const attributes: Record<string, string> = {};
  if (crossorigin) {
    attributes.crossorigin = 'anonymous';
  }
  return addResourceHint('preconnect', href, attributes);
}

/**
 * DNS-prefetch : Résoudre le DNS d'un domaine à l'avance
 */
export function dnsPrefetch(href: string): HTMLLinkElement {
  return addResourceHint('dns-prefetch', href);
}

/**
 * Preload : Charger une ressource prioritaire
 */
export function preload(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch' | 'document',
  attributes?: Record<string, string>
): HTMLLinkElement {
  return addResourceHint('preload', href, { as, ...attributes });
}

/**
 * Prefetch : Charger une ressource pour navigation future
 */
export function prefetch(
  href: string,
  as?: string
): HTMLLinkElement {
  const attributes = as ? { as } : undefined;
  return addResourceHint('prefetch', href, attributes);
}

/**
 * Modulepreload : Précharger un module ES6
 */
export function modulePreload(href: string): HTMLLinkElement {
  return addResourceHint('modulepreload', href);
}

/**
 * Configurer tous les resource hints pour l'application
 */
export function setupResourceHints(): void {
  // Preconnect vers les domaines externes critiques
  preconnect('https://fonts.googleapis.com');
  preconnect('https://fonts.gstatic.com', true);
  
  // Supabase
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    preconnect(url.origin, true);
    dnsPrefetch(url.origin);
  }

  // API Moneroo
  preconnect('https://api.moneroo.io', true);
  dnsPrefetch('https://api.moneroo.io');

  // CDN externes
  preconnect('https://cdn.jsdelivr.net');
  dnsPrefetch('https://cdn.jsdelivr.net');

  // Preload des fonts critiques
  preload('/fonts/Poppins-Regular.woff2', 'font', {
    type: 'font/woff2',
    crossorigin: 'anonymous',
  });

  console.log('[Resource Hints] Resource hints configured');
}

/**
 * Ajouter des hints pour la navigation future
 */
export function addNavigationHints(routes: string[]): void {
  routes.forEach((route) => {
    prefetch(route, 'document');
  });
}

/**
 * Preload des images critiques
 */
export function preloadCriticalImages(urls: string[]): void {
  urls.forEach((url) => {
    preload(url, 'image', { fetchpriority: 'high' });
  });
}

/**
 * Preload des scripts critiques
 */
export function preloadCriticalScripts(urls: string[]): void {
  urls.forEach((url) => {
    if (url.endsWith('.js') && url.includes('import')) {
      modulePreload(url);
    } else {
      preload(url, 'script');
    }
  });
}

/**
 * Configurer les hints selon la page
 */
export function setupPageHints(page: string): void {
  switch (page) {
    case 'home':
      addNavigationHints(['/marketplace', '/auth', '/dashboard']);
      break;
    case 'marketplace':
      addNavigationHints(['/dashboard/products/new']);
      break;
    case 'product':
      addNavigationHints(['/checkout', '/cart']);
      break;
    case 'dashboard':
      addNavigationHints([
        '/dashboard/products',
        '/dashboard/orders',
        '/dashboard/analytics',
      ]);
      break;
    default:
      break;
  }
}

/**
 * Nettoyer les hints inutilisés
 */
export function cleanupResourceHints(): void {
  const hints = document.querySelectorAll('link[rel="prefetch"], link[rel="preload"]');
  hints.forEach((hint) => {
    if (hint.parentNode) {
      hint.parentNode.removeChild(hint);
    }
  });
  console.log('[Resource Hints] Cleaned up unused hints');
}

