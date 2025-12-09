/**
 * Hooks pour la gestion des ventes aux enchères d'œuvres d'artistes
 * Date: 31 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ArtistProductAuction {
  id: string;
  artist_product_id: string;
  store_id: string;
  auction_title: string;
  auction_description?: string;
  auction_slug: string;
  start_date: string;
  end_date: string;
  extended_end_date?: string;
  starting_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  current_bid: number;
  minimum_bid_increment: number;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled' | 'sold';
  total_bids: number;
  unique_bidders: number;
  views_count: number;
  allow_automatic_extension: boolean;
  extension_minutes: number;
  require_verification: boolean;
  created_at: string;
  updated_at: string;
  artist_products?: {
    id: string;
    artist_name: string;
    artwork_title: string;
    product_id: string;
    products?: {
      id: string;
      name: string;
      image_url?: string;
      price: number;
    };
  };
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bid_amount: number;
  currency: string;
  bid_type: 'manual' | 'auto' | 'buy_now';
  max_bid_amount?: number;
  is_proxy_bid: boolean;
  status: 'pending' | 'active' | 'outbid' | 'winning' | 'cancelled';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  bidder?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

export interface AuctionWatchlist {
  id: string;
  auction_id: string;
  user_id: string;
  notify_on_new_bid: boolean;
  notify_on_ending_soon: boolean;
  notify_on_ending: boolean;
  created_at: string;
}

/**
 * Récupérer toutes les enchères actives
 */
