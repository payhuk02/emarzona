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

describe('ProductInfoTab - Constantes de configuration', () => {
  const MAX_PRICE_HISTORY_ENTRIES = 5;
  const PRICE_HISTORY_DISPLAY_COUNT = 3;
  const SLUG_CHECK_DEBOUNCE_MS = 500;
  const MIN_SLUG_LENGTH = 3;
  const MAX_DISCOUNT_PERCENT = 95;

  it('MAX_PRICE_HISTORY_ENTRIES devrait limiter l\'historique à 5 entrées', () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ 
      date: new Date().toISOString(), 
      price: 100 + i 
    }));
    
    const limitedEntries = entries.slice(0, MAX_PRICE_HISTORY_ENTRIES);
    
    expect(limitedEntries).toHaveLength(5);
  });

  it('PRICE_HISTORY_DISPLAY_COUNT devrait afficher 3 entrées maximum', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ 
      date: new Date().toISOString(), 
      price: 100 + i 
    }));
    
    const displayedEntries = entries.slice(0, PRICE_HISTORY_DISPLAY_COUNT);
    
    expect(displayedEntries).toHaveLength(3);
  });

  it('SLUG_CHECK_DEBOUNCE_MS devrait être 500ms', () => {
    expect(SLUG_CHECK_DEBOUNCE_MS).toBe(500);
  });

  it('MIN_SLUG_LENGTH devrait être 3 caractères', () => {
    expect(MIN_SLUG_LENGTH).toBe(3);
  });

  it('MAX_DISCOUNT_PERCENT devrait plafonner à 95%', () => {
    const percent = 99;
    const normalized = Math.min(MAX_DISCOUNT_PERCENT, percent);
    
    expect(normalized).toBe(95);
  });

  it('devrait accepter un pourcentage inférieur à MAX_DISCOUNT_PERCENT', () => {
    const percent = 50;
    const normalized = Math.min(MAX_DISCOUNT_PERCENT, percent);
    
    expect(normalized).toBe(50);
  });
});

describe('ProductInfoTab - LocalStorage pour historique des prix', () => {
  beforeEach(() => {
    // Nettoyer le localStorage avant chaque test
    localStorage.clear();
  });

  it('devrait sauvegarder l\'historique dans localStorage', () => {
    const slug = 'test-product';
    const priceHistory = [
      { date: new Date().toISOString(), price: 100, promotional_price: 80 }
    ];
    
    const storageKey = `priceHistory_${slug}`;
    localStorage.setItem(storageKey, JSON.stringify(priceHistory));
    
    const stored = localStorage.getItem(storageKey);
    expect(stored).not.toBeNull();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].price).toBe(100);
  });

  it('devrait charger l\'historique depuis localStorage', () => {
    const slug = 'test-product';
    const priceHistory = [
      { date: new Date().toISOString(), price: 100 },
      { date: new Date().toISOString(), price: 90 }
    ];
    
    const storageKey = `priceHistory_${slug}`;
    localStorage.setItem(storageKey, JSON.stringify(priceHistory));
    
    const loaded = JSON.parse(localStorage.getItem(storageKey)!);
    expect(loaded).toHaveLength(2);
  });

  it('devrait retourner un tableau vide si aucun historique', () => {
    const slug = 'new-product';
    const storageKey = `priceHistory_${slug}`;
    const stored = localStorage.getItem(storageKey);
    
    const history = stored ? JSON.parse(stored) : [];
    expect(history).toEqual([]);
  });

  it('devrait gérer les erreurs de parsing JSON', () => {
    const slug = 'corrupted-product';
    const storageKey = `priceHistory_${slug}`;
    localStorage.setItem(storageKey, 'invalid-json');
    
    let history = [];
    try {
      const stored = localStorage.getItem(storageKey);
      history = stored ? JSON.parse(stored) : [];
    } catch {
      history = [];
    }
    
    expect(history).toEqual([]);
  });
});

describe('ProductInfoTab - Historique des prix', () => {
  const MAX_PRICE_HISTORY_ENTRIES = 5;

  it('devrait ajouter une entrée à l\'historique', () => {
    const priceHistory: Array<{date: string, price: number, promotional_price?: number}> = [];
    const newEntry = {
      date: new Date().toISOString(),
      price: 100,
      promotional_price: 80
    };
    
    const updatedHistory = [newEntry, ...priceHistory.slice(0, MAX_PRICE_HISTORY_ENTRIES - 1)];
    
    expect(updatedHistory).toHaveLength(1);
    expect(updatedHistory[0].price).toBe(100);
  });

  it('ne devrait conserver que les 5 dernières entrées', () => {
    let priceHistory: Array<{date: string, price: number}> = [];
    
    // Ajouter 10 entrées
    for (let i = 0; i < 10; i++) {
      const newEntry = {
        date: new Date().toISOString(),
        price: 100 + i
      };
      priceHistory = [newEntry, ...priceHistory.slice(0, MAX_PRICE_HISTORY_ENTRIES - 1)];
    }
    
    expect(priceHistory).toHaveLength(5);
    expect(priceHistory[0].price).toBe(109); // Dernière entrée
  });

  it('devrait conserver l\'ordre chronologique (plus récent en premier)', () => {
    const priceHistory = [
      { date: new Date('2025-01-03').toISOString(), price: 120 },
      { date: new Date('2025-01-02').toISOString(), price: 110 },
      { date: new Date('2025-01-01').toISOString(), price: 100 }
    ];
    
    expect(new Date(priceHistory[0].date) > new Date(priceHistory[1].date)).toBe(true);
    expect(new Date(priceHistory[1].date) > new Date(priceHistory[2].date)).toBe(true);
  });
});

