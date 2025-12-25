/**
 * Hook pour gérer le partage de wishlist
 * Date: 27 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface WishlistShare {
  id: string;
  share_token: string;
  is_active: boolean;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

/**
 * Hook pour créer un lien de partage
 */
export const useCreateWishlistShare = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (expiresInDays: number = 30) => {
      const { data, error } = await supabase.rpc('create_wishlist_share', {
        p_expires_in_days: expiresInDays,
      });

      if (error) throw error;
      return data as string;
    },
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-share'] });
      toast({
        title: 'Lien de partage créé',
        description: 'Votre wishlist peut maintenant être partagée',
      });
      return token;
    },
    onError: (error: any) => {
      logger.error('Error creating wishlist share', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le lien de partage',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour récupérer le lien de partage actif
 */
export const useWishlistShare = () => {
  return useQuery({
    queryKey: ['wishlist-share'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('wishlist_shares')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, ce qui est OK
        logger.error('Error fetching wishlist share', { error });
        throw error;
      }

      return data as WishlistShare | null;
    },
  });
};

/**
 * Hook pour récupérer une wishlist partagée par token
 */
export const useSharedWishlist = (shareToken: string) => {
  return useQuery({
    queryKey: ['shared-wishlist', shareToken],
    queryFn: async () => {
      // Vérifier que le token est valide
      const { data: shareData, error: shareError } = await supabase
        .from('wishlist_shares')
        .select('user_id, is_active, expires_at')
        .eq('share_token', shareToken)
        .single();

      if (shareError || !shareData) {
        throw new Error('Lien de partage invalide ou expiré');
      }

      if (!shareData.is_active) {
        throw new Error('Ce lien de partage n\'est plus actif');
      }

      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        throw new Error('Ce lien de partage a expiré');
      }

      // Incrémenter le compteur de vues
      await supabase
        .from('wishlist_shares')
        .update({ view_count: shareData.view_count + 1 })
        .eq('share_token', shareToken);

      // Récupérer les produits de la wishlist
      const { data: favorites, error: favoritesError } = await supabase
        .from('user_favorites')
        .select(`
          product_id,
          created_at,
          products!inner (
            id,
            name,
            slug,
            description,
            price,
            promotional_price,
            currency,
            image_url,
            product_type,
            category,
            stores!inner (
              id,
              name,
              slug
            )
          )
        `)
        .eq('user_id', shareData.user_id)
        .order('created_at', { ascending: false });

      if (favoritesError) {
        logger.error('Error fetching shared wishlist products', { error: favoritesError });
        throw favoritesError;
      }

      return {
        share: shareData,
        products: favorites || [],
      };
    },
    enabled: !!shareToken,
  });
};

/**
 * Hook pour désactiver un lien de partage
 */
export const useDeactivateWishlistShare = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (shareToken: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('wishlist_shares')
        .update({ is_active: false })
        .eq('share_token', shareToken)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist-share'] });
      toast({
        title: 'Lien désactivé',
        description: 'Le lien de partage a été désactivé',
      });
    },
    onError: (error: any) => {
      logger.error('Error deactivating wishlist share', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de désactiver le lien',
        variant: 'destructive',
      });
    },
  });
};

