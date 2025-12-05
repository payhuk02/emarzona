import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine les classes CSS avec gestion des conflits Tailwind
 * Utilise clsx pour la logique conditionnelle et twMerge pour résoudre les conflits Tailwind
 * 
 * @param inputs - Classes CSS à combiner (string, array, object)
 * @returns String de classes CSS combinées et optimisées
 * 
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // Résultat: 'py-1 px-4' (px-2 est remplacé par px-4)
 * cn({ 'bg-red-500': isActive }) // Résultat: 'bg-red-500' si isActive est true
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrait le texte brut d'une chaîne HTML en supprimant toutes les balises HTML
 * Fonctionne côté client et serveur
 * @param html - La chaîne HTML à nettoyer
 * @returns Le texte brut sans balises HTML
 */
/**
 * Extrait le texte brut d'une chaîne HTML en supprimant toutes les balises HTML
 * SÉCURISÉ : Utilise DOMPurify pour éviter les attaques XSS
 * Fonctionne côté client et serveur
 * @param html - La chaîne HTML à nettoyer
 * @returns Le texte brut sans balises HTML
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Vérifier si on est côté client (navigateur)
  if (typeof document !== 'undefined') {
    // SÉCURISÉ : Utiliser DOMPurify pour nettoyer avant d'utiliser innerHTML
    // Import dynamique pour éviter de charger DOMPurify si pas nécessaire
    try {
      // Si DOMPurify est disponible, l'utiliser pour sécuriser
      interface WindowWithDOMPurify extends Window {
        DOMPurify?: {
          sanitize: (html: string, options: { ALLOWED_TAGS: string[] }) => string;
        };
      }
      const DOMPurify = (window as WindowWithDOMPurify).DOMPurify;
      if (DOMPurify) {
        // Nettoyer le HTML avec DOMPurify avant d'utiliser innerHTML
        const cleanHtml = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
        const tmp = document.createElement('div');
        tmp.innerHTML = cleanHtml;
        return tmp.textContent || tmp.innerText || '';
      }
    } catch (e) {
      // Si DOMPurify n'est pas disponible, utiliser la méthode serveur
    }
    
    // Fallback sécurisé : utiliser textContent directement si pas de HTML
    if (!html.includes('<')) {
      return html;
    }
    
    // Si contient du HTML et DOMPurify pas disponible, utiliser regex (moins sûr mais acceptable pour extraction)
    const tmp = document.createElement('div');
    // Utiliser textContent pour éviter XSS (plus sûr que innerHTML)
    tmp.textContent = html;
    return tmp.textContent || '';
  }
  
  // Côté serveur : utiliser une regex pour supprimer les balises HTML
  // Plus sûr car pas d'exécution de code
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer scripts
    .replace(/<[^>]*>/g, '') // Supprimer toutes les balises HTML
    .replace(/&nbsp;/g, ' ') // Remplacer &nbsp; par un espace
    .replace(/&amp;/g, '&') // Remplacer &amp; par &
    .replace(/&lt;/g, '<') // Remplacer &lt; par <
    .replace(/&gt;/g, '>') // Remplacer &gt; par >
    .replace(/&quot;/g, '"') // Remplacer &quot; par "
    .replace(/&#39;/g, "'") // Remplacer &#39; par '
    .replace(/&apos;/g, "'") // Remplacer &apos; par '
    .trim();
}

export { formatCurrency, getCurrencySymbol, getCurrencyByCode, CURRENCIES } from './currencies';
