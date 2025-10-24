import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
import { Dispute, DisputeStatus, InitiatorType } from "@/types/advanced-features";

interface DisputesFilters {
  status?: DisputeStatus;
  initiator_type?: InitiatorType;
  assigned_admin_id?: string;
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

export const useDisputes = (filters?: DisputesFilters) => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Récupérer les litiges
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("disputes")
        .select(`
          *,
          order:orders (
            order_number,
            total_amount,
            currency
          ),
          conversation:conversations (
            id,
            status,
            admin_intervention
          ),
          initiator:profiles!disputes_initiator_id_fkey (
            name,
            email
          ),
          assigned_admin:profiles!disputes_assigned_admin_id_fkey (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

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

      const { data, error } = await query;

      if (error) throw error;
      setDisputes(data || []);
    } catch (error: any) {
      logger.error("Error fetching disputes:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const [totalResult, openResult, investigatingResult, resolvedResult, closedResult, unassignedResult] = await Promise.allSettled([
        supabase.from("disputes").select("*", { count: "exact", head: true }),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "investigating"),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "resolved"),
        supabase.from("disputes").select("*", { count: "exact", head: true }).eq("status", "closed"),
        supabase.from("disputes").select("*", { count: "exact", head: true }).is("assigned_admin_id", null),
      ]);

      const total = totalResult.status === 'fulfilled' && totalResult.value.count !== null ? totalResult.value.count : 0;
      const open = openResult.status === 'fulfilled' && openResult.value.count !== null ? openResult.value.count : 0;
      const investigating = investigatingResult.status === 'fulfilled' && investigatingResult.value.count !== null ? investigatingResult.value.count : 0;
      const resolved = resolvedResult.status === 'fulfilled' && resolvedResult.value.count !== null ? resolvedResult.value.count : 0;
      const closed = closedResult.status === 'fulfilled' && closedResult.value.count !== null ? closedResult.value.count : 0;
      const unassigned = unassignedResult.status === 'fulfilled' && unassignedResult.value.count !== null ? unassignedResult.value.count : 0;

      // Calculer le temps moyen de résolution
      const { data: resolvedDisputes } = await supabase
        .from("disputes")
        .select("created_at, resolved_at")
        .not("resolved_at", "is", null);

      let avgResolutionTime: number | undefined;
      if (resolvedDisputes && resolvedDisputes.length > 0) {
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

      // Mettre à jour la conversation associée
      const dispute = disputes.find(d => d.id === disputeId);
      if (dispute?.conversation_id) {
        await supabase
          .from("conversations")
          .update({ status: 'closed' })
          .eq("id", dispute.conversation_id);
      }

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
    fetchDisputes,
    fetchStats,
    assignDispute,
    updateAdminNotes,
    resolveDispute,
    closeDispute,
    updateDisputeStatus,
  };
};

