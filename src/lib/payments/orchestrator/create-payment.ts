/**
 * Création de session paiement via l'orchestrateur
 */

import { logger } from '@/lib/logger';
import { createMonerooPlatformPayment } from '../adapters/moneroo-adapter';
import { createStripeConnectPayment } from '../adapters/stripe-connect-adapter';
import { createPayPalCommercePayment } from '../adapters/paypal-commerce-adapter';
import type { OrchestratedPaymentRequest, OrchestratedPaymentResult } from '../types';
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
        `${provider} sera disponible après déploiement des Edge Functions (phase 4+)`
      );

    default: {
      const _exhaustive: never = provider;
      throw new NotReadyError(_exhaustive as never);
    }
  }
}

/**
 * Point d'entrée orchestrateur — résout le PSP puis délègue à l'adapter.
 */
export async function createOrchestratedPayment(
  request: OrchestratedPaymentRequest
): Promise<OrchestratedPaymentResult> {
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

    logger.log('Payment orchestrator resolved provider', {
      storeId: request.storeId,
      orderId: request.orderId,
      provider: resolved.provider,
      reason: resolved.reason,
    });

    return await executeProviderPayment(resolved.provider, request);
  } catch (error: unknown) {
    if (error instanceof NotReadyError) {
      logger.warn('Orchestrator provider not ready, falling back to Moneroo', {
        provider: error.provider,
        storeId: request.storeId,
      });
      return createMonerooPlatformPayment(request);
    }

    if (error instanceof Error && request.orderId && error.message.includes('Stripe')) {
      logger.warn('Stripe payment failed, falling back to Moneroo', {
        storeId: request.storeId,
        error: error.message,
      });
      return createMonerooPlatformPayment(request);
    }

    const message = error instanceof Error ? error.message : String(error);
    logger.error('createOrchestratedPayment failed', { error: message, storeId: request.storeId });
    return {
      success: false,
      transaction_id: '',
      checkout_url: '',
      provider: 'moneroo_platform',
      error: message,
    };
  }
}
