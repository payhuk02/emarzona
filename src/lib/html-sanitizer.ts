/**
 * 🔒 HTML SANITIZER - PRÉVENTION XSS
 *
 * Nettoie le HTML pour prévenir les attaques XSS
 * Utilisé pour les descriptions de produits, commentaires, etc.
 */

import DOMPurify from 'dompurify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- DOMPurify config shape matches runtime API
type PurifyConfig = any;

// ============================================================================
// CONFIGURATIONS
// ============================================================================

/**
 * Configuration pour les descriptions de produits
 * Permet un formatage riche mais sécurisé
 */
const PRODUCT_DESCRIPTION_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'b',
    'i',
    's',
    'strike',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  // Permettre les styles inline pour les couleurs, soulignement, etc.
  ALLOW_STYLE: true,
};

/**
 * Configuration pour les commentaires/avis
 * Plus restrictif que les descriptions
 */
const REVIEW_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
};

/**
 * Configuration pour le texte simple
 * Très restrictif, convertit en texte brut
 */
const PLAIN_TEXT_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Nettoie le HTML d'une description de produit
 *
 * Permet un formatage riche mais sécurisé pour les descriptions de produits.
 * Autorise les balises de formatage de base (p, strong, em, ul, ol, etc.) mais bloque
 * les scripts et attributs dangereux pour prévenir les attaques XSS.
 *
 * @param html - HTML à nettoyer (peut être null ou undefined)
 * @returns HTML nettoyé et sécurisé, ou chaîne vide si html est null/undefined
 *
 * @example
 * ```typescript
 * const clean = sanitizeProductDescription(product.description);
 * return <div dangerouslySetInnerHTML={{ __html: clean }} />;
 * ```
 *
 * @see {@link PRODUCT_DESCRIPTION_CONFIG} pour la configuration de sécurité
 */
/** Retire les couleurs de texte quasi-blanches (illisibles sur fond clair). */
function stripNearWhiteTextColors(html: string): string {
  return html
    .replace(/color:\s*white\s*;?/gi, '')
    .replace(/color:\s*#fff(?:fff)?\s*;?/gi, '')
    .replace(/color:\s*rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)\s*;?/gi, '')
    .replace(/color:\s*rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*[\d.]+\s*\)\s*;?/gi, '');
}

export function sanitizeProductDescription(html: string | null | undefined): string {
  if (!html) return '';
  const clean = String(DOMPurify.sanitize(html, PRODUCT_DESCRIPTION_CONFIG));
  return stripNearWhiteTextColors(clean);
}

/**
 * Nettoie le HTML d'un avis/commentaire
 * Plus restrictif que les descriptions de produits
 *
 * @param html - HTML à nettoyer
 * @returns HTML nettoyé
 */
export function sanitizeReview(html: string | null | undefined): string {
  if (!html) return '';
  return String(DOMPurify.sanitize(html, REVIEW_CONFIG));
}

/**
 * Nettoie du HTML générique
 * Configuration par défaut de DOMPurify
 *
 * @param html - HTML à nettoyer
 * @returns HTML nettoyé
 */
export function sanitizeHTML(html: string | null | undefined): string {
  if (!html) return '';
  return String(DOMPurify.sanitize(html));
}

