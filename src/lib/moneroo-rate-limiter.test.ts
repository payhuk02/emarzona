/**
 * Tests unitaires pour moneroo-rate-limiter.ts
 * 
 * Pour exécuter: npm test moneroo-rate-limiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, monerooRateLimiter, checkRateLimit } from './moneroo-rate-limiter';

describe('MonerooRateLimiter', () => {
  beforeEach(() => {
    // Réinitialiser le rate limiter global
    monerooRateLimiter.clear();
  });

  describe('RateLimiter', () => {
    it('devrait permettre les requêtes dans la limite', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      for (let i = 0; i < 5; i++) {
        expect(limiter.canMakeRequest()).toBe(true);
        limiter.recordRequest();
      }
    });

    it('devrait bloquer les requêtes au-delà de la limite', () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 60000,
      });

      // Faire 3 requêtes
      for (let i = 0; i < 3; i++) {
        expect(limiter.canMakeRequest()).toBe(true);
        limiter.recordRequest();
      }

      // La 4ème devrait être bloquée
      expect(limiter.canMakeRequest()).toBe(false);
    });

    it('devrait calculer correctement les requêtes restantes', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
      });

      expect(limiter.getRemainingRequests()).toBe(10);

      limiter.canMakeRequest();
      limiter.recordRequest();

      expect(limiter.getRemainingRequests()).toBe(9);
    });

    it('devrait gérer différents identifiants séparément', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 60000,
      });

      // Utilisateur 1
      for (let i = 0; i < 5; i++) {
        expect(limiter.canMakeRequest('user1')).toBe(true);
        limiter.recordRequest('user1');
      }
      expect(limiter.canMakeRequest('user1')).toBe(false);

      // Utilisateur 2 devrait encore avoir des requêtes
      expect(limiter.canMakeRequest('user2')).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('devrait lancer une erreur si la limite est dépassée', () => {
      // Remplir la limite
      for (let i = 0; i < 100; i++) {
        monerooRateLimiter.canMakeRequest();
        monerooRateLimiter.recordRequest();
      }

      expect(() => checkRateLimit()).toThrow();
    });

    it('devrait permettre les requêtes dans la limite', () => {
      expect(() => checkRateLimit()).not.toThrow();
    });
  });
});


