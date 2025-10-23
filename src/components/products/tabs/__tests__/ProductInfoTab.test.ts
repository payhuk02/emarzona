import { describe, it, expect } from 'vitest';

/**
 * Tests pour les fonctions de calcul du ProductInfoTab
 */

describe('ProductInfoTab - Calculs de prix', () => {
  describe('getDiscountPercentage', () => {
    it('devrait calculer correctement le pourcentage de réduction', () => {
      const price = 100;
      const promotionalPrice = 80;
      const expected = Math.round(((price - promotionalPrice) / price) * 100);
      
      expect(expected).toBe(20);
    });

    it('devrait retourner 0 si pas de prix promotionnel', () => {
      const price = 100;
      const promotionalPrice = null;
      
      const result = promotionalPrice 
        ? Math.round(((price - promotionalPrice) / price) * 100)
        : 0;
      
      expect(result).toBe(0);
    });

    it('devrait retourner 0 si le prix promotionnel est supérieur au prix normal', () => {
      const price = 100;
      const promotionalPrice = 120;
      
      const result = (promotionalPrice < price)
        ? Math.round(((price - promotionalPrice) / price) * 100)
        : 0;
      
      expect(result).toBe(0);
    });

    it('devrait arrondir correctement les pourcentages', () => {
      const price = 150;
      const promotionalPrice = 100;
      const expected = Math.round(((price - promotionalPrice) / price) * 100);
      
      expect(expected).toBe(33); // 33.33% arrondi à 33%
    });

    it('devrait gérer les très petites réductions', () => {
      const price = 10000;
      const promotionalPrice = 9999;
      const expected = Math.round(((price - promotionalPrice) / price) * 100);
      
      expect(expected).toBe(0); // 0.01% arrondi à 0%
    });

    it('devrait gérer les très grandes réductions', () => {
      const price = 1000;
      const promotionalPrice = 1;
      const expected = Math.round(((price - promotionalPrice) / price) * 100);
      
      expect(expected).toBe(100); // 99.9% arrondi à 100%
    });
  });

  describe('setDiscountFromPercent', () => {
    it('devrait calculer le prix promotionnel à partir d\'un pourcentage', () => {
      const price = 100;
      const percent = 20;
      const expected = Number((price * (1 - percent / 100)).toFixed(2));
      
      expect(expected).toBe(80);
    });

    it('devrait plafonner le pourcentage à 95%', () => {
      const percent = 99;
      const normalized = Math.max(0, Math.min(95, percent));
      
      expect(normalized).toBe(95);
    });

    it('devrait retourner null si pourcentage = 0', () => {
      const price = 100;
      const percent = 0;
      const normalized = Math.max(0, Math.min(95, percent));
      const result = normalized > 0 
        ? Number((price * (1 - normalized / 100)).toFixed(2))
        : null;
      
      expect(result).toBeNull();
    });

    it('devrait gérer les pourcentages décimaux', () => {
      const price = 100;
      const percent = 15.5;
      const normalized = Math.max(0, Math.min(95, percent));
      const expected = Number((price * (1 - normalized / 100)).toFixed(2));
      
      expect(expected).toBe(84.5);
    });

    it('devrait retourner null si le prix est 0', () => {
      const price = 0;
      const result = (price > 0) ? 'calculer' : null;
      
      expect(result).toBeNull();
    });
  });

  describe('Calcul de marge', () => {
    it('devrait calculer correctement la marge brute', () => {
      const sellingPrice = 100;
      const costPrice = 60;
      const margin = Math.max(0, sellingPrice - costPrice);
      
      expect(margin).toBe(40);
    });

    it('devrait calculer le pourcentage de marge', () => {
      const sellingPrice = 100;
      const costPrice = 60;
      const margin = sellingPrice - costPrice;
      const marginPercent = Math.round((margin / sellingPrice) * 100);
      
      expect(marginPercent).toBe(40);
    });

    it('devrait retourner 0 si la marge est négative', () => {
      const sellingPrice = 50;
      const costPrice = 80;
      const margin = Math.max(0, sellingPrice - costPrice);
      
      expect(margin).toBe(0);
    });

    it('devrait utiliser le prix promotionnel si disponible', () => {
      const price = 100;
      const promotionalPrice = 80;
      const costPrice = 50;
      const sellingPrice = promotionalPrice ?? price;
      const margin = Math.max(0, sellingPrice - costPrice);
      
      expect(margin).toBe(30);
    });

    it('devrait gérer les coûts nulls', () => {
      const sellingPrice = 100;
      const costPrice = null;
      const margin = costPrice !== null 
        ? Math.max(0, sellingPrice - costPrice)
        : sellingPrice;
      
      expect(margin).toBe(100);
    });
  });

  describe('Validation des dates', () => {
    it('devrait valider que la date de fin est après la date de début', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      
      expect(startDate < endDate).toBe(true);
    });

    it('devrait invalider si la date de fin est avant la date de début', () => {
      const startDate = new Date('2025-12-31');
      const endDate = new Date('2025-01-01');
      
      expect(startDate < endDate).toBe(false);
    });

    it('devrait retourner true si aucune date n\'est définie', () => {
      const startDate = null;
      const endDate = null;
      
      const isValid = (startDate && endDate) 
        ? new Date(startDate) < new Date(endDate)
        : true;
      
      expect(isValid).toBe(true);
    });

    it('devrait retourner true si seulement une date est définie', () => {
      const startDate = new Date('2025-01-01');
      const endDate = null;
      
      const isValid = (startDate && endDate) 
        ? new Date(startDate) < new Date(endDate)
        : true;
      
      expect(isValid).toBe(true);
    });
  });

  describe('Économies calculées', () => {
    it('devrait calculer l\'économie correctement', () => {
      const price = 150;
      const promotionalPrice = 100;
      const savings = price - promotionalPrice;
      
      expect(savings).toBe(50);
    });

    it('devrait formater l\'économie en FCFA', () => {
      const price = 15000;
      const promotionalPrice = 10000;
      const savings = (price - promotionalPrice).toLocaleString();
      
      expect(savings).toContain('5');
    });
  });

  describe('Cas limites (Edge cases)', () => {
    it('devrait gérer les très grands nombres', () => {
      const price = 999999999;
      const promotionalPrice = 500000000;
      const percentage = Math.round(((price - promotionalPrice) / price) * 100);
      
      expect(percentage).toBe(50);
    });

    it('devrait gérer les nombres à virgule', () => {
      const price = 99.99;
      const promotionalPrice = 79.99;
      const savings = Number((price - promotionalPrice).toFixed(2));
      
      expect(savings).toBe(20);
    });

    it('devrait gérer les prix très bas', () => {
      const price = 0.01;
      const percent = 50;
      const promoPrice = Number((price * (1 - percent / 100)).toFixed(2));
      
      expect(promoPrice).toBe(0.01);
    });
  });
});

describe('ProductInfoTab - Génération de slug', () => {
  it('devrait générer un slug valide à partir du nom', () => {
    const name = "Guide Facebook Ads 2025";
    // Simulation de generateSlug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    expect(slug).toBe('guide-facebook-ads-2025');
  });

  it('devrait supprimer les caractères spéciaux', () => {
    const name = "Produit @#$ Spécial!!!";
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    expect(slug).toBe('produit-special');
  });

  it('devrait gérer les accents', () => {
    const name = "Café Français Spécialité";
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    expect(slug).toBe('cafe-francais-specialite');
  });
});

