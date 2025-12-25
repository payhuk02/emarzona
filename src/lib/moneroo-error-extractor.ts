/**
 * Utilitaire pour extraire les détails d'erreur Supabase de manière typée
 */

import { SupabaseError, ExtractedErrorDetails } from './moneroo-types';
import { logger } from './logger';

/**
 * Extrait le body d'erreur depuis une erreur Supabase
 */
export async function extractErrorBody(error: unknown): Promise<Record<string, unknown> | null> {
  const supabaseError = error as SupabaseError;
  
  // Méthode 1: error.context peut être une Response
  if (supabaseError?.context instanceof Response) {
    try {
      const responseText = await supabaseError.context.text();
      try {
        const parsed = JSON.parse(responseText);
        logger.info('[MonerooErrorExtractor] Extracted error body from context Response');
        return parsed;
      } catch {
        return { raw: responseText };
      }
    } catch (e) {
      logger.warn('[MonerooErrorExtractor] Could not read context Response:', e);
    }
  }
  
  // Méthode 2: error.data peut contenir le body parsé
  if (supabaseError?.data) {
    logger.info('[MonerooErrorExtractor] Using error.data');
    return supabaseError.data as Record<string, unknown>;
  }
  
  // Méthode 3: error.context peut être un objet avec le body
  if (supabaseError?.context && typeof supabaseError.context === 'object' && !(supabaseError.context instanceof Response)) {
    logger.info('[MonerooErrorExtractor] Using error.context as object');
    return supabaseError.context as Record<string, unknown>;
  }
  
  return null;
}

/**
 * Extrait les détails d'erreur complets depuis une erreur Supabase
 */
export async function extractErrorDetails(
  error: unknown,
  errorMessage: string
): Promise<ExtractedErrorDetails> {
  const supabaseError = error as SupabaseError;
  const errorBody = await extractErrorBody(error);
  let errorDetails: ExtractedErrorDetails = {
    message: errorMessage,
  };

  // Si errorBody n'est pas disponible, essayer d'extraire depuis error
  if (!errorBody || Object.keys(errorBody).length === 0) {
    // Vérifier si c'est une erreur Edge Function (non-2xx)
    if (errorMessage.includes('non-2xx') || errorMessage.includes('Edge Function')) {
      // 1. error.context (peut contenir Response)
      if (supabaseError?.context) {
        const context = supabaseError.context;
        
        if (context instanceof Response) {
          try {
            const responseText = await context.text();
            try {
              errorDetails = JSON.parse(responseText) as ExtractedErrorDetails;
              logger.info('[MonerooErrorExtractor] Parsed error from Response context');
            } catch {
              errorDetails = { message: responseText, raw: responseText };
            }
          } catch {
            // Essayer d'extraire depuis context directement
            errorDetails = context as unknown as ExtractedErrorDetails;
          }
        } else {
          errorDetails = context as unknown as ExtractedErrorDetails;
        }
      }
      // 2. error.data
      else if (supabaseError?.data) {
        errorDetails = supabaseError.data as ExtractedErrorDetails;
        logger.info('[MonerooErrorExtractor] Using error.data');
      }
      // 3. error.body
      else if (supabaseError?.body) {
        try {
          errorDetails = typeof supabaseError.body === 'string' 
            ? JSON.parse(supabaseError.body) as ExtractedErrorDetails
            : supabaseError.body as ExtractedErrorDetails;
          logger.info('[MonerooErrorExtractor] Using error.body');
        } catch {
          errorDetails = { raw: String(supabaseError.body) };
        }
      }
      // 4. Essayer de lire depuis error.message si c'est du JSON
      else if (errorMessage.trim().startsWith('{')) {
        try {
          errorDetails = JSON.parse(errorMessage) as ExtractedErrorDetails;
          logger.info('[MonerooErrorExtractor] Parsed error from message');
        } catch {
          // Pas du JSON, ignorer
        }
      }
    }
  } else {
    errorDetails = errorBody as ExtractedErrorDetails;
  }

  return errorDetails;
}

/**
 * Extrait le message détaillé depuis les détails d'erreur
 */
export function extractDetailedMessage(
  errorDetails: ExtractedErrorDetails,
  defaultMessage: string
): string {
  if (errorDetails.message) {
    return errorDetails.message;
  }
  
  if (errorDetails.error) {
    if (typeof errorDetails.error === 'string') {
      return errorDetails.error;
    }
    if (typeof errorDetails.error === 'object' && errorDetails.error?.message) {
      return errorDetails.error.message;
    }
  }
  
  if (errorDetails.hint) {
    return `${defaultMessage}. ${errorDetails.hint}`;
  }
  
  if (errorDetails.raw) {
    return errorDetails.raw;
  }
  
  return defaultMessage;
}


