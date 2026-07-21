import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';
import {
  parseGeniusPayError,
  GeniusPayNetworkError,
  GeniusPayAPIError,
  GeniusPayTimeoutError,
  GeniusPayValidationError,
  GeniusPayAuthenticationError,
} from './geniuspay-errors';
import { Currency } from './currency-converter';
import {
  SupabaseEdgeFunctionResponse,
  SupabaseError,
  GeniusPayVerifyPaymentResponse,
} from './geniuspay-types';
import { GENIUSPAY_CONFIG } from './geniuspay-config';
import { callWithRetry } from './geniuspay-retry';
import {
  extractErrorBody,
  extractErrorDetails,
  extractDetailedMessage,
} from './geniuspay-error-extractor';
import { geniuspayRateLimiter, checkRateLimit } from './geniuspay-rate-limiter';

export interface GeniusPayPaymentData {
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

export interface GeniusPayCheckoutData {
  amount: number;
  currency?: Currency;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  /** Code pays ISO2 pour le routage PawaPay (ex: CI, SN, BF) */
  customer_country?: string;
  return_url: string;
  cancel_url?: string;
  metadata?: Record<string, unknown>;
  /**
   * Méthode GeniusPay (`payment_method`). Défaut côté serveur: pawapay.
   * @see https://geniuspay.ci/docs/api
   */
  payment_method?: string;
  /** Code opérateur MMO PawaPay explicite (ex: ORANGE_CIV) — optionnel */
  mmo_provider?: string;
  // Champs additionnels passés directement dans data pour l'Edge Function
  productId?: string; // L'Edge Function l'extraira et l'ajoutera à metadata.product_id
  storeId?: string; // L'Edge Function l'extraira et l'ajoutera à metadata.store_id
}

export interface GeniusPayRefundData {
  paymentId: string;
  amount?: number; // Si non spécifié, remboursement total
  reason?: string;
}

export interface GeniusPayRefundResponse {
  refund_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

class GeniusPayClient {
  private async callFunction(action: string, data: object) {
    try {
      // Vérifier l'authentification avant d'appeler l'Edge Function
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        // Auth check warning - non-blocking
      }

      // Vérifier le rate limit avant de faire la requête
      const identifier =
        user?.id || ((data as Record<string, unknown>).storeId as string | undefined);
      try {
        checkRateLimit(identifier);
      } catch (rateLimitError) {
        const errorMessage =
          rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError);
        throw new GeniusPayAPIError(`Rate limit dépassé: ${errorMessage}`, 429, {
          action,
          identifier,
          retryAfter: geniuspayRateLimiter.getTimeUntilReset(identifier),
        });
      }

      // Vérifier que Supabase est configuré
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new GeniusPayNetworkError(
          "VITE_SUPABASE_URL n'est pas configuré. Vérifiez vos variables d'environnement."
        );
      }

      // Edge Function details - log via logger if needed

      // Appel à l'Edge Function avec retry automatique et timeout configurable
      const { data: response, error } = await callWithRetry(
        async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), GENIUSPAY_CONFIG.timeout);

