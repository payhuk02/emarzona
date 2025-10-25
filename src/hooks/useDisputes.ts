import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
import { Dispute, DisputeStatus, InitiatorType } from "@/types/advanced-features";
import { RealtimeChannel } from "@supabase/supabase-js";

interface DisputesFilters {
  status?: DisputeStatus;
  initiator_type?: InitiatorType;
  assigned_admin_id?: string;
  priority?: string;
  search?: string;
}

interface DisputeStats {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
  unassigned: number;
  avgResolutionTime?: number; // en heures
}

type SortColumn = 'created_at' | 'status' | 'subject' | 'order_id';
type SortDirection = 'asc' | 'desc';

interface UseDisputesOptions {
  filters?: DisputesFilters;
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortDirection?: SortDirection;
}

export const useDisputes = (options?: UseDisputesOptions) => {
  const filters = options?.filters;
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const sortBy = options?.sortBy || 'created_at';
  const sortDirection = options?.sortDirection || 'desc';
  
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // Récupérer les litiges
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Calculer l'offset pour la pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("disputes")
        .select("*", { count: "exact" })
        .order(sortBy, { ascending: sortDirection === 'asc' });

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.initiator_type) {
        query = query.eq("initiator_type", filters.initiator_type);
      }
      if (filters?.assigned_admin_id) {
        query = query.eq("assigned_admin_id", filters.assigned_admin_id);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }

      // Recherche textuelle (subject, description, order_id)
      if (filters?.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(`subject.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`);
      }

      // Appliquer la pagination
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        // Vérifier si c'est une erreur de table inexistante
        if (queryError.message.includes('relation "public.disputes" does not exist')) {
          const errorMsg = "La table 'disputes' n'existe pas. Veuillez exécuter la migration SQL.";
          setError(errorMsg);
          throw new Error(errorMsg);
        }
        throw queryError;
      }
      
      setDisputes(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      logger.error("Error fetching disputes:", error);
      setError(error.message || "Erreur lors du chargement des litiges");
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du chargement des litiges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, sortBy, sortDirection, toast]);

  // Récupérer les statistiques (OPTIMISÉ: 1 seule requête au lieu de 6)
  const fetchStats = useCallback(async () => {
    try {
      // Une seule requête pour récupérer tous les disputes
      const { data: allDisputes, error } = await supabase
        .from("disputes")
        .select("status, assigned_admin_id, created_at, resolved_at");

      if (error) throw error;

      // Calculs côté client (beaucoup plus rapide)
      const disputes = allDisputes || [];
      
      const total = disputes.length;
      const open = disputes.filter(d => d.status === 'open').length;
      const investigating = disputes.filter(d => d.status === 'investigating').length;
      const resolved = disputes.filter(d => d.status === 'resolved').length;
      const closed = disputes.filter(d => d.status === 'closed').length;
      const unassigned = disputes.filter(d => !d.assigned_admin_id).length;

      // Calculer le temps moyen de résolution
      const resolvedDisputes = disputes.filter(d => d.resolved_at);
      let avgResolutionTime: number | undefined;
      
      if (resolvedDisputes.length > 0) {
        const totalHours = resolvedDisputes.reduce((sum, dispute) => {
          const created = new Date(dispute.created_at);
          const resolved = new Date(dispute.resolved_at!);
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        avgResolutionTime = Math.round(totalHours / resolvedDisputes.length);
      }

      setStats({
        total,
        open,
        investigating,
        resolved,
        closed,
        unassigned,
        avgResolutionTime,
      });
    } catch (error: any) {
      logger.error("Error fetching dispute stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
    fetchStats();
  }, [fetchDisputes, fetchStats]);

  // Notifications en temps réel
  useEffect(() => {
    let channel: RealtimeChannel;

    const setupRealtimeSubscription = async () => {
      // S'abonner aux changements sur la table disputes
      channel = supabase
        .channel('disputes_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'disputes'
          },
          (payload) => {
            logger.info('Nouveau litige créé:', payload.new);
            const newDispute = payload.new as Dispute;
            
            toast({
              title: "🆕 Nouveau litige",
              description: `Sujet: ${newDispute.subject}`,
              duration: 5000,
            });

            // Recharger les litiges et les stats
            fetchDisputes();
            fetchStats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'disputes'
          },
          (payload) => {
            logger.info('Litige mis à jour:', payload.new);
            
            // Recharger seulement si c'est un changement important
            const oldStatus = (payload.old as Dispute).status;
            const newStatus = (payload.new as Dispute).status;
            
            if (oldStatus !== newStatus) {
              fetchDisputes();
              fetchStats();
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup lors du démontage
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchDisputes, fetchStats, toast]);

  // Assigner un litige à un admin
  const assignDispute = async (disputeId: string, adminId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          assigned_admin_id: adminId,
          status: 'investigating',
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Litige assigné avec succès",
      });

      await fetchDisputes();
      await fetchStats();
      return true;
    } catch (error: any) {
      logger.error("Error assigning dispute:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Mettre à jour les notes admin
  const updateAdminNotes = async (disputeId: string, notes: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Notes mises à jour",
      });

      await fetchDisputes();
      return true;
    } catch (error: any) {
      logger.error("Error updating admin notes:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Résoudre un litige
  const resolveDispute = async (disputeId: string, resolution: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          status: 'resolved',
          resolution,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Litige résolu avec succès",
      });

      await fetchDisputes();
      await fetchStats();
      return true;
    } catch (error: any) {
      logger.error("Error resolving dispute:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Fermer un litige
  const closeDispute = async (disputeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          status: 'closed',
          updated_at: new Date().toISOString(),
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Litige fermé",
      });

      await fetchDisputes();
      await fetchStats();
      return true;
    } catch (error: any) {
      logger.error("Error closing dispute:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Changer le statut d'un litige
  const updateDisputeStatus = async (disputeId: string, status: DisputeStatus): Promise<boolean> => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Si on passe à "resolved", ajouter la date
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("disputes")
        .update(updateData)
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Statut changé à "${status}"`,
      });

      await fetchDisputes();
      await fetchStats();
      return true;
    } catch (error: any) {
      logger.error("Error updating dispute status:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    disputes,
    stats,
    loading,
    error,
    totalCount,
    page,
    pageSize,
    sortBy,
    sortDirection,
    fetchDisputes,
    fetchStats,
    assignDispute,
    updateAdminNotes,
    resolveDispute,
    closeDispute,
    updateDisputeStatus,
  };
};

// Export types
export type { DisputesFilters, DisputeStats, UseDisputesOptions, SortColumn, SortDirection };

