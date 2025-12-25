import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

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

export interface PromotionsQueryOptions {
  storeId?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Hook pour récupérer les promotions avec React Query
 * Amélioré avec cache, pagination et filtres
 */
export const usePromotions = (options: PromotionsQueryOptions = {}) => {
  const { storeId, activeOnly = false, page = 1, limit = 20, search } = options;

  return useQuery({
    queryKey: ['promotions', storeId, { activeOnly, page, limit, search }],
    queryFn: async () => {
      if (!storeId) return { data: [], total: 0, page, limit };

      let query = supabase
        .from('promotions')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        const now = new Date().toISOString();
        query = query
          .eq('is_active', true)
          .or(`start_date.is.null,start_date.lte.${now}`)
          .or(`end_date.is.null,end_date.gte.${now}`);
      }

      if (search) {
        query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error fetching promotions', { error, storeId });
        throw error;
      }

      return {
        data: (data || []) as Promotion[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    },
    enabled: !!storeId,
    staleTime: 30000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Hook pour créer une promotion
 */
export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'used_count'>) => {
      const { data, error } = await supabase
        .from('promotions')
        .insert({
          ...promotion,
          code: promotion.code.toUpperCase().trim(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating promotion', { error });
        throw error;
      }

      return data as Promotion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.store_id] });
      toast({
        title: "Succès",
        description: "Promotion créée avec succès",
      });
      logger.info('Promotion created', { promotionId: data.id });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la promotion",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook pour mettre à jour une promotion
 */
export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Promotion> & { id: string }) => {
      const updateData: any = { ...updates };
      if (updates.code) {
        updateData.code = updates.code.toUpperCase().trim();
      }

      const { data, error } = await supabase
        .from('promotions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating promotion', { error, id });
        throw error;
      }

      return data as Promotion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['promotion', data.id] });
      toast({
        title: "Succès",
        description: "Promotion mise à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la promotion",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook pour supprimer une promotion
 */
export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, storeId }: { id: string; storeId: string }) => {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting promotion', { error, id });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', variables.storeId] });
      toast({
        title: "Succès",
        description: "Promotion supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la promotion",
        variant: "destructive",
      });
    },
  });
};
