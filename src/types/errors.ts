/**
 * Error Types
 * Date: 28 Janvier 2025
 * 
 * Types TypeScript pour remplacer les 'any' dans la gestion d'erreurs
 */

import { ErrorType, ErrorSeverity } from '@/lib/error-handling';

/**
 * Erreur Supabase standardisée
 */
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
}

/**
 * Erreur de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'async' | 'custom';
  code?: string;
}

/**
 * Erreur de requête réseau
 */
export interface NetworkError {
  message: string;
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
}

/**
 * Erreur d'authentification
 */
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Erreur de base de données
 */
export interface DatabaseError {
  message: string;
  code?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

/**
 * Erreur générique typée
 */
export interface TypedError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  retryable: boolean;
  originalError: unknown;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Type guard pour SupabaseError
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
}

/**
 * Type guard pour NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as NetworkError).message === 'string' &&
    ('status' in error || 'url' in error)
  );
}

/**
 * Type guard pour AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as AuthError).message === 'string' &&
    ('code' in error || 'status' in error)
  );
}

/**
 * Type guard pour DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DatabaseError).message === 'string' &&
    ('code' in error || 'constraint' in error)
  );
}

/**
 * Type guard pour ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'field' in error &&
    'message' in error &&
    'type' in error &&
    typeof (error as ValidationError).field === 'string'
  );
}

/**
 * Type union pour toutes les erreurs possibles
 */
export type AppError =
  | SupabaseError
  | NetworkError
  | AuthError
  | DatabaseError
  | ValidationError
  | Error
  | TypedError;

/**
 * Helper pour extraire le message d'erreur de manière type-safe
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isSupabaseError(error)) {
    return error.message;
  }
  if (isNetworkError(error)) {
    return error.message;
  }
  if (isAuthError(error)) {
    return error.message;
  }
  if (isDatabaseError(error)) {
    return error.message;
  }
  if (isValidationError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur inattendue s\'est produite';
}

/**
 * Helper pour extraire le code d'erreur de manière type-safe
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isSupabaseError(error)) {
    return error.code;
  }
  if (isNetworkError(error)) {
    return error.status?.toString();
  }
  if (isAuthError(error)) {
    return error.code || error.status?.toString();
  }
  if (isDatabaseError(error)) {
    return error.code;
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

