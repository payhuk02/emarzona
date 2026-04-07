/**
 * Hooks pour la gestion des portfolios et galeries d'artistes
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ArtistPortfolio {
  id: string;
  artist_product_id: string;
  store_id: string;
  portfolio_name: string;
  portfolio_slug: string;
  portfolio_description?: string;
  portfolio_bio?: string;
  portfolio_image_url?: string;
  portfolio_links?: Record<string, string>;
  is_public: boolean;
  is_featured: boolean;
  display_order: number;
  total_artworks: number;
  total_views: number;
  total_likes: number;
  created_at: string;
  updated_at: string;
}

export interface ArtistGallery {
  id: string;
  portfolio_id: string;
  gallery_name: string;
  gallery_slug: string;
  gallery_description?: string;
  gallery_cover_image_url?: string;
  gallery_category?: string;
  gallery_tags?: string[];
  is_public: boolean;
  display_order: number;
  total_artworks: number;
  total_views: number;
  created_at: string;
  updated_at: string;
}

export interface GalleryArtwork {
  id: string;
  gallery_id: string;
  product_id: string;
  artist_product_id: string;
  artwork_title?: string;
  artwork_description?: string;
  artwork_image_url?: string;
  is_featured: boolean;
  display_order: number;
  added_at: string;
}

/**
 * Hook pour récupérer un portfolio par ID
 */
export const useArtistPortfolio = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['artist-portfolio', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return null;

      const { data, error } = await supabase
        .from('artist_portfolios')
        .select(`
          *,
          artist_products (
            id,
            artist_name,
            artist_type,
            artist_bio
          )
        `)
        .eq('id', portfolioId)
        .single();

      if (error) {
        logger.error('Error fetching portfolio', { error, portfolioId });
        throw error;
      }

      return data as ArtistPortfolio & {
        artist_products: any;
      };
    },
    enabled: !!portfolioId,
  });
};

/**
 * Hook pour récupérer un portfolio par slug
 */
export const useArtistPortfolioBySlug = (slug: string | undefined, storeId?: string) => {
  return useQuery({
    queryKey: ['artist-portfolio-slug', slug, storeId],
    queryFn: async () => {
      if (!slug) return null;

      let  query= supabase
        .from('artist_portfolios')
        .select(`
          *,
          artist_products (
            id,
            artist_name,
            artist_type,
            artist_bio,
            artist_website,
            artist_social_links
          )
        `)
        .eq('portfolio_slug', slug)
        .eq('is_public', true);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        logger.error('Error fetching portfolio by slug', { error, slug });
        throw error;
      }

      return data as ArtistPortfolio & {
        artist_products: any;
      };
    },
    enabled: !!slug,
  });
};

/**
 * Hook pour récupérer les portfolios d'un store
 */
export const useStorePortfolios = (storeId: string | undefined, options?: {
  featuredOnly?: boolean;
  publicOnly?: boolean;
}) => {
  return useQuery({
    queryKey: ['store-portfolios', storeId, options],
    queryFn: async () => {
      if (!storeId) return [];

      let  query= supabase
        .from('artist_portfolios')
        .select('*')
        .eq('store_id', storeId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      if (options?.publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching store portfolios', { error, storeId });
        throw error;
      }

      return (data || []) as ArtistPortfolio[];
    },
    enabled: !!storeId,
  });
};

/**
 * Hook pour récupérer les galeries d'un portfolio
 */
export const usePortfolioGalleries = (portfolioId: string | undefined, options?: {
  category?: string;
  publicOnly?: boolean;
}) => {
  return useQuery({
    queryKey: ['portfolio-galleries', portfolioId, options],
    queryFn: async () => {
      if (!portfolioId) return [];

      let  query= supabase
        .from('artist_galleries')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('gallery_category', options.category);
      }

      if (options?.publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching portfolio galleries', { error, portfolioId });
        throw error;
      }

      return (data || []) as ArtistGallery[];
    },
    enabled: !!portfolioId,
  });
};

/**
 * Hook pour récupérer les œuvres d'une galerie
 */
export const useGalleryArtworks = (galleryId: string | undefined, options?: {
  featuredOnly?: boolean;
}) => {
  return useQuery({
    queryKey: ['gallery-artworks', galleryId, options],
    queryFn: async () => {
      if (!galleryId) return [];

      let  query= supabase
        .from('artist_gallery_artworks')
        .select(`
          *,
          products (
            id,
            name,
            slug,
            image_url,
            price,
            currency
          ),
          artist_products (
            id,
            artwork_title,
            artwork_year,
            artwork_medium
          )
        `)
        .eq('gallery_id', galleryId)
        .order('display_order', { ascending: true })
        .order('added_at', { ascending: false });

      if (options?.featuredOnly) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching gallery artworks', { error, galleryId });
        throw error;
      }

      return (data || []) as GalleryArtwork[];
    },
    enabled: !!galleryId,
  });
};

