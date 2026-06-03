/**
 * Client pour l'Edge Function fedex-rates (tarifs sécurisés côté serveur).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { assertFedexResponseNotMock } from '@/lib/shipping/fedex-policy';

export interface FedexRatesAddress {
  country: string;
  postal_code: string;
  city?: string;
}

export interface FedexRateQuote {
  service_type: string;
  service_name: string;
  total_cost: number;
  currency: string;
  estimated_days: number;
}

export interface FedexRatesResponse {
  rates: FedexRateQuote[];
  source: 'fedex_api' | 'mock';
}

export async function fetchFedexRatesViaEdge(params: {
  ship_from: FedexRatesAddress;
  ship_to: FedexRatesAddress;
  weight_kg: number;
}): Promise<FedexRatesResponse> {
  const { data, error } = await supabase.functions.invoke<FedexRatesResponse>('fedex-rates', {
    body: params,
  });

  if (error) {
    logger.warn('fedex-rates edge function error', { error });
    throw error;
  }

  if (!data?.rates?.length) {
    throw new Error('Aucun tarif FedEx retourné');
  }

  assertFedexResponseNotMock(data.source);

  return data;
}

/** Retourne le tarif le moins cher en XOF (ou devise renvoyée). */
export async function fetchCheapestFedexShippingCost(params: {
  ship_from: FedexRatesAddress;
  ship_to: FedexRatesAddress;
  weight_kg: number;
}): Promise<number> {
  const { rates } = await fetchFedexRatesViaEdge(params);
  const cheapest = rates.reduce((min, r) => (r.total_cost < min.total_cost ? r : min));
  return Math.round(cheapest.total_cost);
}
