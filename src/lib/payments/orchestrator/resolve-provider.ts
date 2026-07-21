import {
  FLUTTERWAVE_CONNECT_CURRENCIES,
  GENIUSPAY_PLATFORM_CURRENCIES,
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
      return GENIUSPAY_PLATFORM_CURRENCIES.has(currency) || currency.length > 0;
    default:
      return false;
  }
}

/**
 * Détermine le provider de paiement pour une commande.
 * Ne fait aucun appel réseau — les connexions doivent être chargées en amont.
 */
export function resolvePaymentProvider(input: ResolveProviderInput): ResolvedPaymentProvider {
  const currency = normalizeCurrency(input.currency);
  const activeConnections = input.connections.filter(isConnectionActive);

  if (input.forcePlatformPayments) {
    const geniuspay = findConnection(activeConnections, 'geniuspay_platform');
    return {
      provider: 'geniuspay_platform',
      connectionId: geniuspay?.id ?? null,
      reason: 'store_force_platform_payments',
    };
  }

  if (input.buyerPreferredProvider) {
    // MoneyFusion = rail plateforme (pas de connexion boutique obligatoire)
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
    // MoneyFusion n'est sélectionné automatiquement que si une connexion active existe
    // (sinon uniquement via préférence acheteur / UI).
    const connection = findConnection(activeConnections, provider);
    if (!connection) continue;
    if (!isProviderCompatible(provider, currency, connection)) continue;

    return {
      provider,
      connectionId: connection.id,
      reason: `auto_routing_${provider}`,
    };
  }

  const geniuspayFallback = findConnection(activeConnections, 'geniuspay_platform');
  return {
    provider: 'geniuspay_platform',
    connectionId: geniuspayFallback?.id ?? null,
    reason: 'fallback_geniuspay',
  };
}
