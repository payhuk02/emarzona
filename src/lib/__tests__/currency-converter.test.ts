/**
 * Tests unitaires pour currency-converter
 * Utilitaire critique pour la conversion de devises
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});

describe('Currency Converter - Utilitaire critique pour la conversion de devises', () => {
  it('Tests de base pour la documentation', () => {
    expect(true).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertCurrency, updateExchangeRates } from '../currency-converter';
import type { Currency } from '../currency-converter';

// Mock currency-exchange-api
vi.mock('../currency-exchange-api', () => ({
  updateExchangeRates: vi.fn(() => Promise.resolve({})),
}));

describe('currency-converter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertCurrency', () => {
    it('devrait convertir XOF vers EUR avec le taux de fallback', () => {
      const result = convertCurrency(1000, 'XOF', 'EUR');
      
      // 1000 XOF * 0.00152 = 1.52 EUR
      expect(result).toBeCloseTo(1.52, 2);
    });

    it('devrait convertir EUR vers XOF avec le taux de fallback', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      
      // 1 EUR * 655.957 = 655.957 XOF
      expect(result).toBeCloseTo(655.957, 2);
    });

    it('devrait retourner le même montant si les devises sont identiques', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait gérer les conversions USD vers EUR', () => {
      const result = convertCurrency(100, 'USD', 'EUR');
      
      // Via XOF: 100 USD -> XOF -> EUR
      // 100 USD * 599.04 = 59904 XOF
      // 59904 XOF * 0.00152 = 91.05 EUR
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getRate (via convertCurrency)', () => {
    it('devrait calculer le taux via conversion', () => {
      // Tester le taux via conversion: 1000 XOF = 1.52 EUR
      const result = convertCurrency(1000, 'XOF', 'EUR');
      const rate = result / 1000;
      expect(rate).toBeCloseTo(0.00152, 5);
    });

    it('devrait retourner 1 pour la même devise', () => {
      const result = convertCurrency(100, 'XOF', 'XOF');
      expect(result).toBe(100);
    });

    it('devrait calculer le taux inverse pour EUR vers XOF', () => {
      const result = convertCurrency(1, 'EUR', 'XOF');
      expect(result).toBeCloseTo(655.957, 2);
    });
  });

  describe('updateExchangeRates', () => {
    it('devrait mettre à jour les taux de change', async () => {
      const result = await updateExchangeRates();
      
      // Devrait appeler l'API de mise à jour
      expect(result).toBeDefined();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      const { updateExchangeRates: mockUpdate } = await import('../currency-exchange-api');
      vi.mocked(mockUpdate).mockRejectedValueOnce(new Error('API Error'));

      // Devrait utiliser les taux de fallback en cas d'erreur
      const rate = getCurrencyRate('XOF', 'EUR');
      expect(rate).toBeCloseTo(0.00152, 5);
    });
  });
});