          try {
            const payload = data as Record<string, unknown>;
            const metadata =
              payload.metadata &&
              typeof payload.metadata === 'object' &&
              !Array.isArray(payload.metadata)
                ? (payload.metadata as Record<string, unknown>)
                : undefined;
            const checkoutToken =
              typeof metadata?.checkout_token === 'string' ? metadata.checkout_token : undefined;

            const result = await supabase.functions.invoke(`geniuspay?t=${Date.now()}`, {
              body: { action, data: payload },
              signal: controller.signal,
              headers: checkoutToken ? { 'x-checkout-token': checkoutToken } : undefined,
            });

            clearTimeout(timeoutId);
            return result;
          } catch (err) {
            clearTimeout(timeoutId);
            throw err;
          }
        },
        {
          maxRetries: GENIUSPAY_CONFIG.maxRetries,
          backoffMs: GENIUSPAY_CONFIG.retryBackoff,
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
        logger.error('[GeniusPayClient] Supabase function error:', {
          errorMessage,
          status: supabaseError?.context?.status ?? supabaseError?.status,
          action,
          hasErrorBody: !!errorBody,
        });

        // #region agent log
        fetch('http://127.0.0.1:7740/ingest/c21af8ec-02ef-48c9-95f8-23aa8fa2c366', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fed886' },
          body: JSON.stringify({
            sessionId: 'fed886',
            hypothesisId: 'H4-digital-payment-auth',
            location: 'geniuspay-client.ts:callFunction',
            message: 'GeniusPay edge function error',
            data: {
              action,
              status: supabaseError?.context?.status ?? supabaseError?.status ?? null,
              errorMessage: errorMessage.slice(0, 200),
              errorBodyMessage:
                typeof errorBody === 'object' && errorBody && 'message' in errorBody
                  ? String((errorBody as { message?: unknown }).message ?? '').slice(0, 200)
                  : null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion

        // Gérer l'erreur "Failed to fetch" spécifiquement
        if (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('NetworkError') ||
          errorMessage.includes('network') ||
          errorMessage.toLowerCase().includes('network request failed')
        ) {
          throw new GeniusPayNetworkError(
            `Erreur de connexion: Impossible de se connecter à l'Edge Function GeniusPay.\n\n` +
              `💡 Vérifiez:\n` +
              `1. Votre connexion Internet\n` +
              `2. Que l'Edge Function 'geniuspay' est déployée dans Supabase Dashboard\n` +
              `3. Que l'Edge Function est accessible: ${supabaseUrl}/functions/v1/geniuspay\n` +
              `4. Les logs Supabase Edge Functions → Logs → geniuspay pour plus de détails\n\n` +
              `Erreur technique: ${errorMessage}`,
            { originalError: errorMessage, action, supabaseUrl }
          );
        }

        // Extraire les détails d'erreur complets de manière typée
        const errorDetails = await extractErrorDetails(error, errorMessage);
        const detailedMessage = extractDetailedMessage(errorDetails, errorMessage);

        logger.debug('[GeniusPayClient] Error details extracted:', {
          hasErrorBody: !!errorBody,
          detailsKeys: Object.keys(errorDetails),
        });

        // Vérifier si c'est une erreur de configuration API
        if (
          detailedMessage.includes('Configuration API manquante') ||
          detailedMessage.includes("n'est pas configurée") ||
          detailedMessage.includes('GENIUSPAY_API_KEY')
        ) {
          throw new GeniusPayAuthenticationError(
            `Configuration API manquante: ${detailedMessage}. ` +
              `Veuillez configurer GENIUSPAY_API_KEY dans Supabase Dashboard → Edge Functions → Secrets`
          );
        }

        // Vérifier si c'est une erreur de parsing de la réponse GeniusPay
        if (
          detailedMessage.includes('Impossible de parser') ||
          detailedMessage.includes('parser la réponse') ||
          (detailedMessage.includes('parse') && detailedMessage.includes('GeniusPay'))
        ) {
          const nested = errorDetails.details;
          const parseErrorDetails: Record<string, unknown> =
            typeof nested === 'object' && nested !== null && !Array.isArray(nested)
              ? { ...(nested as Record<string, unknown>) }
              : { ...errorDetails };
          const troubleshooting = errorDetails.troubleshooting || {};

          const enhancedMessage =
            `Erreur de parsing de la réponse GeniusPay: ${detailedMessage}\n\n` +
            `💡 Détails techniques:\n` +
            `- Status: ${String(parseErrorDetails.status ?? 'N/A')}\n` +
            `- Content-Type: ${String(parseErrorDetails.contentType ?? 'N/A')}\n` +
            `- Longueur réponse: ${String(parseErrorDetails.responseLength ?? 'N/A')} caractères\n` +
            `- Aperçu: ${String(parseErrorDetails.responsePreview ?? 'N/A')}\n\n` +
            `🔧 Solutions:\n` +
            `${troubleshooting.step1 || '1. Vérifiez les logs Supabase Edge Functions pour voir la réponse complète'}\n` +
            `${troubleshooting.step2 || '2. Vérifiez que GENIUSPAY_API_KEY est correctement configuré'}\n` +
            `${troubleshooting.step3 || "3. Vérifiez que l'endpoint GeniusPay est accessible"}\n` +
            `${troubleshooting.step4 || '4. Vérifiez que les données envoyées sont valides'}\n\n` +
            `📋 Pour plus d'aide, consultez les logs Supabase Edge Functions → Logs → geniuspay`;

          throw new GeniusPayAPIError(
            enhancedMessage,
            Number(parseErrorDetails.status) || 500,
            errorDetails
          );
        }

        // Créer un message d'erreur plus informatif
        const statusCode = errorDetails.status || errorDetails.statusCode || 500;
        const fullErrorMessage = errorDetails.hint
          ? `${detailedMessage}\n\n💡 ${errorDetails.hint}`
          : detailedMessage;

        // Message spécifique pour 422 (Unprocessable Entity)
        if (statusCode === 422) {
          const enhancedMessage =
            `Erreur de validation (422): ${fullErrorMessage}\n\n` +
            `💡 Vérifiez:\n` +
            `1. Les logs Supabase Edge Functions → Logs → geniuspay pour voir l'erreur exacte\n` +
            `2. Que tous les paramètres requis sont présents et valides\n` +
            `3. Que le format des données correspond à ce que l'Edge Function attend\n` +
            `4. Les détails complets: ${JSON.stringify(errorDetails, null, 2)}`;
          throw new GeniusPayValidationError(enhancedMessage);
        }

        throw new GeniusPayAPIError(fullErrorMessage, statusCode, errorDetails);
      }

      // Si pas d'erreur, vérifier le succès de la réponse
      const typedResponse = response as SupabaseEdgeFunctionResponse;
      if (!typedResponse?.success) {
        // Erreur API GeniusPay
        const statusCode = typedResponse.status || 500;
        const errorMessage =
          typedResponse.message || typedResponse.error || 'Erreur lors de la requête GeniusPay.';

        if (statusCode === 401) {
          throw new GeniusPayAuthenticationError(errorMessage);
        }
        if (statusCode === 400) {
          throw new GeniusPayValidationError(errorMessage);
        }

        throw new GeniusPayAPIError(
          errorMessage,
          statusCode,
          typedResponse.details || typedResponse
        );
      }

      // Succès : retourner les données
      // Enregistrer la requête réussie dans le rate limiter
      geniuspayRateLimiter.recordRequest(identifier);

      return typedResponse.data;
    } catch (error) {
      // Si c'est déjà une GeniusPayError, la relancer
      if (
        error instanceof GeniusPayNetworkError ||
        error instanceof GeniusPayAPIError ||
        error instanceof GeniusPayTimeoutError ||
        error instanceof GeniusPayValidationError ||
        error instanceof GeniusPayAuthenticationError
      ) {
        throw error;
      }

      // Sinon, parser l'erreur
      throw parseGeniusPayError(error);
    }
  }

  /** 🔹 Créer un paiement direct */
  async createPayment(paymentData: GeniusPayPaymentData) {
    return this.callFunction('create_payment', paymentData);
  }

  /** 🔹 Récupérer les détails d'un paiement */
  async getPayment(paymentId: string) {
    return this.callFunction('get_payment', { paymentId });
  }

  /** 🔹 Initialiser une session de checkout GeniusPay */
  async createCheckout(checkoutData: GeniusPayCheckoutData) {
    return this.callFunction('create_checkout', checkoutData);
  }

  /** 🔹 Vérifier le statut d'un paiement */
  async verifyPayment(paymentId: string): Promise<GeniusPayVerifyPaymentResponse> {
    return this.callFunction('verify_payment', {
      paymentId,
    }) as Promise<GeniusPayVerifyPaymentResponse>;
  }

  /** 🔹 Rembourser un paiement */
  async refundPayment(refundData: GeniusPayRefundData): Promise<GeniusPayRefundResponse> {
    return this.callFunction('refund_payment', refundData) as Promise<GeniusPayRefundResponse>;
  }

  /** 🔹 Annuler un paiement */
  async cancelPayment(paymentId: string) {
    return this.callFunction('cancel_payment', { paymentId });
  }
}

export const geniuspayClient = new GeniusPayClient();
