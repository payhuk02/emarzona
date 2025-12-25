/**
 * Error Handling Utilities
 * Date: 28 Janvier 2025
 * 
 * Utilitaires pour une gestion d'erreurs professionnelle et cohérente
 */

import { logger } from './logger';

/**
 * Types d'erreurs Supabase/PostgreSQL
 */
export enum ErrorType {
  // Erreurs réseau
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Erreurs de permissions
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Erreurs de ressources
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_MISSING = 'RESOURCE_MISSING',
  
  // Erreurs de validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Erreurs de base de données
  TABLE_NOT_EXISTS = 'TABLE_NOT_EXISTS',
  FUNCTION_NOT_EXISTS = 'FUNCTION_NOT_EXISTS',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Erreurs critiques
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  
  // Erreurs non-critiques (ne bloquent pas l'UI)
  NON_CRITICAL = 'NON_CRITICAL',
  
  // Erreur inconnue
  UNKNOWN = 'UNKNOWN',
}

/**
 * Niveaux de sévérité
 */
export enum ErrorSeverity {
  LOW = 'LOW',           // Ne pas afficher de notification
  MEDIUM = 'MEDIUM',     // Afficher notification discrète
  HIGH = 'HIGH',         // Afficher notification importante
  CRITICAL = 'CRITICAL', // Afficher notification + Error Boundary
}

/**
 * Interface pour erreurs normalisées
 */
export interface NormalizedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  retryable: boolean;
  originalError: unknown;
}

/**
 * Codes d'erreur PostgreSQL/Supabase courants
 */
const ERROR_CODES = {
  // Table/Function n'existe pas
  TABLE_NOT_EXISTS: '42P01',
  FUNCTION_NOT_EXISTS: '42883',
  
  // Permissions
  PERMISSION_DENIED: '42501',
  
  // Validation
  INVALID_PARAMETER: '22023',
  RAISE_EXCEPTION: 'P0001',
  
  // Contraintes
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  
  // Supabase PostgREST
  BAD_REQUEST: 'PGRST116',
} as const;

/**
 * Normalise une erreur en un objet structuré
 */
