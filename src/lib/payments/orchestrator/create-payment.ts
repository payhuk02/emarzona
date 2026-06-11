/**
 * Création de session paiement via l'orchestrateur
 */

import { logger } from '@/lib/logger';
import { createMonerooPlatformPayment } from '../adapters/moneroo-adapter';
import { createStripeConnectPayment } from '../adapters/stripe-connect-adapter';
import { createPayPalCommercePayment } from '../adapters/paypal-commerce-adapter';
import type {
  OrchestratedPaymentRequest,
  OrchestratedPaymentResult,
  PaymentProviderCode,
  PspFallbackInfo,
} from '../types';
import { PaymentProviderNotReadyError as NotReadyError } from '../types';
import { loadStoreForcePlatformPayments, loadStorePaymentConnections } from './load-connections';
import { resolvePaymentProvider } from './resolve-provider';

async function executeProviderPayment(
  provider: ReturnType<typeof resolvePaymentProvider>['provider'],
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  switch (provider) {
    case 'moneroo_platform':
      return createMonerooPlatformPayment({ ...request, connections: request.connections });

    case 'stripe_connect':
      return createStripeConnectPayment(request);

    case 'paypal_commerce':
      return createPayPalCommercePayment(request);

    case 'flutterwave_connect':
      throw new NotReadyError(
        provider,
        `${provider} n'est pas disponible (retiré du routage actif)`
      );

    default: {
      const _exhaustive: never = provider;
      throw new NotReadyError(_exhaustive as never);
    }
  }
}

async function fallbackToMoneroo(
  request: OrchestratedPaymentRequest,
  fromProvider: PaymentProviderCode,
  reason: string
): Promise<OrchestratedPaymentResult> {
  logger.warn('Orchestrator PSP fallback to Moneroo', {
    fromProvider,
    reason,
    storeId: request.storeId,
    orderId: request.orderId,
  });

  const result = await createMonerooPlatformPayment(request);
  return {
    ...result,
    psp_fallback: {
      from_provider: fromProvider,
      to_provider: 'moneroo_platform',
      reason,
    },
  };
}

/**
 * Point d'entrée orchestrateur — résout le PSP puis délègue à l'adapter.
 */
export async function createOrchestratedPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
  let resolvedProvider: PaymentProviderCode = 'moneroo_platform';

  try {
    const [connections, forcePlatform] = await Promise.all([
      request.connections?.length
        ? Promise.resolve(request.connections)
        : loadStorePaymentConnections(request.storeId),
      request.forcePlatformPayments !== undefined
        ? Promise.resolve(request.forcePlatformPayments)
        : loadStoreForcePlatformPayments(request.storeId),
    ]);

    const resolved = resolvePaymentProvider({
      storeId: request.storeId,
      amount: request.amount,
      currency: request.currency ?? 'XOF',
      connections,
      forcePlatformPayments: forcePlatform,
      buyerPreferredProvider: request.preferredProvider,
    });

    resolvedProvider = resolved.provider;

    logger.log('Payment orchestrator resolved provider', {
      storeId: request.storeId,
      orderId: request.orderId,
      provider: resolved.provider,
      reason: resolved.reason,
    });

    const result = await executeProviderPayment(resolved.provider, request);

    if (
      resolved.provider !== 'moneroo_platform' &&
      result.provider === 'moneroo_platform' &&
      !result.psp_fallback
    ) {
      return {
        ...result,
        psp_fallback: {
          from_provider: resolved.provider,
          to_provider: 'moneroo_platform',
          reason: 'adapter_redirect',
        },
      };
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof NotReadyError) {
      return fallbackToMoneroo(request, error.provider, 'provider_not_ready');
    }

    if (error instanceof Error && request.orderId && error.message.includes('Stripe')) {
      return fallbackToMoneroo(request, 'stripe_connect', 'provider_error');
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('createOrchestratedPayment failed', { error: message, storeId: request.storeId });

    if (resolvedProvider !== 'moneroo_platform') {
      try {
        return await fallbackToMoneroo(request, resolvedProvider, 'provider_error');
      } catch (fallbackError) {
        logger.error('Moneroo fallback also failed', { fallbackError, storeId: request.storeId });
      }
    }

    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'moneroo_platform',
      error: message,
    };
  }
}