export function useActiveAuctions(storeId?: string) {
  return useQuery({
    queryKey: ['auctions', 'active', storeId],
    queryFn: async () => {
      let query = supabase
        .from('artist_product_auctions')
        .select(`
          *,
          artist_products (
            id,
            artist_name,
            artwork_title,
            product_id,
            products (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .eq('status', 'active')
        .order('end_date', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching active auctions', { error });
        throw error;
      }

      return data as ArtistProductAuction[];
    },
  });
}

/**
 * Récupérer une enchère par ID
 */
export function useAuction(auctionId: string) {
  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_product_auctions')
        .select(`
          *,
          artist_products (
            id,
            artist_name,
            artwork_title,
            product_id,
            products (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .eq('id', auctionId)
        .single();

      if (error) {
        logger.error('Error fetching auction', { error });
        throw error;
      }

      return data as ArtistProductAuction;
    },
    enabled: !!auctionId,
  });
}

/**
 * Récupérer une enchère par slug
 */
export function useAuctionBySlug(slug: string) {
  return useQuery({
    queryKey: ['auction', 'slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_product_auctions')
        .select(`
          *,
          artist_products (
            id,
            artist_name,
            artwork_title,
            product_id,
            products (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .eq('auction_slug', slug)
        .single();

      if (error) {
        logger.error('Error fetching auction by slug', { error });
        throw error;
      }

      return data as ArtistProductAuction;
    },
    enabled: !!slug,
  });
}

/**
 * Récupérer les offres d'une enchère
 */
export function useAuctionBids(auctionId: string) {
  return useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_bids')
        .select(`
          *,
          bidder:bidder_id (
            id,
            email,
            user_metadata
          )
        `)
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching auction bids', { error });
        throw error;
      }

      return data as AuctionBid[];
    },
    enabled: !!auctionId,
  });
}

/**
 * Récupérer les enchères d'un store
 */
export function useStoreAuctions(storeId: string) {
  return useQuery({
    queryKey: ['store-auctions', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_product_auctions')
        .select(`
          *,
          artist_products (
            id,
            artist_name,
            artwork_title,
            product_id,
            products (
              id,
              name,
              image_url,
              price
            )
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store auctions', { error });
        throw error;
      }

      return data as ArtistProductAuction[];
    },
    enabled: !!storeId,
  });
}

/**
 * Créer une enchère
 */
export function useCreateAuction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auctionData: {
      artist_product_id: string;
      store_id: string;
      auction_title: string;
      auction_description?: string;
      start_date: string;
      end_date: string;
      starting_price: number;
      reserve_price?: number;
      buy_now_price?: number;
      minimum_bid_increment?: number;
      allow_automatic_extension?: boolean;
      extension_minutes?: number;
      require_verification?: boolean;
    }) => {
      // Générer le slug
      const { data: slugData } = await supabase.rpc('generate_auction_slug', {
        title: auctionData.auction_title,
      });

      const { data, error } = await supabase
        .from('artist_product_auctions')
        .insert({
          ...auctionData,
          auction_slug: slugData || auctionData.auction_title.toLowerCase().replace(/\s+/g, '-'),
          status: 'draft',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating auction', { error });
        throw error;
      }

      return data as ArtistProductAuction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['store-auctions'] });
      toast({
        title: '✅ Enchère créée',
        description: 'L\'enchère a été créée avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de créer l\'enchère';
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Placer une offre
 */
export function usePlaceBid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bidData: {
      auction_id: string;
      bid_amount: number;
      bid_type?: 'manual' | 'auto' | 'buy_now';
      max_bid_amount?: number;
    }) => {
      const { data, error } = await supabase.rpc('place_auction_bid', {
        p_auction_id: bidData.auction_id,
        p_bidder_id: (await supabase.auth.getUser()).data.user?.id,
        p_bid_amount: bidData.bid_amount,
        p_bid_type: bidData.bid_type || 'manual',
        p_max_bid_amount: bidData.max_bid_amount || null,
      });

      if (error) {
        logger.error('Error placing bid', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auction_id] });
      queryClient.invalidateQueries({ queryKey: ['auction-bids', variables.auction_id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      toast({
        title: '✅ Offre placée',
        description: 'Votre offre a été enregistrée avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de placer l\'offre',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Enchère proxy (enchère automatique jusqu'à un montant maximum)
 */
export function useProxyBid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      auctionId,
      maxBidAmount,
    }: {
      auctionId: string;
      maxBidAmount: number;
    }) => {
      const { data, error } = await supabase.rpc('place_proxy_bid', {
        p_auction_id: auctionId,
        p_max_bid_amount: maxBidAmount,
      });

      if (error) {
        logger.error('Error placing proxy bid', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auction-bids', variables.auctionId] });
      toast({
        title: '✅ Enchère proxy activée',
        description: `Votre enchère proxy est active jusqu'à ${variables.maxBidAmount.toLocaleString('fr-FR')} XOF`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de placer l\'enchère proxy',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Ajouter/Retirer de la watchlist
 */
export function useToggleWatchlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ auction_id, add }: { auction_id: string; add: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      if (add) {
        const { data, error } = await supabase
          .from('auction_watchlist')
          .insert({
            auction_id,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) {
          logger.error('Error adding to watchlist', { error });
          throw error;
        }

        return data;
      } else {
        const { error } = await supabase
          .from('auction_watchlist')
          .delete()
          .eq('auction_id', auction_id)
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error removing from watchlist', { error });
          throw error;
        }

        return null;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction-watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['auction', variables.auction_id] });
      toast({
        title: variables.add ? '✅ Ajouté à la liste' : '✅ Retiré de la liste',
        description: variables.add
          ? 'L\'enchère a été ajoutée à votre liste de surveillance'
          : 'L\'enchère a été retirée de votre liste de surveillance',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier la liste de surveillance',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Vérifier si une enchère est dans la watchlist
 */
export function useWatchlistStatus(auctionId: string, userId: string) {
  return useQuery({
    queryKey: ['auction-watchlist', auctionId, userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase
        .from('auction_watchlist')
        .select('id')
        .eq('auction_id', auctionId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking watchlist status', { error });
        return false;
      }

      return !!data;
    },
    enabled: !!auctionId && !!userId,
  });
}

/**
 * Récupérer la watchlist d'un utilisateur
 */
export function useUserWatchlist(userId: string) {
  return useQuery({
    queryKey: ['user-watchlist', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auction_watchlist')
        .select(`
          *,
          auctions:auction_id (
            *,
            artist_products (
              id,
              artist_name,
              artwork_title,
              product_id,
              products (
                id,
                name,
                image_url,
                price
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user watchlist', { error });
        throw error;
      }

      return data as Array<AuctionWatchlist & { auctions?: ArtistProductAuction }>;
    },
    enabled: !!userId,
  });
}

/**
 * Mettre à jour les préférences de watchlist
 */
export function useUpdateWatchlistPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      auctionId,
      ...preferences
    }: {
      auctionId: string;
      notify_on_new_bid?: boolean;
      notify_on_ending_soon?: boolean;
      notify_on_ending?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('auction_watchlist')
        .update(preferences)
        .eq('auction_id', auctionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating watchlist preferences', { error });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['auction-watchlist'] });
      toast({
        title: 'Préférences mises à jour',
        description: 'Vos préférences de notification ont été mises à jour.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour les préférences.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Retirer une enchère de la watchlist
 */
export function useRemoveFromWatchlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auctionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('auction_watchlist')
        .delete()
        .eq('auction_id', auctionId)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error removing from watchlist', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['auction-watchlist'] });
      toast({
        title: 'Retiré de la watchlist',
        description: 'L\'enchère a été retirée de votre watchlist.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer de la watchlist.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour une enchère
 */
/**
 * Supprimer une enchère
 */
export function useDeleteAuction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auctionId: string) => {
      const { error } = await supabase
        .from('artist_product_auctions')
        .delete()
        .eq('id', auctionId);

      if (error) {
        logger.error('Error deleting auction', { error });
        throw error;
      }
    },
    onSuccess: (_, auctionId) => {
      queryClient.invalidateQueries({ queryKey: ['store-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      toast({
        title: 'Enchère supprimée',
        description: 'L\'enchère a été supprimée avec succès.',
      });
    },
    onError: (error) => {
      logger.error('Error deleting auction', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'enchère.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAuction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ArtistProductAuction> & { id: string }) => {
      const { data, error } = await supabase
        .from('artist_product_auctions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating auction', { error });
        throw error;
      }

      return data as ArtistProductAuction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['auction', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['store-auctions'] });
      toast({
        title: '✅ Enchère mise à jour',
        description: 'L\'enchère a été mise à jour avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour l\'enchère',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Terminer une enchère
 */
export function useEndAuction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auctionId: string) => {
      const { data, error } = await supabase.rpc('end_auction', {
        p_auction_id: auctionId,
      });

      if (error) {
        logger.error('Error ending auction', { error });
        throw error;
      }

      return data;
    },
    onSuccess: (_, auctionId) => {
      queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['store-auctions'] });
      toast({
        title: '✅ Enchère terminée',
        description: 'L\'enchère a été terminée avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de terminer l\'enchère',
        variant: 'destructive',
      });
    },
  });
}

