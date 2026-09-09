/**
 * Tests unitaires pour url-validator
 * Utilitaire critique pour la sécurité (prévention open redirect)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateRedirectUrl,
  isPaymentDomain,
  safeRedirect,
  extractAndValidateUrl,
  getAllowedDomains,
} from '../url-validator';

type LocationMock = { href: string };

function mockLocation(href = ''): LocationMock {
  const loc: LocationMock = { href };
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: loc,
  });
  return loc;
}

describe('url-validator', () => {
  beforeEach(() => {
    mockLocation('');
  });

  describe('validateRedirectUrl', () => {
    it('devrait valider une URL GeniusPay valide', () => {
      const result = validateRedirectUrl('https://geniuspay.io/checkout/123');

      expect(result.isValid).toBe(true);
      expect(result.url).toBeDefined();
    });

    it('devrait valider une URL emarzona.com valide', () => {
      const result = validateRedirectUrl('https://www.emarzona.com/dashboard');

      expect(result.isValid).toBe(true);
    });

    it('devrait valider une URL Paiement Pro', () => {
      const result = validateRedirectUrl(
        'https://paiementpro.net/webservice/onlinepayment/processpaymentv2.php?sessionid=abc'
      );

      expect(result.isValid).toBe(true);
    });

    it('devrait rejeter une URL avec un domaine non autorisé', () => {
      const result = validateRedirectUrl('https://evil.com/steal');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('non autorisé');
    });

    it('devrait rejeter une URL vide', () => {
      const result = validateRedirectUrl('');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('vide');
    });

    it('devrait rejeter une URL avec un format invalide', () => {
      const result = validateRedirectUrl('not-a-valid-url');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Format d'URL invalide");
    });

    it('devrait rejeter une URL avec un protocole non autorisé (ftp)', () => {
      const result = validateRedirectUrl('ftp://geniuspay.io/checkout');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Protocole non autorisé');
    });

    it('devrait accepter localhost en développement', () => {
      const result = validateRedirectUrl('http://localhost:3000/checkout');

      expect(result.isValid).toBe(true);
    });
  });

  describe('isPaymentDomain', () => {
    it('devrait retourner true pour un domaine autorisé', () => {
      const result = isPaymentDomain('https://geniuspay.io/checkout');
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un domaine non autorisé', () => {
      const result = isPaymentDomain('https://evil.com/steal');
      expect(result).toBe(false);
    });
  });

  describe('safeRedirect', () => {
    it('devrait rediriger vers une URL valide', () => {
      const loc = mockLocation('');

      safeRedirect('https://geniuspay.io/checkout/123');

      expect(loc.href).toBe('https://geniuspay.io/checkout/123');
    });

    it('devrait appeler onError pour une URL invalide', () => {
      const onError = vi.fn();
      mockLocation('');

      safeRedirect('https://evil.com/steal', onError);

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(expect.stringContaining('non autorisé'));
    });

    it("devrait rediriger vers /dashboard si pas de callback d'erreur", () => {
      const loc = mockLocation('');

      safeRedirect('https://evil.com/steal');

      expect(loc.href).toBe('/dashboard');
    });
  });

  describe('extractAndValidateUrl', () => {
    it('devrait extraire et valider une URL depuis une réponse API', () => {
      const response = {
        checkout_url: 'https://geniuspay.io/checkout/123',
      };

      const url = extractAndValidateUrl(response);

      expect(url).toBe('https://geniuspay.io/checkout/123');
    });

    it("devrait retourner null si l'URL est invalide", () => {
      const response = {
        checkout_url: 'https://evil.com/steal',
      };

      const url = extractAndValidateUrl(response);

      expect(url).toBeNull();
    });

    it("devrait retourner null si le champ n'existe pas", () => {
      const response = {};

      const url = extractAndValidateUrl(response);

      expect(url).toBeNull();
    });

    it('devrait utiliser un champ personnalisé', () => {
      const response = {
        redirect_url: 'https://geniuspay.io/checkout/123',
      };

      const url = extractAndValidateUrl(response, 'redirect_url');

      expect(url).toBe('https://geniuspay.io/checkout/123');
    });
  });

  describe('getAllowedDomains', () => {
    it('devrait retourner la liste des domaines autorisés', () => {
      const domains = getAllowedDomains();

      expect(domains).toContain('geniuspay.io');
      expect(domains).toContain('emarzona.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });
});
