/**
 * Shipping spécialisé pour œuvres d'artiste — FedEx si CP disponible, sinon heuristique.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  fetchCheapestFedexShippingCost,
  fetchFedexRatesViaEdge,
  type FedexRatesAddress,
} from '@/lib/shipping/fedex-rates-client';

export interface ArtistShippingConfig {
  requires_shipping: boolean;
  shipping_fragile: boolean;
  shipping_insurance_required: boolean;
  shipping_insurance_amount?: number;
  shipping_handling_time: number;
  packaging_type?: 'standard' | 'art_specialized' | 'museum_grade';
  temperature_controlled?: boolean;
  humidity_controlled?: boolean;
  requires_signature?: boolean;
  special_instructions?: string;
}

export type ArtistShippingQuoteSource = 'fedex' | 'heuristic' | 'none';

export interface ArtistShippingQuote {
  base_shipping: number;
  insurance_cost: number;
  packaging_cost: number;
  special_handling_cost: number;
  total_shipping: number;
  currency: string;
  estimated_delivery_days: number;
  carrier_recommendations: string[];
  quote_source: ArtistShippingQuoteSource;
  fedex_service_name?: string;
}

const ARTIST_PRODUCT_SHIPPING_FIELDS =
  'product_id, requires_shipping, shipping_fragile, shipping_insurance_required, shipping_insurance_amount, shipping_handling_time, artwork_weight, artwork_dimensions';

const DEFAULT_SHIP_FROM: FedexRatesAddress = {
  country: 'BF',
  postal_code: '01',
  city: 'Ouagadougou',
};

const DEFAULT_ARTWORK_WEIGHT_KG = 2;

type ArtworkDimensions = {
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  unit?: 'cm' | 'in';
};

/** Poids expédition : déclaré > volumétrique > défaut 2 kg */
export function resolveArtworkWeightKg(artworkWeight: unknown, dimensions: unknown): number {
  if (typeof artworkWeight === 'number' && artworkWeight > 0) {
    return Math.max(0.5, artworkWeight);
  }
  if (artworkWeight && typeof artworkWeight === 'object' && !Array.isArray(artworkWeight)) {
    const w =
      (artworkWeight as { value?: number; kg?: number }).kg ??
      (artworkWeight as { value?: number }).value;
    if (typeof w === 'number' && w > 0) return Math.max(0.5, w);
  }

  const dim = dimensions as ArtworkDimensions | null | undefined;
  if (dim?.width && dim?.height) {
    const toCm = (v: number) => (dim.unit === 'in' ? v * 2.54 : v);
    const w = toCm(dim.width);
    const h = toCm(dim.height);
    const d = dim.depth ? toCm(dim.depth) : 10;
    const volumetricKg = (w * h * d) / 5000;
    if (volumetricKg > 0) return Math.max(0.5, Math.round(volumetricKg * 100) / 100);
  }

  return DEFAULT_ARTWORK_WEIGHT_KG;
}

async function resolveFedexBaseShipping(
  destination: { country: string; city?: string; postal_code?: string },
  weightKg: number
): Promise<{ cost: number; serviceName?: string; estimatedDays?: number } | null> {
  const postalCode = destination.postal_code?.trim();
  const country = destination.country?.trim();
  if (!postalCode || !country || country.length < 2) return null;

  try {
    const params = {
      ship_from: DEFAULT_SHIP_FROM,
      ship_to: {
        country,
        postal_code: postalCode,
        city: destination.city,
      },
      weight_kg: weightKg,
    };

    const { rates } = await fetchFedexRatesViaEdge(params);
    if (!rates.length) return null;

    const cheapest = rates.reduce((min, r) => (r.total_cost < min.total_cost ? r : min));
    return {
      cost: Math.round(cheapest.total_cost),
      serviceName: cheapest.service_name,
      estimatedDays: cheapest.estimated_days,
    };
  } catch (error) {
    logger.warn('FedEx artist shipping quote failed, using heuristic', { error, destination });
    try {
      const cost = await fetchCheapestFedexShippingCost({
        ship_from: DEFAULT_SHIP_FROM,
        ship_to: {
          country,
          postal_code: postalCode,
          city: destination.city,
        },
        weight_kg: weightKg,
      });
      return { cost };
    } catch {
      return null;
    }
  }
}