export function normalizeError(error: unknown): NormalizedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = error && typeof error === 'object' && 'code' in error 
    ? String(error.code) 
    : undefined;

  // Erreurs réseau
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError')
  ) {
    return {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.HIGH,
      message: errorMessage,
      userMessage: 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.',
      code: errorCode,
      retryable: true,
      originalError: error,
    };
  }

  // Timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: errorMessage,
      userMessage: 'La requête a pris trop de temps. Veuillez réessayer.',
      code: errorCode,
      retryable: true,
      originalError: error,
    };
  }

  // Table/Function n'existe pas (non-critique, migration manquante)
  if (
    errorCode === ERROR_CODES.TABLE_NOT_EXISTS ||
    errorCode === ERROR_CODES.FUNCTION_NOT_EXISTS ||
    errorMessage.includes('does not exist') ||
    (errorMessage.includes('relation') && errorMessage.includes('does not exist')) ||
    (errorMessage.includes('function') && errorMessage.includes('does not exist'))
  ) {
    return {
      type: errorCode === ERROR_CODES.FUNCTION_NOT_EXISTS 
        ? ErrorType.FUNCTION_NOT_EXISTS 
        : ErrorType.TABLE_NOT_EXISTS,
      severity: ErrorSeverity.LOW,
      message: errorMessage,
      userMessage: 'Cette fonctionnalité nécessite une mise à jour de la base de données.',
      code: errorCode,
      retryable: false,
      originalError: error,
    };
  }

  // Permissions
  if (
    errorCode === ERROR_CODES.PERMISSION_DENIED ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('non autorisé') ||
    errorMessage.includes('Accès non autorisé') ||
    errorMessage.includes('Unauthorized')
  ) {
    return {
      type: ErrorType.PERMISSION_DENIED,
      severity: ErrorSeverity.HIGH,
      message: errorMessage,
      userMessage: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
      code: errorCode,
      retryable: false,
      originalError: error,
    };
  }

  // 401 Unauthorized
  if (errorCode === '401' || errorMessage.includes('401')) {
    return {
      type: ErrorType.UNAUTHORIZED,
      severity: ErrorSeverity.HIGH,
      message: errorMessage,
      userMessage: 'Votre session a expiré. Veuillez vous reconnecter.',
      code: errorCode,
      retryable: false,
      originalError: error,
    };
  }

  // 404 Not Found
  if (errorCode === '404' || errorMessage.includes('404') || errorMessage.includes('Not found')) {
    return {
      type: ErrorType.NOT_FOUND,
      severity: ErrorSeverity.MEDIUM,
      message: errorMessage,
      userMessage: 'La ressource demandée n\'a pas été trouvée.',
      code: errorCode,
      retryable: false,
      originalError: error,
    };
  }

  // Validation
  if (
    errorCode === ERROR_CODES.INVALID_PARAMETER ||
    errorCode === ERROR_CODES.RAISE_EXCEPTION ||
    errorMessage.includes('invalid input') ||
    errorMessage.includes('invalid parameter') ||
    errorCode === ERROR_CODES.BAD_REQUEST
  ) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: errorMessage,
      userMessage: 'Les données fournies sont invalides. Veuillez vérifier et réessayer.',
      code: errorCode,
      retryable: false,
      originalError: error,
    };
  }

  // Contraintes
  if (
    errorCode === ERROR_CODES.UNIQUE_VIOLATION ||
    errorCode === ERROR_CODES.FOREIGN_KEY_VIOLATION ||
    errorCode === ERROR_CODES.NOT_NULL_VIOLATION
  ) {
    return {
      type: ErrorType.CONSTRAINT_VIOLATION,
      severity: ErrorSeverity.MEDIUM,
      message: errorMessage,
      userMessage: errorCode === ERROR_CODES.UNIQUE_VIOLATION
        ? 'Cette valeur existe déjà. Veuillez en choisir une autre.'
        : 'Les données fournies ne respectent pas les contraintes. Veuillez vérifier.',
      code: errorCode,
      retryable: false,
      originalError: error,
    };
  }

  // Erreur inconnue
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: errorMessage,
    userMessage: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    code: errorCode,
    retryable: true,
    originalError: error,
  };
}

/**
 * Détermine si une erreur doit être retry automatiquement
 */
export function shouldRetryError(error: unknown, attemptIndex: number): boolean {
  const normalized = normalizeError(error);
  
  // Ne pas retry si non-retryable
  if (!normalized.retryable) {
    return false;
  }

  // Ne pas retry plus de 3 fois
  if (attemptIndex >= 3) {
    return false;
  }

  // Retry seulement pour erreurs réseau/timeout
  return normalized.type === ErrorType.NETWORK_ERROR || normalized.type === ErrorType.TIMEOUT_ERROR;
}

/**
 * Calcule le délai avant retry (exponential backoff)
 * @param attemptIndex Index de la tentative (0-based)
 * @param baseDelay Délai de base en ms (défaut: 1000)
 * @param maxDelay Délai maximum en ms (défaut: 30000)
 */
export function getRetryDelay(attemptIndex: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
  // Exponential backoff: baseDelay * 2^attemptIndex, max maxDelay
  return Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);
}

/**
 * Log une erreur avec contexte
 */
export function logError(error: unknown, context?: Record<string, unknown>): NormalizedError {
  const normalized = normalizeError(error);
  
  const logData = {
    type: normalized.type,
    severity: normalized.severity,
    message: normalized.message,
    code: normalized.code,
    retryable: normalized.retryable,
    ...context,
  };

  switch (normalized.severity) {
    case ErrorSeverity.CRITICAL:
      logger.error('Erreur critique', logData);
      break;
    case ErrorSeverity.HIGH:
      logger.error('Erreur importante', logData);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn('Erreur modérée', logData);
      break;
    case ErrorSeverity.LOW:
      logger.info('Erreur non-critique', logData);
      break;
  }

  return normalized;
}

