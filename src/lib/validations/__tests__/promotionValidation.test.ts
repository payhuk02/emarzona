/**
 * Tests unitaires pour promotionValidation
 * Date: 30 Janvier 2025
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateCodeFormat,
  validateDiscountValue,
  validateDates,
  validatePromotionData,
  getErrorMessage,
} from '../promotionValidation';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('promotionValidation', () => {
  describe('validateCodeFormat', () => {
    it('devrait valider un code correct', () => {
      const result = validateCodeFormat('PROMO2025');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un code trop court', () => {
      const result = validateCodeFormat('AB');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le code doit contenir au moins 3 caractères');
    });

    it('devrait rejeter un code trop long', () => {
      const result = validateCodeFormat('A'.repeat(21));
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le code ne peut pas dépasser 20 caractères');
    });

    it('devrait rejeter un code avec caractères spéciaux', () => {
      const result = validateCodeFormat('PROMO-2025');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le code doit être alphanumérique');
    });

    it('devrait rejeter un code vide', () => {
      const result = validateCodeFormat('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le code promo est requis');
    });
  });

  describe('validateDiscountValue', () => {
    it('devrait valider un pourcentage correct', () => {
      const result = validateDiscountValue('percentage', 50);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter un pourcentage > 100%', () => {
      const result = validateDiscountValue('percentage', 150);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Le pourcentage ne peut pas dépasser 100%');
    });

    it('devrait valider un montant fixe', () => {
      const result = validateDiscountValue('fixed', 1000);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter une valeur négative', () => {
      const result = validateDiscountValue('percentage', -10);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La valeur de réduction doit être positive');
    });
  });

  describe('validateDates', () => {
    it('devrait valider des dates cohérentes', () => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);
      
      const result = validateDates(start.toISOString(), end.toISOString());
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter si end_date < start_date', () => {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() - 7);
      
      const result = validateDates(start.toISOString(), end.toISOString());
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('La date de fin doit être après la date de début');
    });

    it('devrait valider sans dates', () => {
      const result = validateDates(null, null);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePromotionData', () => {
    it('devrait valider des données complètes correctes', () => {
      const data = {
        code: 'PROMO2025',
        discount_type: 'percentage',
        discount_value: 20,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        min_purchase_amount: 1000,
        max_uses: 100,
      };
      
      const result = validatePromotionData(data);
      expect(result.valid).toBe(true);
    });

    it('devrait rejeter des données invalides', () => {
      const data = {
        code: 'AB', // Trop court
        discount_type: 'percentage',
        discount_value: 150, // > 100%
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Dans le passé
      };
      
      const result = validatePromotionData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getErrorMessage', () => {
    it('devrait retourner un message pour erreur 23505', () => {
      const error = { code: '23505', message: 'duplicate key value' };
      const message = getErrorMessage(error);
      expect(message).toContain('existe déjà');
    });

    it('devrait retourner un message pour erreur 23503', () => {
      const error = { code: '23503', message: 'foreign key violation' };
      const message = getErrorMessage(error);
      expect(message).toBeTruthy();
    });

    it('devrait retourner un message par défaut', () => {
      const error = { message: 'Unknown error' };
      const message = getErrorMessage(error);
      expect(message).toBe('Unknown error');
    });
  });
});