export async function calculateArtistShipping(
  productId: string,
  destination: {
    country: string;
    city?: string;
    postal_code?: string;
  },
  artworkValue: number
): Promise<ArtistShippingQuote> {
  try {
    const { data: artistProduct, error } = await supabase
      .from('artist_products')
      .select(ARTIST_PRODUCT_SHIPPING_FIELDS)
      .eq('product_id', productId)
      .single();

    if (error || !artistProduct) {
      throw new Error('Artwork not found');
    }

    const config: ArtistShippingConfig = {
      requires_shipping: artistProduct.requires_shipping ?? true,
      shipping_fragile: artistProduct.shipping_fragile ?? false,
      shipping_insurance_required: artistProduct.shipping_insurance_required ?? false,
      shipping_insurance_amount: artistProduct.shipping_insurance_amount ?? undefined,
      shipping_handling_time: artistProduct.shipping_handling_time ?? 7,
      packaging_type: 'art_specialized',
    };

    if (!config.requires_shipping) {
      return {
        base_shipping: 0,
        insurance_cost: 0,
        packaging_cost: 0,
        special_handling_cost: 0,
        total_shipping: 0,
        currency: 'XOF',
        estimated_delivery_days: 0,
        carrier_recommendations: [],
        quote_source: 'none',
      };
    }

    const weightKg = resolveArtworkWeightKg(
      artistProduct.artwork_weight,
      artistProduct.artwork_dimensions
    );

    const fedexQuote = await resolveFedexBaseShipping(destination, weightKg);
    const quoteSource: ArtistShippingQuoteSource = fedexQuote ? 'fedex' : 'heuristic';

    const baseShipping = fedexQuote
      ? fedexQuote.cost
      : calculateBaseShipping(destination, config.shipping_handling_time);

    const insuranceCost = config.shipping_insurance_required
      ? calculateInsuranceCost(artworkValue, config.shipping_insurance_amount)
      : 0;

    const packagingCost = calculatePackagingCost(
      config.packaging_type || 'art_specialized',
      artworkValue
    );

    const specialHandlingCost = calculateSpecialHandlingCost(config);
    const totalShipping = baseShipping + insuranceCost + packagingCost + specialHandlingCost;

    const heuristicDays = config.shipping_handling_time + getDeliveryDays(destination);
    const estimatedDeliveryDays = fedexQuote?.estimatedDays
      ? Math.max(heuristicDays, fedexQuote.estimatedDays + config.shipping_handling_time)
      : heuristicDays;

    const carrierRecommendations = getRecommendedCarriers(config, destination, quoteSource);

    return {
      base_shipping: baseShipping,
      insurance_cost: insuranceCost,
      packaging_cost: packagingCost,
      special_handling_cost: specialHandlingCost,
      total_shipping: totalShipping,
      currency: 'XOF',
      estimated_delivery_days: estimatedDeliveryDays,
      carrier_recommendations: carrierRecommendations,
      quote_source: quoteSource,
      fedex_service_name: fedexQuote?.serviceName,
    };
  } catch (error) {
    logger.error('Error calculating artist shipping', { error, productId });
    throw error;
  }
}

function calculateBaseShipping(
  destination: { country: string; city?: string },
  handlingTime: number
): number {
  const baseRates: Record<string, number> = {
    SN: 15000,
    CI: 15000,
    ML: 20000,
    BF: 20000,
    BJ: 18000,
    TG: 18000,
    NE: 25000,
    FR: 35000,
    BE: 35000,
    CH: 40000,
    DEFAULT: 30000,
  };

  const rate = baseRates[destination.country] || baseRates.DEFAULT;
  return rate + handlingTime * 1000;
}

function calculateInsuranceCost(artworkValue: number, customAmount?: number): number {
  const insuredValue = customAmount || artworkValue;
  return Math.ceil(insuredValue * 0.02);
}

function calculatePackagingCost(packagingType: string, artworkValue: number): number {
  const packagingRates: Record<string, number> = {
    standard: 5000,
    art_specialized: 15000,
    museum_grade: 30000,
  };

  const baseCost = packagingRates[packagingType] || packagingRates.standard;
  if (artworkValue > 1000000) return baseCost * 2;
  return baseCost;
}

function calculateSpecialHandlingCost(config: ArtistShippingConfig): number {
  let cost = 0;
  if (config.shipping_fragile) cost += 5000;
  if (config.temperature_controlled) cost += 10000;
  if (config.humidity_controlled) cost += 10000;
  if (config.requires_signature) cost += 2000;
  return cost;
}

function getRecommendedCarriers(
  config: ArtistShippingConfig,
  destination: { country: string },
  quoteSource: ArtistShippingQuoteSource
): string[] {
  const carriers: string[] = [];

  if (quoteSource === 'fedex') {
    carriers.push('FedEx');
  }

  if (config.shipping_fragile || config.shipping_insurance_required) {
    carriers.push('DHL Express', 'FedEx Art Services');
  }

  if (destination.country !== 'SN' && destination.country !== 'BF') {
    if (!carriers.includes('FedEx')) carriers.push('DHL', 'FedEx', 'UPS');
  } else {
    carriers.push('Chronopost', 'DHL');
  }

  return [...new Set(carriers)];
}

function getDeliveryDays(destination: { country: string }): number {
  const deliveryDays: Record<string, number> = {
    SN: 2,
    CI: 3,
    ML: 4,
    BF: 4,
    FR: 5,
    BE: 5,
    CH: 6,
    DEFAULT: 7,
  };
  return deliveryDays[destination.country] || deliveryDays.DEFAULT;
}

export function validateArtistShippingConfig(config: Partial<ArtistShippingConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.requires_shipping === true) {
    if (config.shipping_handling_time && config.shipping_handling_time < 1) {
      errors.push("Le temps de préparation doit être d'au moins 1 jour");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
