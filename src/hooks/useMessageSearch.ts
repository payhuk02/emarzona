/**
 * Hook pour la recherche full-text dans les messages
 * Date: 1 Février 2025
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { Message } from '@/types/advanced-features';

export interface MessageSearchOptions {
  /** ID de la conversation */
  conversationId?: string;
  /** Requête de recherche */
  query: string;
  /** Limite de résultats */
  limit?: number;
  /** Filtres additionnels */
  filters?: {
    sender_type?: 'customer' | 'store' | 'admin';
    message_type?: 'text' | 'image' | 'video' | 'file';
    dateFrom?: Date;
    dateTo?: Date;
  };
}

export interface MessageSearchResult {
  messages: Message[];
  total: number;
  query: string;
}

/**
 * Hook pour rechercher des messages dans une conversation
 * 
 * @example
 * const { searchMessages, results, isSearching } = useMessageSearch();
 * 
 * const handleSearch = async () => {
 *   await searchMessages({
 *     conversationId: 'conv-123',
 *     query: 'livraison',
 *   });
 * };
 */
export function useMessageSearch() {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MessageSearchResult | null>(null);

  /**
   * Rechercher des messages
   */
  const searchMessages = useCallback(async (options: MessageSearchOptions): Promise<MessageSearchResult | null> => {
    const {
      conversationId,
      query,
      limit = 50,
      filters,
    } = options;

    if (!query.trim()) {
      setResults(null);
      return null;
    }

    setIsSearching(true);

    try {
      let  searchQuery= supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (name, avatar_url),
          attachments:message_attachments (*)
        `, { count: 'exact' })
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filtrer par conversation si spécifié
      if (conversationId) {
        searchQuery = searchQuery.eq('conversation_id', conversationId);
      }

      // Appliquer les filtres additionnels
      if (filters?.sender_type) {
        searchQuery = searchQuery.eq('sender_type', filters.sender_type);
      }
      if (filters?.message_type) {
        searchQuery = searchQuery.eq('message_type', filters.message_type);
      }
      if (filters?.dateFrom) {
        searchQuery = searchQuery.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        searchQuery = searchQuery.lte('created_at', filters.dateTo.toISOString());
      }

      const { data, error, count } = await searchQuery;

      if (error) throw error;

      const  result: MessageSearchResult = {
        messages: (data || []) as Message[],
        total: count || 0,
        query,
      };

      setResults(result);

      if (import.meta.env.DEV) {
        logger.info('Message search completed', {
          query,
          conversationId,
          resultsCount: result.messages.length,
          total: result.total,
        });
      }

      return result;
    } catch ( _error: any) {
      logger.error('Error searching messages', {
        error: error.message,
        query,
        conversationId,
      });

      toast({
        title: 'Erreur de recherche',
        description: error.message || 'Impossible d\'effectuer la recherche',
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  /**
   * Réinitialiser les résultats de recherche
   */
  const clearSearch = useCallback(() => {
    setResults(null);
  }, []);

  return {
    searchMessages,
    results,
    isSearching,
    clearSearch,
  };
}







