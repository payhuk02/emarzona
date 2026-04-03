/**
 * Hook pour le Shipping Spécialisé des Œuvres d'Artiste
 * Date: 31 Janvier 2025
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import {
  calculateArtistShipping,
  validateArtistShippingConfig,
  type ArtistShippingConfig,
  type ArtistShippingQuote,
} from '@/lib/shipping/artist-shipping';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * Hook pour calculer le shipping d'une œuvre
 */
export function useCalculateArtistShipping(
  productId: string | null,
  destination: {
    country: string;
    city?: string;
    postal_code?: string;
  } | null,
  artworkValue: number
) {
  return useQuery<ArtistShippingQuote>({
    queryKey: ['artist-shipping', productId, destination, artworkValue],
    queryFn: async () => {
      if (!productId || !destination) {
        throw new Error('Product ID and destination are required');
      }
      return calculateArtistShipping(productId, destination, artworkValue);
    },
    enabled: !!productId && !!destination && artworkValue > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour valider la configuration de shipping
 */
export function useValidateArtistShippingConfig() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (config: Partial<ArtistShippingConfig>) => {
      return validateArtistShippingConfig(config);
    },
    onError: (error) => {
      logger.error('Error validating artist shipping config', { error });
      toast({
        title: '❌ Erreur de validation',
        description: error instanceof Error ? error.message : 'Erreur lors de la validation',
        variant: 'destructive',
      });
    },
  });
}







