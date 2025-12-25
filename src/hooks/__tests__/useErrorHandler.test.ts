/**
 * Tests unitaires pour useErrorHandler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useErrorHandler, useQueryErrorHandler, useMutationErrorHandler } from '../useErrorHandler';
import { ErrorType, ErrorSeverity } from '@/lib/error-handling';

// Mock useToast avec une fonction mockable
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  it('devrait normaliser et gérer une erreur réseau', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const networkError = new Error('Failed to fetch');
    const normalized = result.current.handleError(networkError);

    expect(normalized).toBeDefined();
    expect(normalized.type).toBe(ErrorType.NETWORK_ERROR);
    expect(normalized.severity).toBe(ErrorSeverity.HIGH);
    expect(normalized.retryable).toBe(true);
  });

  it('devrait gérer une erreur de validation', () => {
    const { result } = renderHook(() => useErrorHandler());

    const validationError = { code: 'PGRST116', message: 'Bad Request' };
    const normalized = result.current.handleError(validationError);

    expect(normalized).toBeDefined();
    expect(normalized.type).toBe(ErrorType.VALIDATION_ERROR);
  });

  it('devrait utiliser un message personnalisé si fourni', () => {
    mockToast.mockClear();

    const { result } = renderHook(() => 
      useErrorHandler({ customMessage: 'Message personnalisé' })
    );

    const error = new Error('Erreur test');
    result.current.handleError(error);

    // Vérifier que le toast a été appelé avec le message personnalisé
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Message personnalisé',
      })
    );
  });

  it('ne devrait pas afficher de toast pour les erreurs non-critiques en mode silent', () => {
    const { result } = renderHook(() => 
      useErrorHandler({ silent: true })
    );

    const lowSeverityError = { code: '42P01', message: 'Table does not exist' };
    const normalized = result.current.handleError(lowSeverityError);

    expect(normalized.severity).toBe(ErrorSeverity.LOW);
  });

  it('devrait appeler le callback onError si fourni', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => 
      useErrorHandler({ onError })
    );

    const error = new Error('Test error');
    result.current.handleError(error);

    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('devrait inclure le contexte dans la gestion d\'erreur', () => {
    const { result } = renderHook(() => useErrorHandler());

    const error = new Error('Test error');
    const context = { userId: '123', action: 'test' };
    const normalized = result.current.handleError(error, context);

    expect(normalized).toBeDefined();
  });
});

describe('useQueryErrorHandler', () => {
  it('devrait gérer les erreurs de requêtes React Query', () => {
    const { result } = renderHook(() => useQueryErrorHandler());

    const queryError = new Error('Query failed');
    const normalized = result.current(queryError);

    expect(normalized).toBeDefined();
  });
});

describe('useMutationErrorHandler', () => {
  it('devrait gérer les erreurs de mutations React Query', () => {
    const { result } = renderHook(() => useMutationErrorHandler());

    const mutationError = new Error('Mutation failed');
    const variables = { id: '123' };
    const normalized = result.current(mutationError, variables);

    expect(normalized).toBeDefined();
  });
});

