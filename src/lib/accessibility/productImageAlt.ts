/**
 * Politique alt images produit — WCAG 1.1.1
 * - Contenu informatif : toujours un alt non vide (nom + fallback)
 * - Décoratif uniquement si adjacent text + aria-hidden / alt=""
 */

export type ProductImageKind = 'product' | 'course' | 'artwork' | 'store';

const FALLBACKS: Record<ProductImageKind, string> = {
  product: 'Produit',
  course: 'Cours',
  artwork: 'Œuvre',
  store: 'Boutique',
};

/**
 * Alt descriptif pour vignette / image produit.
 * Aligné sur ProductCard : « Image du produit {nom} ».
 */
export function productImageAlt(name?: string | null, kind: ProductImageKind = 'product'): string {
  const trimmed = name?.trim();
  const label = trimmed || FALLBACKS[kind];
  if (kind === 'store') {
    return trimmed ? `Logo de ${trimmed}` : 'Logo boutique';
  }
  if (kind === 'course') {
    return `Image du cours ${label}`;
  }
  if (kind === 'artwork') {
    return `Image de l'œuvre ${label}`;
  }
  return `Image du produit ${label}`;
}
