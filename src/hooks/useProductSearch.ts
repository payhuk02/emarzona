/**
 * Hook pour recherche avancée de produits avec full-text search
 * Date : 31 Janvier 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface SearchFilters {
  category?: string | null;
  product_type?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_rating?: number | null;
  // Filtres spécifiques Artist
  artist_type?: string | null;
  edition_type?: string | null;
  certificate_of_authenticity?: boolean | null;
}

export interface SearchSuggestion {
  suggestion: string;
  suggestion_type: 'product' | 'category' | 'tag';
  count: number;
  relevance: number;
}

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number;
  promotional_price: number | null;
  currency: string;
  category: string | null;
  product_type: string | null;
  rating: number | null;
  reviews_count: number | null;
  purchases_count: number | null;
  store_id: string;
  store_name: string;
  store_slug: string;
  store_logo_url: string | null;
  rank: number;
  match_type: 'exact_name' | 'starts_with' | 'full_text' | 'partial';
}

/**
 * Hook pour rechercher des produits avec full-text search
 */
export function useProductSearch(
  searchQuery: string,
  filters: SearchFilters = {},
  options: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  const { limit = 20, offset = 0, enabled = true } = options;

  return useQuery<SearchResult[]>({
    queryKey: ['product-search', searchQuery, filters, limit, offset],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('search_products', {
          p_search_query: searchQuery.trim(),
          p_limit: limit,
          p_offset: offset,
          p_category: filters.category || null,
          p_product_type: filters.product_type || null,
          p_min_price: filters.min_price || null,
          p_max_price: filters.max_price || null,
          p_min_rating: filters.min_rating || null,
          // Filtres spécifiques Artist
          p_artist_type: filters.artist_type || null,
          p_edition_type: filters.edition_type || null,
          p_certificate_of_authenticity: filters.certificate_of_authenticity || null,
        });

        if (error) {
          logger.error('Error searching products:', error);
          throw error;
        }

        return (data || []) as SearchResult[];
      } catch (error) {
        logger.error('Error in useProductSearch:', error);
        return [];
      }
    },
    enabled: enabled && searchQuery.trim().length > 0,
    staleTime: 30 * 1000, // 30 secondes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook pour obtenir des suggestions de recherche (auto-complétion)
 */
export function useSearchSuggestions(query: string, limit: number = 10, enabled: boolean = true) {
  return useQuery<SearchSuggestion[]>({
    queryKey: ['search-suggestions', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      try {
        const { data, error } = await supabase.rpc('get_search_suggestions', {
          p_query: query.trim(),
          p_limit: limit,
        });

        if (error) {
          logger.error('Error getting search suggestions:', error);
          throw error;
        }

        return (data || []) as SearchSuggestion[];
      } catch (error) {
        logger.error('Error in useSearchSuggestions:', error);
        return [];
      }
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook pour obtenir les recherches populaires
 */
export function usePopularSearches(limit: number = 10, days: number = 30) {
  return useQuery<Array<{ query: string; count: number; last_searched: string }>>({
    queryKey: ['popular-searches', limit, days],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_popular_searches', {
          p_limit: limit,
          p_days: days,
        });

        if (error) {
          logger.error('Error getting popular searches:', error);
          throw error;
        }

        return (data || []) as Array<{ query: string; count: number; last_searched: string }>;
      } catch (error) {
        logger.error('Error in usePopularSearches:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook pour enregistrer une recherche dans l'historique
 */
export function useSaveSearchHistory() {
  return async (query: string, resultsCount: number = 0) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('search_history').insert({
        user_id: user.id,
        query: query.trim(),
        results_count: resultsCount,
      });
    } catch (error) {
      logger.error('Error saving search history:', error);
    }
  };
}

/**
 * Hook pour récupérer l'historique de recherche de l'utilisateur
 */
export function useSearchHistory(limit: number = 10) {
  return useQuery<Array<{ id: string; query: string; created_at: string }>>({
    queryKey: ['search-history', limit],
    queryFn: async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
          .from('search_history')
          .select('id, query, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          logger.error('Error fetching search history:', error);
          throw error;
        }

        return (data || []) as Array<{ id: string; query: string; created_at: string }>;
      } catch (error) {
        logger.error('Error in useSearchHistory:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