/**
 * Convertit du HTML en texte brut sécurisé
 * Supprime TOUTES les balises HTML et décode les entités HTML
 *
 * @param html - HTML à convertir
 * @returns Texte brut avec entités HTML décodées
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';

  // Étape 1: Sanitizer avec DOMPurify pour supprimer les balises HTML
  const sanitized = String(DOMPurify.sanitize(html, PLAIN_TEXT_CONFIG));

  // Étape 2: Décoder les entités HTML restantes
  // Utiliser le DOM pour décoder toutes les entités HTML (y compris &nbsp;, &#39;, etc.)
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = sanitized;
    const decoded = textarea.value;

    // Nettoyer les espaces multiples et les retours à la ligne
    return decoded
      .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul espace
      .replace(/\n\s*\n/g, '\n') // Remplacer les retours à la ligne multiples
      .trim();
  }

  // Fallback pour Node.js: décoder manuellement les entités communes
  return sanitized
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convertit du texte brut en HTML sécurisé
 * Échappe les caractères HTML et convertit les retours à la ligne
 *
 * @param text - Texte brut
 * @returns HTML sécurisé
 *
 * @example
 * ```typescript
 * const html = textToSafeHTML("Bonjour\nMonde");
 * // Résultat: "Bonjour<br>Monde"
 * ```
 */
export function textToSafeHTML(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

/**
 * Nettoie une URL pour utilisation dans href
 *
 * @param url - URL à nettoyer
 * @returns URL nettoyée ou '#' si invalide
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return '#';

  // Supprimer les protocoles dangereux
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  const lowerUrl = url.toLowerCase().trim();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      // Protocole dangereux bloqué - log via logger si nécessaire
      return '#';
    }
  }

  // Nettoyer avec DOMPurify
  return DOMPurify.sanitize(url, { ALLOWED_TAGS: [] });
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Tronque du HTML à une longueur maximale tout en préservant les balises
 *
 * @param html - HTML à tronquer
 * @param maxLength - Longueur maximale du texte (sans les balises)
 * @param suffix - Suffixe à ajouter si tronqué (par défaut '...')
 * @returns HTML tronqué
 */
export function truncateHTML(
  html: string | null | undefined,
  maxLength: number,
  suffix: string = '...'
): string {
  if (!html) return '';

  // Convertir en texte pour mesurer la longueur
  const plainText = htmlToPlainText(html);

  if (plainText.length <= maxLength) {
    return sanitizeHTML(html);
  }

  // Tronquer le texte brut
  const truncated = plainText.substring(0, maxLength) + suffix;

  // Reconvertir en HTML sécurisé
  return textToSafeHTML(truncated);
}

/**
 * Extrait le texte brut d'un HTML avec limite de longueur
 * Utile pour les meta descriptions, previews, etc.
 *
 * @param html - HTML source
 * @param maxLength - Longueur maximale
 * @returns Texte brut tronqué
 */
export function extractPlainTextExcerpt(
  html: string | null | undefined,
  maxLength: number = 160
): string {
  if (!html) return '';

  const plainText = htmlToPlainText(html);

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Tronquer au dernier mot complet
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Vérifie si une chaîne contient du HTML
 *
 * @param text - Texte à vérifier
 * @returns true si contient du HTML
 */
export function containsHTML(text: string | null | undefined): boolean {
  if (!text) return false;
  return /<[^>]+>/.test(text);
}

/**
 * Configure DOMPurify pour toute l'application
 * À appeler au démarrage de l'app
 */
export function configureDOMPurify(): void {
  // Ajouter des hooks personnalisés si nécessaire
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    // Forcer target="_blank" pour tous les liens externes
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  // DOMPurify configuré - pas besoin de log
}

// ============================================================================
// TYPES POUR COMPOSANTS REACT
// ============================================================================

/**
 * Props pour un composant qui affiche du HTML sanitizé
 */
export interface SanitizedHTMLProps {
  html: string | null | undefined;
  className?: string;
  maxLength?: number;
}

/**
 * Helper pour créer des props dangerouslySetInnerHTML sécurisées
 *
 * @param html - HTML à sanitizer
 * @param config - Configuration optionnelle
 * @returns Objet pour dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * <div {...createSafeInnerHTML(product.description)} />
 * ```
 */
export function createSafeInnerHTML(
  html: string | null | undefined,
  sanitizer: (html: string) => string = sanitizeHTML
) {
  return {
    dangerouslySetInnerHTML: {
      __html: sanitizer(html || ''),
    },
  };
}
