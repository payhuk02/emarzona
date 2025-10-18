import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Promotion {
  id: string;
  store_id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePromotions = (storeId?: string) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPromotions = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
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
    fetchPromotions();
  }, [storeId]);

  return { promotions, loading, refetch: fetchPromotions };
};
