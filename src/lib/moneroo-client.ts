import { supabase } from "@/integrations/supabase/client";
import { logger } from './logger';
import {
  parseMonerooError,
  MonerooNetworkError,
  MonerooAPIError,
  MonerooTimeoutError,
  MonerooValidationError,
  MonerooAuthenticationError,
} from "./moneroo-errors";
import { Currency } from "./currency-converter";
import {
  SupabaseEdgeFunctionResponse,
  SupabaseError,
  ExtractedErrorDetails,
} from "./moneroo-types";
import { MONEROO_CONFIG } from "./moneroo-config";
import { callWithRetry } from "./moneroo-retry";
import {
  extractErrorBody,
  extractErrorDetails,
  extractDetailedMessage,
} from "./moneroo-error-extractor";
import { monerooRateLimiter, checkRateLimit } from "./moneroo-rate-limiter";

export interface MonerooPaymentData {
  amount: number;
  currency?: Currency;
  description?: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
  return_url?: string;
  cancel_url?: string;
}

export interface MonerooCheckoutData {
  amount: number;
  currency?: Currency;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  return_url: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
  // Champs additionnels passés directement dans data pour l'Edge Function
  productId?: string;  // L'Edge Function l'extraira et l'ajoutera à metadata.product_id
  storeId?: string;    // L'Edge Function l'extraira et l'ajoutera à metadata.store_id
}

export interface MonerooRefundData {
  paymentId: string;
  amount?: number; // Si non spécifié, remboursement total
  reason?: string;
}

export interface MonerooRefundResponse {
  refund_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

class MonerooClient {
  private async callFunction(action: string, data: Record<string, unknown>) {
    try {
      // Vérifier l'authentification avant d'appeler l'Edge Function
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        // Auth check warning - non-blocking
      }
      
      // Vérifier le rate limit avant de faire la requête
      const identifier = user?.id || (data.storeId as string) || undefined;
      try {
        checkRateLimit(identifier);
      } catch (rateLimitError) {
        const errorMessage = rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError);
        throw new MonerooAPIError(
          `Rate limit dépassé: ${errorMessage}`,
          429,
          {
            action,
            identifier,
            retryAfter: monerooRateLimiter.getTimeUntilReset(identifier),
          }
        );
      }
      
      // Vérifier que Supabase est configuré
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new MonerooNetworkError(
          'VITE_SUPABASE_URL n\'est pas configuré. Vérifiez vos variables d\'environnement.'
        );
      }
      
      // Edge Function details - log via logger if needed
      
