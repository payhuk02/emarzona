import { describe, expect, it } from 'vitest';
import { productImageAlt } from '@/lib/accessibility/productImageAlt';

describe('productImageAlt', () => {
  it('préfixe le nom produit', () => {
    expect(productImageAlt('Sneakers')).toBe('Image du produit Sneakers');
  });

  it('fallback si nom vide', () => {
    expect(productImageAlt('')).toBe('Image du produit Produit');
    expect(productImageAlt(null)).toBe('Image du produit Produit');
  });

  it('adapte le kind course / artwork / store', () => {
    expect(productImageAlt('React 101', 'course')).toBe('Image du cours React 101');
    expect(productImageAlt('Portrait', 'artwork')).toBe("Image de l'œuvre Portrait");
    expect(productImageAlt('Ma Boutique', 'store')).toBe('Logo de Ma Boutique');
    expect(productImageAlt(undefined, 'store')).toBe('Logo boutique');
  });
});
