import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  digital_file_url: string | null;
  stock_quantity?: number | null;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | null;
  sku?: string | null;
  track_inventory?: boolean;
  low_stock_threshold?: number | null;
  created_at: string;
  updated_at: string;
}

export const useProducts = (storeId?: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    } else {
      setLoading(false);
      setProducts([]);
    }
  }, [storeId, fetchProducts]);

  return { products, loading, refetch: fetchProducts };
};
