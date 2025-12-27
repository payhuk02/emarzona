/**
 * Utilitaires pour le géocodage d'adresses
 * Utilise Google Maps Geocoding API
 */

import { logger } from './logger';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  place_id: string;
}

export interface GeocodingError {
  error: string;
  message: string;
}

/**
 * Géocode une adresse complète en coordonnées GPS
 * @param address - Adresse complète à géocoder
 * @returns Résultat du géocodage ou erreur
 */
export async function geocodeAddress(
  address: string
): Promise<{ success: true; data: GeocodingResult } | { success: false; error: GeocodingError }> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    logger.warn('Google Maps API key not configured');
    return {
      success: false,
      error: {
        error: 'API_KEY_MISSING',
        message: 'Clé API Google Maps non configurée. Configurez VITE_GOOGLE_MAPS_API_KEY dans votre fichier .env',
      },
    };
  }

  if (!address || address.trim().length === 0) {
    return {
      success: false,
      error: {
        error: 'INVALID_ADDRESS',
        message: 'Adresse vide ou invalide',
      },
    };
  }

  try {
    // Construire l'URL de l'API Google Geocoding
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'ZERO_RESULTS') {
      return {
        success: false,
        error: {
          error: 'ZERO_RESULTS',
          message: 'Aucun résultat trouvé pour cette adresse',
        },
      };
    }

    if (data.status === 'REQUEST_DENIED') {
      return {
        success: false,
        error: {
          error: 'REQUEST_DENIED',
          message: 'Requête refusée. Vérifiez votre clé API Google Maps.',
        },
      };
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      return {
        success: false,
        error: {
          error: 'OVER_QUERY_LIMIT',
          message: 'Limite de requêtes Google Maps dépassée',
        },
      };
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return {
        success: false,
        error: {
          error: 'UNKNOWN_ERROR',
          message: `Erreur inconnue: ${data.status}`,
        },
      };
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      success: true,
      data: {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        address_components: result.address_components || [],
        place_id: result.place_id,
      },
    };
  } catch ( _error: unknown) {
    logger.error('Geocoding error', { error, address });
    return {
      success: false,
      error: {
        error: 'NETWORK_ERROR',
        message: error.message || 'Erreur réseau lors du géocodage',
      },
    };
  }
}

/**
 * Construit une adresse complète à partir des champs individuels
 */
export function buildFullAddress(
  addressLine1: string,
  addressLine2: string,
  city: string,
  stateProvince: string,
  postalCode: string,
  country: string
): string {
  const  parts: string[] = [];

  if (addressLine1) parts.push(addressLine1);
  if (addressLine2) parts.push(addressLine2);
  if (city) parts.push(city);
  if (stateProvince) parts.push(stateProvince);
  if (postalCode) parts.push(postalCode);
  if (country) parts.push(country);

  return parts.join(', ');
}







