/**
 * Tests unitaires pour moneroo-amount-validator.ts
 * 
 * Pour exécuter: npm test moneroo-amount-validator
 */

import { describe, it, expect } from 'vitest';
import {
  validateAmount,
  normalizeAmount,
  formatAmount,
  isAmountValid,
  getAmountLimits,
} from './moneroo-amount-validator';
import { MonerooValidationError } from './moneroo-errors';

describe('MonerooAmountValidator', () => {
  describe('getAmountLimits', () => {
    it('devrait retourner les limites pour XOF', () => {
      const limits = getAmountLimits('XOF');
      expect(limits.min).toBe(100);
      expect(limits.max).toBe(10000000);
    });

    it('devrait retourner les limites pour USD', () => {
      const limits = getAmountLimits('USD');
      expect(limits.min).toBe(1);
      expect(limits.max).toBe(10000);
    });

    it('devrait retourner les limites par défaut pour une devise inconnue', () => {
      const limits = getAmountLimits('XXX' as any);
      expect(limits.min).toBe(100);
      expect(limits.max).toBe(10000000);
    });
  });

  describe('validateAmount', () => {
    it('devrait accepter un montant valide', () => {
      expect(() => validateAmount(1000, 'XOF')).not.toThrow();
      expect(() => validateAmount(5000, 'XOF')).not.toThrow();
    });

    it('devrait rejeter un montant négatif', () => {
      expect(() => validateAmount(-100, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait rejeter un montant zéro', () => {
      expect(() => validateAmount(0, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait rejeter un montant inférieur au minimum', () => {
      expect(() => validateAmount(50, 'XOF')).toThrow(MonerooValidationError);
      expect(() => validateAmount(99, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait rejeter un montant supérieur au maximum', () => {
      expect(() => validateAmount(10000001, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait rejeter un montant avec décimales', () => {
      expect(() => validateAmount(1000.5, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait rejeter NaN', () => {
      expect(() => validateAmount(NaN, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait rejeter Infinity', () => {
      expect(() => validateAmount(Infinity, 'XOF')).toThrow(MonerooValidationError);
    });

    it('devrait valider les limites pour différentes devises', () => {
      expect(() => validateAmount(1, 'USD')).not.toThrow();
      expect(() => validateAmount(10000, 'USD')).not.toThrow();
      expect(() => validateAmount(10001, 'USD')).toThrow();
    });
  });

  describe('normalizeAmount', () => {
    it('devrait arrondir un montant décimal', () => {
      expect(normalizeAmount(1000.7, 'XOF')).toBe(1001);
      expect(normalizeAmount(1000.3, 'XOF')).toBe(1000);
    });

    it('devrait retourner le minimum si le montant est trop faible', () => {
      expect(normalizeAmount(50, 'XOF')).toBe(100);
    });

    it('devrait retourner le maximum si le montant est trop élevé', () => {
      expect(normalizeAmount(20000000, 'XOF')).toBe(10000000);
    });

    it('devrait retourner le montant tel quel s\'il est valide', () => {
      expect(normalizeAmount(1000, 'XOF')).toBe(1000);
    });
  });

  describe('isAmountValid', () => {
    it('devrait retourner true pour un montant valide', () => {
      expect(isAmountValid(1000, 'XOF')).toBe(true);
      expect(isAmountValid(5000, 'XOF')).toBe(true);
    });

    it('devrait retourner false pour un montant invalide', () => {
      expect(isAmountValid(-100, 'XOF')).toBe(false);
      expect(isAmountValid(50, 'XOF')).toBe(false);
      expect(isAmountValid(10000001, 'XOF')).toBe(false);
    });
  });

  describe('formatAmount', () => {
    it('devrait formater un montant avec la devise', () => {
      const formatted = formatAmount(1000, 'XOF');
      expect(formatted).toContain('1000');
      expect(formatted).toContain('XOF');
    });

    it('devrait formater un montant USD', () => {
      const formatted = formatAmount(100, 'USD');
      expect(formatted).toContain('100');
      expect(formatted).toContain('USD');
    });
  });
});