      // Appel à l'Edge Function avec retry automatique et timeout configurable
      const { data: response, error } = await callWithRetry(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), MONEROO_CONFIG.timeout);
          
          try {
            const result = await supabase.functions.invoke("moneroo", {
              body: { action, data },
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            return result;
          } catch (err) {
            clearTimeout(timeoutId);
            throw err;
          }
        },
        {
          maxRetries: MONEROO_CONFIG.maxRetries,
          backoffMs: MONEROO_CONFIG.retryBackoff,
        }
      );
      
      // Edge Function response - log via logger if needed
      
      // Si erreur, la gérer immédiatement
      if (error) {
        // Extraire le body d'erreur de manière typée
        const errorBody = await extractErrorBody(error);
        const supabaseError = error as SupabaseError;
        const errorMessage = supabaseError.message || 'Erreur inconnue';
        
        // Logger l'erreur complète pour debugging
        logger.error('[MonerooClient] Supabase function error:', {
          error,
          errorMessage,
          errorType: typeof error,
          errorKeys: error ? Object.keys(error) : [],
          hasContext: !!supabaseError?.context,
          hasData: !!supabaseError?.data,
          hasBody: !!supabaseError?.body,
          hasErrorBody: !!errorBody,
        });
        
        // Gérer l'erreur "Failed to fetch" spécifiquement
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('network') ||
            errorMessage.toLowerCase().includes('network request failed')) {
          
          throw new MonerooNetworkError(
            `Erreur de connexion: Impossible de se connecter à l'Edge Function Moneroo.\n\n` +
            `💡 Vérifiez:\n` +
            `1. Votre connexion Internet\n` +
            `2. Que l'Edge Function 'moneroo' est déployée dans Supabase Dashboard\n` +
            `3. Que l'Edge Function est accessible: ${supabaseUrl}/functions/v1/moneroo\n` +
            `4. Les logs Supabase Edge Functions → Logs → moneroo pour plus de détails\n\n` +
            `Erreur technique: ${errorMessage}`,
            { originalError: error, action, data, supabaseUrl }
          );
        }
        
        // Extraire les détails d'erreur complets de manière typée
        const errorDetails = await extractErrorDetails(error, errorMessage);
        const detailedMessage = extractDetailedMessage(errorDetails, errorMessage);
        
        // Logger les détails trouvés
        logger.info('[MonerooClient] Error details extracted:', {
          hasErrorBody: !!errorBody,
          hasDetails: Object.keys(errorDetails).length > 0,
          detailsKeys: Object.keys(errorDetails),
          errorDetails,
        });
        
        // Vérifier si c'est une erreur de configuration API
        if (detailedMessage.includes('Configuration API manquante') || 
            detailedMessage.includes('n\'est pas configurée') ||
            detailedMessage.includes('MONEROO_API_KEY')) {
          throw new MonerooAuthenticationError(
            `Configuration API manquante: ${detailedMessage}. ` +
            `Veuillez configurer MONEROO_API_KEY dans Supabase Dashboard → Edge Functions → Secrets`
          );
        }
        
        // Vérifier si c'est une erreur de parsing de la réponse Moneroo
        if (detailedMessage.includes('Impossible de parser') || 
            detailedMessage.includes('parser la réponse') ||
            (detailedMessage.includes('parse') && detailedMessage.includes('Moneroo'))) {
            const parseErrorDetails = errorDetails.details || errorDetails;
            const troubleshooting = errorDetails.troubleshooting || {};
            
            const enhancedMessage = `Erreur de parsing de la réponse Moneroo: ${detailedMessage}\n\n` +
              `💡 Détails techniques:\n` +
              `- Status: ${parseErrorDetails.status || 'N/A'}\n` +
              `- Content-Type: ${parseErrorDetails.contentType || 'N/A'}\n` +
              `- Longueur réponse: ${parseErrorDetails.responseLength || 'N/A'} caractères\n` +
              `- Aperçu: ${parseErrorDetails.responsePreview || 'N/A'}\n\n` +
              `🔧 Solutions:\n` +
              `${troubleshooting.step1 || '1. Vérifiez les logs Supabase Edge Functions pour voir la réponse complète'}\n` +
              `${troubleshooting.step2 || '2. Vérifiez que MONEROO_API_KEY est correctement configuré'}\n` +
              `${troubleshooting.step3 || '3. Vérifiez que l\'endpoint Moneroo est accessible'}\n` +
              `${troubleshooting.step4 || '4. Vérifiez que les données envoyées sont valides'}\n\n` +
              `📋 Pour plus d'aide, consultez les logs Supabase Edge Functions → Logs → moneroo`;
            
          throw new MonerooAPIError(enhancedMessage, parseErrorDetails.status || 500, errorDetails);
        }
        
        // Créer un message d'erreur plus informatif
        const statusCode = errorDetails.status || errorDetails.statusCode || 500;
        const fullErrorMessage = errorDetails.hint 
          ? `${detailedMessage}\n\n💡 ${errorDetails.hint}`
          : detailedMessage;
        
        // Message spécifique pour 422 (Unprocessable Entity)
        if (statusCode === 422) {
          const enhancedMessage = `Erreur de validation (422): ${fullErrorMessage}\n\n` +
            `💡 Vérifiez:\n` +
            `1. Les logs Supabase Edge Functions → Logs → moneroo pour voir l'erreur exacte\n` +
            `2. Que tous les paramètres requis sont présents et valides\n` +
            `3. Que le format des données correspond à ce que l'Edge Function attend\n` +
            `4. Les détails complets: ${JSON.stringify(errorDetails, null, 2)}`;
          throw new MonerooValidationError(enhancedMessage);
        }
        
        throw new MonerooAPIError(fullErrorMessage, statusCode, errorDetails);
      }

      // Si pas d'erreur, vérifier le succès de la réponse
      const typedResponse = response as SupabaseEdgeFunctionResponse;
      if (!typedResponse?.success) {
        // Erreur API Moneroo
        const statusCode = typedResponse.status || 500;
        const errorMessage = typedResponse.message || typedResponse.error || "Erreur lors de la requête Moneroo.";
        
        if (statusCode === 401) {
          throw new MonerooAuthenticationError(errorMessage);
        }
        if (statusCode === 400) {
          throw new MonerooValidationError(errorMessage);
        }
        
        throw new MonerooAPIError(errorMessage, statusCode, typedResponse.details || typedResponse);
      }

      // Succès : retourner les données
      // Enregistrer la requête réussie dans le rate limiter
      monerooRateLimiter.recordRequest(identifier);
      
      return typedResponse.data;
    } catch (error) {
      // Si c'est déjà une MonerooError, la relancer
      if (error instanceof MonerooNetworkError || 
          error instanceof MonerooAPIError ||
          error instanceof MonerooTimeoutError ||
          error instanceof MonerooValidationError ||
          error instanceof MonerooAuthenticationError) {
        throw error;
      }
      
      // Sinon, parser l'erreur
      throw parseMonerooError(error);
    }
  }

  /** 🔹 Créer un paiement direct */
  async createPayment(paymentData: MonerooPaymentData) {
    return this.callFunction("create_payment", paymentData);
  }

  /** 🔹 Récupérer les détails d'un paiement */
  async getPayment(paymentId: string) {
    return this.callFunction("get_payment", { paymentId });
  }

  /** 🔹 Initialiser une session de checkout Moneroo */
  async createCheckout(checkoutData: MonerooCheckoutData) {
    return this.callFunction("create_checkout", checkoutData);
  }

  /** 🔹 Vérifier le statut d'un paiement */
  async verifyPayment(paymentId: string) {
    return this.callFunction("verify_payment", { paymentId });
  }

  /** 🔹 Rembourser un paiement */
  async refundPayment(refundData: MonerooRefundData): Promise<MonerooRefundResponse> {
    return this.callFunction("refund_payment", refundData) as Promise<MonerooRefundResponse>;
  }

  /** 🔹 Annuler un paiement */
  async cancelPayment(paymentId: string) {
    return this.callFunction("cancel_payment", { paymentId });
  }
}

export const monerooClient = new MonerooClient();
