/**
 * Configuration CDN pour assets statiques
 * Améliore les performances en servant les assets depuis un CDN
 */

export interface CDNConfig {
  /**
   * URL de base du CDN
   */
  baseUrl: string;
  
  /**
   * Si true, utilise le CDN pour les assets
   */
  enabled: boolean;
  
  /**
   * Domaines autorisés pour les images
   */
  allowedImageDomains: string[];
}

/**
 * Configuration CDN par défaut
 * Peut être surchargée via variables d'environnement
 */
const defaultCDNConfig: CDNConfig = {
  baseUrl: import.meta.env.VITE_CDN_URL || '',
  enabled: import.meta.env.VITE_CDN_ENABLED === 'true',
  allowedImageDomains: [
    'supabase.co',
    'storage.googleapis.com',
    'vercel.app',
    ...(import.meta.env.VITE_CDN_ALLOWED_DOMAINS?.split(',') || []),
  ],
};

let cdnConfig: CDNConfig = defaultCDNConfig;

/**
 * Configure le CDN
 */
export function configureCDN(config: Partial<CDNConfig>) {
  cdnConfig = { ...cdnConfig, ...config };
}

/**
 * Retourne la configuration CDN actuelle
 */
export function getCDNConfig(): CDNConfig {
  return cdnConfig;
}

/**
 * Génère une URL CDN pour un asset
 * @param path - Chemin de l'asset (relatif ou absolu)
 * @returns URL complète avec CDN si activé
 */
export function getCDNUrl(path: string): string {
  if (!cdnConfig.enabled || !cdnConfig.baseUrl) {
    return path;
  }

  // Si le chemin est déjà une URL complète, retourner tel quel
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Nettoyer le chemin (enlever le slash initial si présent)
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // Construire l'URL CDN
  const baseUrl = cdnConfig.baseUrl.endsWith('/') 
    ? cdnConfig.baseUrl.slice(0, -1) 
    : cdnConfig.baseUrl;

  return `${baseUrl}/${cleanPath}`;
}

/**
 * Vérifie si une URL d'image est autorisée
 */
export function isImageUrlAllowed(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return cdnConfig.allowedImageDomains.some(domain => 
      urlObj.hostname.includes(domain)
    );
  } catch {
    // Si l'URL n'est pas valide, retourner false
    return false;
  }
}

/**
 * Optimise une URL d'image avec paramètres CDN
 * @param url - URL de l'image
 * @param options - Options d'optimisation (width, height, quality, format)
 */
export function optimizeImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  }
): string {
  if (!options || Object.keys(options).length === 0) {
    return url;
  }

  // Si le CDN n'est pas activé, retourner l'URL originale
  if (!cdnConfig.enabled) {
    return url;
  }

  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  if (options.width) {
    params.set('w', options.width.toString());
  }
  
  if (options.height) {
    params.set('h', options.height.toString());
  }
  
  if (options.quality) {
    params.set('q', options.quality.toString());
  }
  
  if (options.format) {
    params.set('f', options.format);
  }

  // Ajouter les paramètres à l'URL
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

/**
 * Initialise les connexions CDN au démarrage de l'application
 * Configure le CDN avec les paramètres d'environnement
 */
export function initCDNConnections(): void {
  // La configuration est déjà initialisée avec defaultCDNConfig
  // Cette fonction peut être étendue pour des initialisations supplémentaires
  // comme la préconnexion aux domaines CDN, etc.
  
  if (cdnConfig.enabled && cdnConfig.baseUrl) {
    // Optionnel: Préconnexion au CDN pour améliorer les performances
    if ('dns-prefetch' in document.createElement('link')) {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = cdnConfig.baseUrl;
      document.head.appendChild(link);
    }
  }
}
