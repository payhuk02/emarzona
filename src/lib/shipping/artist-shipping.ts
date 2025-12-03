/**
 * Système de Shipping Spécialisé pour Œuvres d'Artiste
 * Date: 31 Janvier 2025
 * 
 * Gestion du shipping spécialisé avec emballage, assurance, conditions de transport
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ArtistShippingConfig {
  requires_shipping: boolean;
  shipping_fragile: boolean;
  shipping_insurance_required: boolean;
  shipping_insurance_amount?: number;
  shipping_handling_time: number; // jours
  packaging_type?: 'standard' | 'art_specialized' | 'museum_grade';
  temperature_controlled?: boolean;
  humidity_controlled?: boolean;
  requires_signature?: boolean;
  special_instructions?: string;
}

export interface ArtistShippingQuote {
  base_shipping: number;
  insurance_cost: number;
  packaging_cost: number;
  special_handling_cost: number;
  total_shipping: number;
  currency: string;
  estimated_delivery_days: number;
  carrier_recommendations: string[];
}

/**
 * Calcule le coût de shipping spécialisé pour une œuvre d'artiste
 */
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
    // Récupérer la configuration de shipping de l'œuvre
    const { data: artistProduct, error } = await supabase
      .from('artist_products')
      .select('*')
      .eq('product_id', productId)
      .single();

    if (error || !artistProduct) {
      throw new Error('Artwork not found');
    }

    const config: ArtistShippingConfig = {
      requires_shipping: artistProduct.requires_shipping ?? true,
      shipping_fragile: artistProduct.shipping_fragile ?? false,
      shipping_insurance_required: artistProduct.shipping_insurance_required ?? false,
      shipping_insurance_amount: artistProduct.shipping_insurance_amount,
      shipping_handling_time: artistProduct.shipping_handling_time ?? 7,
      packaging_type: 'art_specialized', // Par défaut pour les œuvres
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
      };
    }

    // Coût de base (selon destination)
    const baseShipping = calculateBaseShipping(destination, config.shipping_handling_time);

    // Coût d'assurance (si requis)
    const insuranceCost = config.shipping_insurance_required
      ? calculateInsuranceCost(artworkValue, config.shipping_insurance_amount)
      : 0;

    // Coût d'emballage spécialisé
    const packagingCost = calculatePackagingCost(config.packaging_type || 'art_specialized', artworkValue);

    // Coût de manutention spéciale
    const specialHandlingCost = calculateSpecialHandlingCost(config);

    const totalShipping = baseShipping + insuranceCost + packagingCost + specialHandlingCost;

    // Recommandations de transporteurs
    const carrierRecommendations = getRecommendedCarriers(config, destination);

    return {
      base_shipping: baseShipping,
      insurance_cost: insuranceCost,
      packaging_cost: packagingCost,
      special_handling_cost: specialHandlingCost,
      total_shipping: totalShipping,
      currency: 'XOF',
      estimated_delivery_days: config.shipping_handling_time + getDeliveryDays(destination),
      carrier_recommendations: carrierRecommendations,
    };
  } catch (error) {
    logger.error('Error calculating artist shipping', { error, productId });
    throw error;
  }
}

/**
 * Calcule le coût de base du shipping
 */
function calculateBaseShipping(
  destination: { country: string; city?: string },
  handlingTime: number
): number {
  // Logique simplifiée - à améliorer avec vraies données transporteurs
  const baseRates: Record<string, number> = {
    // Afrique de l'Ouest
    'SN': 15000, // Sénégal
    'CI': 15000, // Côte d'Ivoire
    'ML': 20000, // Mali
    'BF': 20000, // Burkina Faso
    'BJ': 18000, // Bénin
    'TG': 18000, // Togo
    'NE': 25000, // Niger
    // Europe
    'FR': 35000,
    'BE': 35000,
    'CH': 40000,
    // Autres
    'DEFAULT': 30000,
  };

  const rate = baseRates[destination.country] || baseRates['DEFAULT'];
  return rate + (handlingTime * 1000); // Ajout pour temps de préparation
}

/**
 * Calcule le coût d'assurance
 */
function calculateInsuranceCost(artworkValue: number, customAmount?: number): number {
  const insuredValue = customAmount || artworkValue;
  // Taux d'assurance standard : 2% de la valeur assurée
  return Math.ceil(insuredValue * 0.02);
}

/**
 * Calcule le coût d'emballage spécialisé
 */
function calculatePackagingCost(packagingType: string, artworkValue: number): number {
  const packagingRates: Record<string, number> = {
    standard: 5000,
    art_specialized: 15000, // Emballage spécialisé pour art
    museum_grade: 30000, // Emballage musée (très sécurisé)
  };

  const baseCost = packagingRates[packagingType] || packagingRates.standard;

  // Ajout basé sur la valeur (emballage plus sécurisé pour œuvres de valeur)
  if (artworkValue > 1000000) {
    return baseCost * 2; // Double pour œuvres de grande valeur
  }

  return baseCost;
}

/**
 * Calcule le coût de manutention spéciale
 */
function calculateSpecialHandlingCost(config: ArtistShippingConfig): number {
  let cost = 0;

  if (config.shipping_fragile) {
    cost += 5000; // Frais fragile
  }

  if (config.temperature_controlled) {
    cost += 10000; // Contrôle température
  }

  if (config.humidity_controlled) {
    cost += 10000; // Contrôle humidité
  }

  if (config.requires_signature) {
    cost += 2000; // Signature requise
  }

  return cost;
}

/**
 * Obtient les transporteurs recommandés pour une œuvre
 */
function getRecommendedCarriers(
  config: ArtistShippingConfig,
  destination: { country: string }
): string[] {
  const carriers: string[] = [];

  // Pour les œuvres fragiles ou de valeur, recommander des transporteurs spécialisés
  if (config.shipping_fragile || config.shipping_insurance_required) {
    carriers.push('DHL Express'); // DHL a un service art spécialisé
    carriers.push('FedEx Art Services'); // FedEx a aussi un service art
  }

  // Pour les destinations internationales
  if (destination.country !== 'SN') {
    carriers.push('DHL', 'FedEx', 'UPS');
  } else {
    carriers.push('Chronopost', 'DHL');
  }

  return carriers;
}

/**
 * Obtient le nombre de jours de livraison estimé
 */
function getDeliveryDays(destination: { country: string }): number {
  const deliveryDays: Record<string, number> = {
    'SN': 2, // Sénégal (domestique)
    'CI': 3,
    'ML': 4,
    'BF': 4,
    'FR': 5,
    'BE': 5,
    'CH': 6,
    'DEFAULT': 7,
  };

  return deliveryDays[destination.country] || deliveryDays['DEFAULT'];
}

/**
 * Valide la configuration de shipping pour une œuvre
 */
export function validateArtistShippingConfig(config: Partial<ArtistShippingConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (config.requires_shipping === true) {
    if (config.shipping_insurance_required && !config.shipping_insurance_amount && !config.shipping_insurance_amount) {
      errors.push('Montant d\'assurance requis si l\'assurance est activée');
    }

    if (config.shipping_handling_time && config.shipping_handling_time < 1) {
      errors.push('Le temps de préparation doit être d\'au moins 1 jour');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

