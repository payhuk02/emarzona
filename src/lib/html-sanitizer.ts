/**
 * 🔒 HTML SANITIZER - PRÉVENTION XSS
 * 
 * Nettoie le HTML pour prévenir les attaques XSS
 * Utilisé pour les descriptions de produits, commentaires, etc.
 */

import DOMPurify from 'dompurify';

// ============================================================================
// CONFIGURATIONS
// ============================================================================

/**
 * Configuration pour les descriptions de produits
 * Permet un formatage riche mais sécurisé
 */
const PRODUCT_DESCRIPTION_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i',
    'a', 'ul', 'ol', 'li', 'h3', 'h4', 'h5',
    'blockquote', 'code', 'pre',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'class',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

/**
 * Configuration pour les commentaires/avis
 * Plus restrictif que les descriptions
 */
const REVIEW_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
};

/**
 * Configuration pour le texte simple
 * Très restrictif, convertit en texte brut
 */
const PLAIN_TEXT_CONFIG: DOMPurify.Config = {
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
 * @param html - HTML à nettoyer
 * @returns HTML nettoyé et sécurisé
 * 
 * @example
 * ```typescript
 * const clean = sanitizeProductDescription(product.description);
 * return <div dangerouslySetInnerHTML={{ __html: clean }} />;
 * ```
 */
export function sanitizeProductDescription(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, PRODUCT_DESCRIPTION_CONFIG);
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
  return DOMPurify.sanitize(html, REVIEW_CONFIG);
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
  return DOMPurify.sanitize(html);
}

/**
 * Convertit du HTML en texte brut sécurisé
 * Supprime TOUTES les balises HTML
 * 
 * @param html - HTML à convertir
 * @returns Texte brut
 */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, PLAIN_TEXT_CONFIG);
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
      console.error('🚨 SECURITY: Protocole dangereux bloqué:', protocol);
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
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
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
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Forcer target="_blank" pour tous les liens externes
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      const href = node.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });
  
  console.log('✅ DOMPurify configuré');
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

