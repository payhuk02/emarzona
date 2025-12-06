import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export interface Payment {
  id: string;
  store_id: string;
  order_id: string | null;
  customer_id: string | null;
  payment_method: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string | null;
  } | null;
  orders?: {
    order_number: string;
  } | null;
}

export const usePayments = (
  storeId?: string,
  searchTerm?: string,
  statusFilter?: string,
  methodFilter?: string
) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer d'abord les paiements sans jointure pour éviter les erreurs RLS
      let query = supabase
        .from("payments")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `transaction_id.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      if (methodFilter) {
        query = query.eq("payment_method", methodFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Enrichir avec les données clients et orders si nécessaire
      const paymentsEnriched = await Promise.all(
        (data || []).map(async (payment: any) => {
          // Récupérer les données client si customer_id existe
          if (payment.customer_id) {
            try {
              const { data: customerData } = await supabase
                .from('customers')
                .select('name, email, full_name')
                .eq('id', payment.customer_id)
                .eq('store_id', storeId)
                .single();
              
              if (customerData) {
                payment.customers = {
                  name: customerData.name || customerData.full_name || 'N/A',
                  email: customerData.email,
                };
              }
            } catch (customerError) {
              // Ignorer les erreurs de récupération client, continuer sans
              logger.error('Error fetching customer for payment', { 
                paymentId: payment.id, 
                customerId: payment.customer_id,
                error: customerError 
              });
            }
          }
          
          // Récupérer les données order si order_id existe
          if (payment.order_id) {
            try {
              const { data: orderData } = await supabase
                .from('orders')
                .select('order_number')
                .eq('id', payment.order_id)
                .eq('store_id', storeId)
                .single();
              
              if (orderData) {
                payment.orders = {
                  order_number: orderData.order_number,
                };
              }
            } catch (orderError) {
              // Ignorer les erreurs de récupération order, continuer sans
              logger.error('Error fetching order for payment', { 
                paymentId: payment.id, 
                orderId: payment.order_id,
                error: orderError 
              });
            }
          }
          
          return payment;
        })
      );
      
      setPayments(paymentsEnriched);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [storeId, searchTerm, statusFilter, methodFilter]);

  return { payments, loading, refetch: fetchPayments };
};
