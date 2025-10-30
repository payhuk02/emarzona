/**
 * 🔒 URL VALIDATOR - PRÉVENTION OPEN REDIRECT
 * 
 * Valide les URLs de redirection pour éviter les attaques open redirect
 * Utilisé principalement pour les redirections de paiement (Moneroo, PayDunya)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Domaines autorisés pour les redirections
 */
const ALLOWED_PAYMENT_DOMAINS = [
  'moneroo.io',
  'paydunya.com',
  'payhula.com',
  'payhula.vercel.app',
  'localhost', // Dev only
  '127.0.0.1', // Dev only
];

/**
 * Protocoles autorisés
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Protocoles requis en production
 */
const PRODUCTION_PROTOCOLS = ['https:'];

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  url?: URL;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Vérifie si une URL de redirection est sûre
 * 
 * @param url - URL à valider
 * @returns ValidationResult avec isValid et potentiellement une erreur
 * 
 * @example
 * ```typescript
 * const result = validateRedirectUrl('https://moneroo.io/checkout/123');
 * if (result.isValid) {
 *   window.location.href = url;
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateRedirectUrl(url: string): ValidationResult {
  // 1. Vérifier que l'URL n'est pas vide
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return {
      isValid: false,
      error: 'URL vide ou invalide',
    };
  }

  // 2. Parser l'URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return {
      isValid: false,
      error: `Format d'URL invalide: ${url}`,
    };
  }

  // 3. Vérifier le protocole
  const isProduction = import.meta.env.PROD;
  const allowedProtocols = isProduction ? PRODUCTION_PROTOCOLS : ALLOWED_PROTOCOLS;
  
  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      error: `Protocole non autorisé: ${parsedUrl.protocol}. Autorisés: ${allowedProtocols.join(', ')}`,
    };
  }

  // 4. Vérifier le domaine
  const hostname = parsedUrl.hostname.toLowerCase();
  const isAllowed = ALLOWED_PAYMENT_DOMAINS.some(domain => {
    return hostname === domain || hostname.endsWith(`.${domain}`);
  });

  if (!isAllowed) {
    return {
      isValid: false,
      error: `Domaine non autorisé: ${hostname}. Seuls ces domaines sont autorisés: ${ALLOWED_PAYMENT_DOMAINS.join(', ')}`,
    };
  }

  // 5. Tout est OK
  return {
    isValid: true,
    url: parsedUrl,
  };
}

/**
 * Vérifie si une URL est un domaine de paiement autorisé
 * 
 * @param url - URL à vérifier
 * @returns true si le domaine est autorisé pour les paiements
 */
export function isPaymentDomain(url: string): boolean {
  const result = validateRedirectUrl(url);
  return result.isValid;
}

/**
 * Redirige de manière sécurisée ou exécute un callback d'erreur
 * 
 * @param url - URL de redirection
 * @param onError - Callback exécuté en cas d'URL invalide
 * 
 * @example
 * ```typescript
 * safeRedirect(checkoutUrl, () => {
 *   toast.error("URL de paiement invalide");
 * });
 * ```
 */
export function safeRedirect(
  url: string,
  onError?: (error: string) => void
): void {
  const result = validateRedirectUrl(url);
  
  if (result.isValid) {
    // URL valide, redirection sécurisée
    console.log('✅ Redirection sécurisée vers:', url);
    window.location.href = url;
  } else {
    // URL invalide, bloquer et notifier
    console.error('🚨 SECURITY: Redirection bloquée vers URL non autorisée:', url);
    console.error('Raison:', result.error);
    
    if (onError) {
      onError(result.error || 'URL non autorisée');
    } else {
      // Fallback : rediriger vers le dashboard
      console.warn('Fallback: redirection vers /dashboard');
      window.location.href = '/dashboard';
    }
  }
}

/**
 * Extrait et valide une URL de redirection depuis une réponse API
 * 
 * @param response - Réponse contenant potentiellement une URL
 * @param field - Nom du champ contenant l'URL (par défaut 'checkout_url')
 * @returns URL validée ou null
 * 
 * @example
 * ```typescript
 * const checkoutUrl = extractAndValidateUrl(apiResponse);
 * if (checkoutUrl) {
 *   window.location.href = checkoutUrl;
 * }
 * ```
 */
export function extractAndValidateUrl(
  response: any,
  field: string = 'checkout_url'
): string | null {
  if (!response || typeof response !== 'object') {
    return null;
  }

  const url = response[field];
  if (!url) {
    return null;
  }

  const result = validateRedirectUrl(url);
  return result.isValid ? url : null;
}

/**
 * Ajoute un domaine à la liste des domaines autorisés (pour tests)
 * ⚠️ À utiliser uniquement en développement
 */
export function addAllowedDomain(domain: string): void {
  if (import.meta.env.PROD) {
    console.error('❌ Impossible d\'ajouter des domaines en production');
    return;
  }
  
  if (!ALLOWED_PAYMENT_DOMAINS.includes(domain)) {
    ALLOWED_PAYMENT_DOMAINS.push(domain);
    console.log(`✅ Domaine ajouté pour tests: ${domain}`);
  }
}

/**
 * Obtient la liste des domaines autorisés
 */
export function getAllowedDomains(): readonly string[] {
  return Object.freeze([...ALLOWED_PAYMENT_DOMAINS]);
}

