/**
 * P2 — Abstraction multi-transporteurs (checkout).
 * FedEx prod ; DHL stub pour transporteur #2.
 */

import { fetchCheapestFedexShippingCost } from '@/lib/shipping/fedex-rates-client';
import { logger } from '@/lib/logger';

export interface ShippingRateRequest {
  ship_from: { country: string; postal_code: string; city?: string };
  ship_to: { country: string; postal_code: string; city?: string };
  weight_kg: number;
}

export interface ShippingProvider {
  id: string;
  label: string;
  /** null = indisponible pour cette requête */
  quoteCheapest(request: ShippingRateRequest): Promise<number | null>;
}

const fedexProvider: ShippingProvider = {
  id: 'fedex',
  label: 'FedEx',
  async quoteCheapest(request) {
    return fetchCheapestFedexShippingCost(request);
  },
};

/** Stub DHL — prêt pour Edge `dhl-rates` ; retourne null jusqu'au déploiement. */
const dhlProvider: ShippingProvider = {
  id: 'dhl',
  label: 'DHL',
  async quoteCheapest(_request) {
    if (import.meta.env.VITE_DHL_RATES_ENABLED === 'true') {
      logger.debug('[Shipping] DHL rates enabled but edge function not wired yet');
    }
    return null;
  },
};

const CHECKOUT_PROVIDERS: ShippingProvider[] = [fedexProvider, dhlProvider];

export function listCheckoutShippingProviders(): ShippingProvider[] {
  return CHECKOUT_PROVIDERS;
}

/** Retourne le tarif le moins cher parmi les transporteurs actifs. */
export async function fetchCheapestCarrierShippingCost(
  request: ShippingRateRequest
): Promise<number> {
  const quotes = await Promise.all(
    CHECKOUT_PROVIDERS.map(async provider => {
      try {
        const amount = await provider.quoteCheapest(request);
        return amount != null && amount > 0 ? amount : null;
      } catch (error) {
        logger.warn(`[Shipping] ${provider.id} quote failed`, { error });
        return null;
      }
    })
  );

  const valid = quotes.filter((q): q is number => q != null);
  if (valid.length === 0) {
    throw new Error('NO_CARRIER_RATES');
  }
  return Math.min(...valid);
}
