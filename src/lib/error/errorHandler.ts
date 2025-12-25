/**
 * Error Handler
 * Date: 30 Janvier 2025
 * 
 * Gestion centralisée des erreurs
 */

import { logger } from '@/lib/logger';

// =====================================================
// ERROR TYPES
// =====================================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  originalError?: Error;
}

// =====================================================
// ERROR CREATION
// =====================================================

/**
 * Create application error
 */
export function createError(
  type: ErrorType,
  message: string,
  options?: {
    code?: string;
    statusCode?: number;
    details?: Record<string, unknown>;
    originalError?: Error;
  }
): AppError {
  return {
    type,
    message,
    code: options?.code,
    statusCode: options?.statusCode,
    details: options?.details,
    originalError: options?.originalError,
  };
}

/**
 * Create network error
 */
export function createNetworkError(
  message: string = 'Erreur de connexion réseau',
  originalError?: Error
): AppError {
  return createError(ErrorType.NETWORK, message, {
    statusCode: 0,
    originalError,
  });
}

/**
 * Create validation error
 */
export function createValidationError(
  message: string,
  details?: Record<string, unknown>
): AppError {
  return createError(ErrorType.VALIDATION, message, {
    statusCode: 400,
    details,
  });
}

/**
 * Create authentication error
 */
export function createAuthenticationError(
  message: string = 'Non authentifié'
): AppError {
  return createError(ErrorType.AUTHENTICATION, message, {
    statusCode: 401,
  });
}

/**
 * Create authorization error
 */
export function createAuthorizationError(
  message: string = 'Accès non autorisé'
): AppError {
  return createError(ErrorType.AUTHORIZATION, message, {
    statusCode: 403,
  });
}

/**
 * Create not found error
 */
export function createNotFoundError(
  message: string = 'Ressource non trouvée'
): AppError {
  return createError(ErrorType.NOT_FOUND, message, {
    statusCode: 404,
  });
}

/**
 * Create server error
 */
export function createServerError(
  message: string = 'Erreur serveur',
  originalError?: Error
): AppError {
  return createError(ErrorType.SERVER, message, {
    statusCode: 500,
    originalError,
  });
}

// =====================================================
// ERROR HANDLING
// =====================================================

/**
 * Handle error and log it
 */
export function handleError(error: unknown, context?: string): AppError {
  let appError: AppError;

  if (isAppError(error)) {
    appError = error;
  } else if (error instanceof Error) {
    appError = createServerError(error.message, error);
  } else {
    appError = createError(ErrorType.UNKNOWN, 'Une erreur inconnue est survenue');
  }

  // Log error
  logger.error('Error handled', {
    context,
    error: appError,
    stack: appError.originalError?.stack,
  });

  return appError;
}

/**
 * Check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    Object.values(ErrorType).includes((error as AppError).type)
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Problème de connexion. Vérifiez votre connexion internet.';
    case ErrorType.VALIDATION:
      return error.message || 'Les données saisies ne sont pas valides.';
    case ErrorType.AUTHENTICATION:
      return 'Vous devez être connecté pour effectuer cette action.';
    case ErrorType.AUTHORIZATION:
      return "Vous n'avez pas les permissions nécessaires.";
    case ErrorType.NOT_FOUND:
      return 'La ressource demandée est introuvable.';
    case ErrorType.SERVER:
      return "Une erreur serveur est survenue. Veuillez réessayer plus tard.";
    default:
      return error.message || 'Une erreur est survenue.';
  }
}

// =====================================================
// ERROR BOUNDARY HELPERS
// =====================================================

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

/**
 * Reset error boundary
 */
export function resetErrorBoundary(): ErrorBoundaryState {
  return {
    hasError: false,
    error: null,
  };
}

