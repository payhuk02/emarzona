/**
 * Tests unitaires pour geniuspay-retry.ts
 * 
 * Pour exécuter: npm test geniuspay-retry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callWithRetry } from './geniuspay-retry';
import { GeniusPayNetworkError, GeniusPayValidationError } from './geniuspay-errors';

describe('GeniusPayRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('callWithRetry', () => {
    it('devrait réussir au premier essai', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await callWithRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('devrait retenter en cas d\'erreur réseau', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new GeniusPayNetworkError('Network error'))
        .mockResolvedValueOnce('success');
      
      const result = await callWithRetry(fn, { maxRetries: 3, backoffMs: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('devrait échouer après le maximum de tentatives', async () => {
      const error = new GeniusPayNetworkError('Network error');
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(callWithRetry(fn, { maxRetries: 2, backoffMs: 10 }))
        .rejects.toThrow(GeniusPayNetworkError);
      
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('ne devrait pas retenter pour les erreurs de validation', async () => {
      const error = new GeniusPayValidationError('Validation error');
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(callWithRetry(fn, { maxRetries: 3, backoffMs: 10 }))
        .rejects.toThrow(GeniusPayValidationError);
      
      expect(fn).toHaveBeenCalledTimes(1); // Pas de retry
    });

    it('devrait utiliser le backoff exponentiel', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new GeniusPayNetworkError('Error 1'))
        .mockRejectedValueOnce(new GeniusPayNetworkError('Error 2'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      const result = await callWithRetry(fn, { maxRetries: 3, backoffMs: 100 });
      const duration = Date.now() - startTime;
      
      expect(result).toBe('success');
      // Le backoff devrait prendre au moins 100ms + 200ms = 300ms
      expect(duration).toBeGreaterThanOrEqual(200);
    });
  });
});








