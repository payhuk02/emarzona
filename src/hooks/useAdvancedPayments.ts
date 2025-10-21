import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
import {
  AdvancedPayment,
  PaymentType,
  PaymentStatus,
  PaymentOptions,
  PercentagePaymentOptions,
  SecuredPaymentOptions,
  PaymentResponse,
  PaymentFilters,
  PaymentStats
} from "@/types/advanced-features";

export const useAdvancedPayments = (
  storeId?: string,
  filters?: PaymentFilters
) => {
  const [payments, setPayments] = useState<AdvancedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("payments")
        .select(`
          *,
          customers (name, email),
          orders (order_number)
        `)
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      // Appliquer les filtres
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.payment_type) {
        query = query.eq("payment_type", filters.payment_type);
      }
      if (filters?.payment_method) {
        query = query.eq("payment_method", filters.payment_method);
      }
      if (filters?.is_held !== undefined) {
        query = query.eq("is_held", filters.is_held);
      }
      if (filters?.date_from) {
        query = query.gte("created_at", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("created_at", filters.date_to);
      }
      if (filters?.search) {
        query = query.or(
          `transaction_id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      logger.error("Error fetching advanced payments:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, filters, toast]);

  const fetchStats = useCallback(async () => {
    if (!storeId) return;

    try {
      const [totalResult, completedResult, pendingResult, failedResult, heldResult, amountResult] = await Promise.allSettled([
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("store_id", storeId),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "completed"),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "pending"),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("store_id", storeId).eq("status", "failed"),
        supabase.from("payments").select("*", { count: "exact", head: true }).eq("store_id", storeId).eq("is_held", true),
        supabase.from("payments").select("amount").eq("store_id", storeId).eq("status", "completed"),
      ]);

      const totalPayments = totalResult.status === 'fulfilled' && totalResult.value.count !== null ? totalResult.value.count : 0;
      const completedPayments = completedResult.status === 'fulfilled' && completedResult.value.count !== null ? completedResult.value.count : 0;
      const pendingPayments = pendingResult.status === 'fulfilled' && pendingResult.value.count !== null ? pendingResult.value.count : 0;
      const failedPayments = failedResult.status === 'fulfilled' && failedResult.value.count !== null ? failedResult.value.count : 0;
      const heldPayments = heldResult.status === 'fulfilled' && heldResult.value.count !== null ? heldResult.value.count : 0;
      const amounts = amountResult.status === 'fulfilled' && amountResult.value.data ? amountResult.value.data.map(p => p.amount) : [];
      
      const totalRevenue = amounts.reduce((sum, amount) => sum + parseFloat(amount.toString()), 0);
      const averagePayment = amounts.length > 0 ? totalRevenue / amounts.length : 0;
      const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

      // Calculer les revenus retenus
      const heldAmountResult = await supabase
        .from("payments")
        .select("amount")
        .eq("store_id", storeId)
        .eq("is_held", true);
      
      const heldRevenue = heldAmountResult.data?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

      // Compter les paiements par pourcentage et sécurisés
      const percentageResult = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("payment_type", "percentage");
      
      const securedResult = await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("payment_type", "delivery_secured");

      const percentagePayments = percentageResult.status === 'fulfilled' && percentageResult.value.count !== null ? percentageResult.value.count : 0;
      const securedPayments = securedResult.status === 'fulfilled' && securedResult.value.count !== null ? securedResult.value.count : 0;

      setStats({
        total_payments: totalPayments,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        failed_payments: failedPayments,
        held_payments: heldPayments,
        total_revenue: totalRevenue,
        held_revenue: heldRevenue,
        average_payment: averagePayment,
        success_rate: successRate,
        percentage_payments: percentagePayments,
        secured_payments: securedPayments,
      });
    } catch (error: any) {
      logger.error("Error fetching payment stats:", error);
    }
  }, [storeId]);

  // Créer un paiement standard
  const createPayment = async (options: PaymentOptions): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert([{
          store_id: options.storeId,
          order_id: options.orderId,
          customer_id: options.customerId,
          payment_method: options.paymentMethod || 'mobile_money',
          amount: options.amount,
          currency: options.currency || 'XOF',
          status: 'pending',
          payment_type: options.paymentType || 'full',
          transaction_id: options.transactionId,
          notes: options.notes,
          metadata: options.metadata,
        }])
        .select()
        .limit(1);

      if (error) throw error;
      
      await fetchPayments();
      await fetchStats();
      
      return {
        success: true,
        data: data && data.length > 0 ? data[0] : undefined,
      };
    } catch (error: any) {
      logger.error("Error creating payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Créer un paiement par pourcentage
  const createPercentagePayment = async (options: PercentagePaymentOptions): Promise<PaymentResponse> => {
    try {
      const percentageAmount = options.amount * (options.percentageRate / 100);
      
      const { data, error } = await supabase
        .from("payments")
        .insert([{
          store_id: options.storeId,
          order_id: options.orderId,
          customer_id: options.customerId,
          payment_method: options.paymentMethod || 'mobile_money',
          amount: percentageAmount,
          currency: options.currency || 'XOF',
          status: 'completed',
          payment_type: 'percentage',
          percentage_amount: percentageAmount,
          percentage_rate: options.percentageRate,
          remaining_amount: options.remainingAmount,
          transaction_id: options.transactionId,
          notes: options.notes,
          metadata: options.metadata,
        }])
        .select()
        .limit(1);

      if (error) throw error;
      
      // Créer un paiement partiel
      await supabase
        .from("partial_payments")
        .insert([{
          order_id: options.orderId!,
          payment_id: data[0].id,
          amount: percentageAmount,
          percentage: options.percentageRate,
          status: 'completed',
          payment_method: options.paymentMethod || 'mobile_money',
          transaction_id: options.transactionId,
        }]);
      
      await fetchPayments();
      await fetchStats();
      
      return {
        success: true,
        data: data && data.length > 0 ? data[0] : undefined,
      };
    } catch (error: any) {
      logger.error("Error creating percentage payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Créer un paiement sécurisé (à la livraison)
  const createSecuredPayment = async (options: SecuredPaymentOptions): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .insert([{
          store_id: options.storeId,
          order_id: options.orderId,
          customer_id: options.customerId,
          payment_method: options.paymentMethod || 'mobile_money',
          amount: options.amount,
          currency: options.currency || 'XOF',
          status: 'held',
          payment_type: 'delivery_secured',
          is_held: true,
          held_until: options.heldUntil,
          release_conditions: options.releaseConditions,
          transaction_id: options.transactionId,
          notes: options.notes,
          metadata: options.metadata,
        }])
        .select()
        .limit(1);

      if (error) throw error;
      
      // Créer un paiement sécurisé
      await supabase
        .from("secured_payments")
        .insert([{
          order_id: options.orderId!,
          payment_id: data[0].id,
          total_amount: options.amount,
          held_amount: options.amount,
          status: 'held',
          hold_reason: options.holdReason,
          release_conditions: options.releaseConditions,
          held_until: options.heldUntil,
        }]);
      
      await fetchPayments();
      await fetchStats();
      
      return {
        success: true,
        data: data && data.length > 0 ? data[0] : undefined,
      };
    } catch (error: any) {
      logger.error("Error creating secured payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Libérer un paiement retenu
  const releasePayment = async (paymentId: string, releasedBy: string): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .update({
          status: 'released',
          is_held: false,
          delivery_confirmed_at: new Date().toISOString(),
          delivery_confirmed_by: releasedBy,
        })
        .eq("id", paymentId)
        .select()
        .limit(1);

      if (error) throw error;
      
      // Mettre à jour le paiement sécurisé
      await supabase
        .from("secured_payments")
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_by: releasedBy,
        })
        .eq("payment_id", paymentId);
      
      await fetchPayments();
      await fetchStats();
      
      toast({
        title: "Succès",
        description: "Paiement libéré avec succès",
      });
      
      return {
        success: true,
        data: data && data.length > 0 ? data[0] : undefined,
      };
    } catch (error: any) {
      logger.error("Error releasing payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Ouvrir un litige
  const openDispute = async (paymentId: string, reason: string, description: string): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .update({
          status: 'disputed',
          dispute_opened_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .select()
        .limit(1);

      if (error) throw error;
      
      // Créer un litige
      await supabase
        .from("disputes")
        .insert([{
          order_id: data[0].order_id,
          initiator_id: data[0].customer_id || '',
          initiator_type: 'customer',
          reason,
          description,
          status: 'open',
        }]);
      
      await fetchPayments();
      await fetchStats();
      
      toast({
        title: "Litige ouvert",
        description: "Un litige a été ouvert pour ce paiement",
      });
      
      return {
        success: true,
        data: data && data.length > 0 ? data[0] : undefined,
      };
    } catch (error: any) {
      logger.error("Error opening dispute:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Mettre à jour un paiement
  const updatePayment = async (id: string, updates: Partial<AdvancedPayment>): Promise<PaymentResponse> => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("id", id)
        .select()
        .limit(1);

      if (error) throw error;
      
      await fetchPayments();
      await fetchStats();
      
      return {
        success: true,
        data: data && data.length > 0 ? data[0] : undefined,
      };
    } catch (error: any) {
      logger.error("Error updating payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Supprimer un paiement
  const deletePayment = async (id: string): Promise<PaymentResponse> => {
    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      await fetchPayments();
      await fetchStats();
      
      toast({
        title: "Succès",
        description: "Paiement supprimé avec succès",
      });
      
      return { success: true };
    } catch (error: any) {
      logger.error("Error deleting payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('advanced-payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: storeId ? `store_id=eq.${storeId}` : undefined,
        },
        () => {
          fetchPayments();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments, fetchStats]);

  return {
    payments,
    loading,
    stats,
    refetch: fetchPayments,
    createPayment,
    createPercentagePayment,
    createSecuredPayment,
    releasePayment,
    openDispute,
    updatePayment,
    deletePayment,
  };
};