/**
 * Hook pour créer un portfolio
 */
export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      artist_product_id: string;
      store_id: string;
      portfolio_name: string;
      portfolio_description?: string;
      portfolio_bio?: string;
      portfolio_image_url?: string;
      portfolio_links?: Record<string, string>;
      is_public?: boolean;
    }) => {
      // Générer le slug
      const { data: slugData, error: slugError } = await supabase.rpc(
        'generate_portfolio_slug',
        {
          portfolio_name: data.portfolio_name,
          store_id: data.store_id,
        }
      );

      if (slugError) {
        throw new Error(`Erreur génération slug: ${slugError.message}`);
      }

      const { data: portfolio, error } = await supabase
        .from('artist_portfolios')
        .insert({
          ...data,
          portfolio_slug: slugData,
          is_public: data.is_public ?? true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating portfolio', { error });
        throw error;
      }

      return portfolio as ArtistPortfolio;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['store-portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['artist-portfolio', data.id] });
      
      toast({
        title: '✅ Portfolio créé',
        description: 'Votre portfolio a été créé avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du portfolio.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour créer une galerie
 */
export const useCreateGallery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      portfolio_id: string;
      gallery_name: string;
      gallery_description?: string;
      gallery_cover_image_url?: string;
      gallery_category?: string;
      gallery_tags?: string[];
      is_public?: boolean;
    }) => {
      // Générer le slug
      const { data: slugData, error: slugError } = await supabase.rpc(
        'generate_gallery_slug',
        {
          gallery_name: data.gallery_name,
          portfolio_id: data.portfolio_id,
        }
      );

      if (slugError) {
        throw new Error(`Erreur génération slug: ${slugError.message}`);
      }

      const { data: gallery, error } = await supabase
        .from('artist_galleries')
        .insert({
          ...data,
          gallery_slug: slugData,
          is_public: data.is_public ?? true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating gallery', { error });
        throw error;
      }

      return gallery as ArtistGallery;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-galleries'] });
      queryClient.invalidateQueries({ queryKey: ['gallery', data.id] });
      
      toast({
        title: '✅ Galerie créée',
        description: 'Votre galerie a été créée avec succès.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la galerie.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour ajouter une œuvre à une galerie
 */
export const useAddArtworkToGallery = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      gallery_id: string;
      product_id: string;
      artist_product_id: string;
      artwork_title?: string;
      artwork_description?: string;
      artwork_image_url?: string;
      is_featured?: boolean;
    }) => {
      const { data: artwork, error } = await supabase
        .from('artist_gallery_artworks')
        .insert({
          ...data,
          is_featured: data.is_featured ?? false,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding artwork to gallery', { error });
        throw error;
      }

      return artwork as GalleryArtwork;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gallery-artworks'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-galleries'] });
      
      toast({
        title: '✅ Œuvre ajoutée',
        description: 'L\'œuvre a été ajoutée à la galerie.',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue lors de l\'ajout de l\'œuvre.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour enregistrer une vue de portfolio
 */
export const useTrackPortfolioView = () => {
  return useMutation({
    mutationFn: async (portfolioId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Générer un session ID si utilisateur anonyme
      let  sessionId: string | null = null;
      if (!user) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const { error } = await supabase
        .from('artist_portfolio_views')
        .insert({
          portfolio_id: portfolioId,
          user_id: user?.id || null,
          session_id: sessionId,
        });

      if (error) {
        logger.error('Error tracking portfolio view', { error, portfolioId });
        // Ne pas throw pour ne pas bloquer l'utilisateur
      }
    },
  });
};

/**
 * Hook pour liker/unliker un portfolio
 */
export const useTogglePortfolioLike = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ portfolioId, isLiked }: { portfolioId: string; isLiked: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Vous devez être connecté pour liker un portfolio');
      }

      if (isLiked) {
        // Retirer le like
        const { error } = await supabase
          .from('artist_portfolio_likes')
          .delete()
          .eq('portfolio_id', portfolioId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Ajouter le like
        const { error } = await supabase
          .from('artist_portfolio_likes')
          .insert({
            portfolio_id: portfolioId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artist-portfolio', variables.portfolioId] });
      queryClient.invalidateQueries({ queryKey: ['store-portfolios'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier si l'utilisateur a liké un portfolio
 */
export const usePortfolioLikeStatus = (portfolioId: string | undefined) => {
  return useQuery({
    queryKey: ['portfolio-like-status', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('artist_portfolio_likes')
        .select('id')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking like status', { error });
        return false;
      }

      return !!data;
    },
    enabled: !!portfolioId,
  });
};







