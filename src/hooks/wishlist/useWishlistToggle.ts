/**
 * Hook unifié pour gérer l'ajout/suppression de produits dans la wishlist
 * Date: 2025-01-28
 * 
 * Remplace le code dupliqué dans les pages de détail produit
 * Utilise la table user_favorites (table principale)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { logger } from '@/lib/logger';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook pour gérer l'état et le toggle de wishlist pour un produit
 * 
 * @param productId - ID du produit à gérer
 * @returns { isInWishlist, toggle, isLoading } - État et fonction de toggle
 */
export const useWishlistToggle = (productId: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { toggleFavorite, isFavorite } = useMarketplaceFavorites();
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si le produit est dans la wishlist
  const isInWishlist = productId ? isFavorite(productId) : false;

  /**
   * Toggle l'état de wishlist du produit
   */
  const toggle = async () => {
    if (!productId) {
      logger.warn('useWishlistToggle: productId is undefined');
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Authentification requise',
        description: 'Veuillez vous connecter pour ajouter à la wishlist',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      await toggleFavorite(productId);
      // Le toast est géré par useMarketplaceFavorites
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la gestion de la wishlist', { error, productId });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de modifier la wishlist',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInWishlist,
    toggle,
    isLoading,
  };
};

