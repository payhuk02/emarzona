/**
 * useDisputesOptimized Hook
 * Date: 28 Janvier 2025
 * 
 * Hook optimisé pour les litiges avec React Query
 * Migration de useState vers React Query pour meilleure gestion d'erreurs et cache
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { shouldRetryError, getRetryDelay } from '@/lib/error-handling';
import { useToast } from '@/hooks/use-toast';
import type { Dispute, DisputeStatus, InitiatorType } from '@/types/advanced-features';

export interface DisputesFilters {
  status?: DisputeStatus;
  initiator_type?: InitiatorType;
  assigned_admin_id?: string;
  priority?: string;
  search?: string;
}

export interface DisputeStats {
  total: number;
  open: number;
  investigating: number;
  waiting_customer: number;
  waiting_seller: number;
  resolved: number;
  closed: number;
  unassigned: number;
  avgResolutionTime?: number; // en heures
}

type SortColumn = 'created_at' | 'status' | 'subject' | 'order_id';
type SortDirection = 'asc' | 'desc';

export interface UseDisputesOptions {
  filters?: DisputesFilters;
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortDirection?: SortDirection;
}

export interface DisputesResponse {
  disputes: Dispute[];
  stats: DisputeStats | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook optimisé pour récupérer les litiges avec React Query
 */
export const useDisputesOptimized = (options: UseDisputesOptions = {}) => {
  const {
    filters = {},
    page = 1,
    pageSize = 20,
    sortBy = 'created_at',
    sortDirection = 'desc',
  } = options;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query pour les disputes
  const disputesQuery = useQuery<DisputesResponse>({
    queryKey: ['disputes-optimized', filters, page, pageSize, sortBy, sortDirection],
    queryFn: async () => {
      try {
        // Calculer l'offset pour la pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from('disputes')
          .select('*', { count: 'exact' })
          .order(sortBy, { ascending: sortDirection === 'asc' });

        // Appliquer les filtres
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.initiator_type) {
          query = query.eq('initiator_type', filters.initiator_type);
        }
        if (filters.assigned_admin_id) {
          query = query.eq('assigned_admin_id', filters.assigned_admin_id);
        }
        if (filters.priority) {
          query = query.eq('priority', filters.priority);
        }

        // Recherche textuelle
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim();
          query = query.or(
            `subject.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`
          );
        }

        // Appliquer la pagination
        query = query.range(from, to);

        const { data, error: queryError, count } = await query;

        if (queryError) {
          // Vérifier si c'est une erreur de table inexistante
          if (queryError.message.includes('relation "public.disputes" does not exist')) {
            const errorMsg = "La table 'disputes' n'existe pas. Veuillez exécuter la migration SQL.";
            logger.warn(errorMsg);
            return {
              disputes: [],
              stats: null,
              total: 0,
              page,
              pageSize,
              totalPages: 0,
            };
          }
          throw queryError;
        }

        const disputes = (data || []) as Dispute[];
        const total = count || 0;
        const totalPages = Math.ceil(total / pageSize);

        // Calculer les statistiques
        const stats = await calculateStats(disputes);

        return {
          disputes,
          stats,
          total,
          page,
          pageSize,
          totalPages,
        };
      } catch (error: unknown) {
        logger.error('Erreur dans useDisputesOptimized', {
          error: error instanceof Error ? error.message : String(error),
          filters,
          page,
          pageSize,
        });
        throw error;
      }
    },
    retry: (failureCount, error) => shouldRetryError(error, failureCount),
    retryDelay: (attemptIndex) => getRetryDelay(attemptIndex),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    disputes: disputesQuery.data?.disputes || [],
    stats: disputesQuery.data?.stats || null,
    total: disputesQuery.data?.total || 0,
    page: disputesQuery.data?.page || page,
    pageSize: disputesQuery.data?.pageSize || pageSize,
    totalPages: disputesQuery.data?.totalPages || 0,
    isLoading: disputesQuery.isLoading,
    error: disputesQuery.error as Error | null,
    refetch: disputesQuery.refetch,
  };
};

/**
 * Calculer les statistiques des disputes
 * OPTIMISÉ: Utilise une fonction SQL pour calculer les stats directement en base
 * Évite de charger tous les disputes en mémoire
 */
async function calculateStats(disputes: Dispute[]): Promise<DisputeStats> {
  try {
    // OPTIMISATION: Utiliser la fonction SQL get_dispute_stats() si disponible
    // Sinon, fallback sur requête simple
    const { data: statsData, error: rpcError } = await supabase
      .rpc('get_dispute_stats');

    if (!rpcError && statsData) {
      // Convertir le JSONB en DisputeStats
      return {
        total: statsData.total || 0,
        open: statsData.open || 0,
        investigating: statsData.investigating || 0,
        waiting_customer: statsData.waiting_customer || 0,
        waiting_seller: statsData.waiting_seller || 0,
        resolved: statsData.resolved || 0,
        closed: statsData.closed || 0,
        unassigned: statsData.unassigned || 0,
        avgResolutionTime: statsData.avgResolutionTime || undefined,
      };
    }

    // Fallback: Utiliser une seule requête avec select pour obtenir seulement les champs nécessaires
    const { data: allDisputes, error } = await supabase
      .from('disputes')
      .select('status, assigned_admin_id, created_at, resolved_at');

    if (error) {
      logger.warn('Erreur lors du calcul des stats', { error: error.message });
      // Fallback: Calculer avec les disputes de la page actuelle (moins précis mais fonctionnel)
      return calculateStatsFromDisputes(disputes);
    }

    // Calculer les stats depuis tous les disputes (une seule requête)
    return calculateStatsFromDisputes(allDisputes || []);
  } catch (error) {
    logger.error('Erreur dans calculateStats', { error });
    // Fallback: Calculer avec les disputes de la page actuelle
    return calculateStatsFromDisputes(disputes);
  }
}

/**
 * Calculer les stats à partir d'un tableau de disputes
 */
function calculateStatsFromDisputes(disputes: any[]): DisputeStats {
  const total = disputes.length;
  const open = disputes.filter((d) => d.status === 'open').length;
  const investigating = disputes.filter((d) => d.status === 'investigating').length;
  const waiting_customer = disputes.filter((d) => d.status === 'waiting_customer').length;
  const waiting_seller = disputes.filter((d) => d.status === 'waiting_seller').length;
  const resolved = disputes.filter((d) => d.status === 'resolved').length;
  const closed = disputes.filter((d) => d.status === 'closed').length;
  const unassigned = disputes.filter((d) => !d.assigned_admin_id).length;

  // Calculer le temps moyen de résolution
  const resolvedDisputes = disputes.filter((d) => d.resolved_at);
  let avgResolutionTime: number | undefined;

  if (resolvedDisputes.length > 0) {
    const totalHours = resolvedDisputes.reduce((sum, dispute) => {
      const created = new Date(dispute.created_at);
      const resolved = new Date(dispute.resolved_at);
      const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    avgResolutionTime = Math.round(totalHours / resolvedDisputes.length);
  }

  return {
    total,
    open,
    investigating,
    waiting_customer,
    waiting_seller,
    resolved,
    closed,
    unassigned,
    avgResolutionTime,
  };
}

