import {
  FLUTTERWAVE_CONNECT_CURRENCIES,
  MONEYFUSION_CURRENCIES,
  PAYPAL_COMMERCE_CURRENCIES,
  PROVIDER_PRIORITY,
  STRIPE_CONNECT_CURRENCIES,
  hasCapability,
  isConnectionActive,
  normalizeCurrency,
} from '../constants';
import type { PaymentProviderCode, StorePaymentConnection } from '../types';
import type { ResolveProviderInput, ResolvedPaymentProvider } from '../types';

function findConnection(
  connections: StorePaymentConnection[],
  provider: PaymentProviderCode
): StorePaymentConnection | undefined {
  return connections.find(c => c.provider === provider && isConnectionActive(c));
}

function isProviderCompatible(
  provider: PaymentProviderCode,
  currency: string,
  connection: StorePaymentConnection
): boolean {
  switch (provider) {
    case 'stripe_connect':
      return (
        STRIPE_CONNECT_CURRENCIES.has(currency) &&
        (hasCapability(connection.capabilities, 'card_payments') ||
          Object.keys(connection.capabilities).length === 0)
      );
    case 'paypal_commerce':
      return PAYPAL_COMMERCE_CURRENCIES.has(currency);
    case 'flutterwave_connect':
      return FLUTTERWAVE_CONNECT_CURRENCIES.has(currency);
    case 'moneyfusion':
      return MONEYFUSION_CURRENCIES.has(currency);
    case 'geniuspay_platform':
      // GeniusPay retiré — ne plus router vers ce rail
      return false;
    default:
      return false;
  }
}

/**
 * Détermine le provider de paiement pour une commande.
 * Ne fait aucun appel réseau — les connexions doivent être chargées en amont.
 * Fallback plateforme : MoneyFusion (XOF).
 */
export function resolvePaymentProvider(input: ResolveProviderInput): ResolvedPaymentProvider {
  const currency = normalizeCurrency(input.currency);
  const activeConnections = input.connections.filter(isConnectionActive);

  if (input.forcePlatformPayments) {
    const moneyfusion = findConnection(activeConnections, 'moneyfusion');
    return {
      provider: 'moneyfusion',
      connectionId: moneyfusion?.id ?? null,
      reason: 'store_force_platform_payments',
    };
  }

  if (input.buyerPreferredProvider) {
    if (input.buyerPreferredProvider === 'geniuspay_platform') {
      // Préférence legacy GeniusPay → MoneyFusion
      const mfConn = findConnection(activeConnections, 'moneyfusion');
      return {
        provider: 'moneyfusion',
        connectionId: mfConn?.id ?? null,
        reason: 'buyer_preference_migrated_to_moneyfusion',
      };
    }

    if (input.buyerPreferredProvider === 'moneyfusion' && MONEYFUSION_CURRENCIES.has(currency)) {
      const mfConn = findConnection(activeConnections, 'moneyfusion');
      return {
        provider: 'moneyfusion',
        connectionId: mfConn?.id ?? null,
        reason: 'buyer_preference',
      };
    }

    const preferred = findConnection(activeConnections, input.buyerPreferredProvider);
    if (preferred && isProviderCompatible(input.buyerPreferredProvider, currency, preferred)) {
      return {
        provider: input.buyerPreferredProvider,
        connectionId: preferred.id,
        reason: 'buyer_preference',
      };
    }
  }

  for (const provider of PROVIDER_PRIORITY) {
    if (provider === 'moneyfusion' && MONEYFUSION_CURRENCIES.has(currency)) {
      const mfConn = findConnection(activeConnections, 'moneyfusion');
      return {
        provider: 'moneyfusion',
        connectionId: mfConn?.id ?? null,
        reason: 'auto_routing_moneyfusion',
      };
    }

    const connection = findConnection(activeConnections, provider);
    if (!connection) continue;
    if (!isProviderCompatible(provider, currency, connection)) continue;

    return {
      provider,
      connectionId: connection.id,
      reason: `auto_routing_${provider}`,
    };
  }

  const moneyfusionFallback = findConnection(activeConnections, 'moneyfusion');
  return {
    provider: 'moneyfusion',
    connectionId: moneyfusionFallback?.id ?? null,
    reason: 'fallback_moneyfusion',
  };
}
