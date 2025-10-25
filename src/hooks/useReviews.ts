import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    slug: string;
    image_url: string | null;
  };
}

export const useReviews = (storeId?: string | null) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!storeId) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // Fetch all reviews for products in this store
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId);

      if (!products || products.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const productIds = products.map(p => p.id);

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          product:products(name, slug, image_url)
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
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
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, refetch: fetchReviews };
};
