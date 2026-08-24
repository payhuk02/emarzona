import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

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

function promotionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
}

const PRODUCT_PROMOTION_LIST_FIELDS =
  'id,store_id,code,name,description,discount_type,discount_value,min_purchase_amount,max_uses,current_uses,starts_at,ends_at,is_active,created_at,updated_at';

function mapProductPromotionRow(row: {
  id: string;
  store_id: string;
  code: string | null;
  name?: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase_amount: number | null;
  max_uses: number | null;
  current_uses: number | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}): Promotion {
  return {
    id: row.id,
    store_id: row.store_id,
    code: row.code ?? '',
    description: row.description ?? row.name ?? null,
    discount_type: row.discount_type === 'fixed_amount' ? 'fixed' : row.discount_type,
    discount_value: row.discount_value,
    min_purchase_amount: row.min_purchase_amount ?? 0,
    max_uses: row.max_uses,
    used_count: row.current_uses ?? 0,
    start_date: row.starts_at,
    end_date: row.ends_at,
    is_active: row.is_active ?? false,
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
  };
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
        .from('product_promotions')
        .select(PRODUCT_PROMOTION_LIST_FIELDS, { count: 'exact' })
        .eq('store_id', storeId)
        .not('code', 'is', null)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        const now = new Date().toISOString();
        query = query
          .eq('is_active', true)
          .lte('starts_at', now)
          .or(`ends_at.is.null,ends_at.gte.${now}`);
      }

      if (search) {
        query = query.or(
          `code.ilike.%${search}%,name.ilike.%${search}%,description.ilike.%${search}%`
        );
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
        data: (data || []).map(row => mapProductPromotionRow(row)),
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
    mutationFn: async (
      promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'used_count'>
    ) => {
      const { data, error } = await supabase
        .from('product_promotions')
        .insert({
          store_id: promotion.store_id,
          name: promotion.description || `Promo ${promotion.code}`,
          description: promotion.description,
          code: promotion.code.toUpperCase().trim(),
          discount_type:
            promotion.discount_type === 'fixed' ? 'fixed_amount' : promotion.discount_type,
          discount_value: promotion.discount_value,
          applies_to: 'all_products',
          min_purchase_amount: promotion.min_purchase_amount,
          max_uses: promotion.max_uses,
          starts_at: promotion.start_date || new Date().toISOString(),
          ends_at: promotion.end_date,
          is_active: promotion.is_active,
          is_automatic: false,
        })
        .select(PRODUCT_PROMOTION_LIST_FIELDS)
        .single();

      if (error) {
        logger.error('Error creating promotion', { error });
        throw error;
      }

      return mapProductPromotionRow(data);
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.store_id] });
      toast({
        title: 'Succès',
        description: 'Promotion créée avec succès',
      });
      logger.info('Promotion created', { promotionId: data.id });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: promotionErrorMessage(error, 'Impossible de créer la promotion'),
        variant: 'destructive',
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
      const { data, error } = await supabase
        .from('product_promotions')
        .update({
          ...(updates.description !== undefined
            ? { description: updates.description, name: updates.description }
            : {}),
          ...(updates.code ? { code: updates.code.toUpperCase().trim() } : {}),
          ...(updates.discount_type
            ? {
                discount_type:
                  updates.discount_type === 'fixed' ? 'fixed_amount' : updates.discount_type,
              }
            : {}),
          ...(updates.discount_value !== undefined
            ? { discount_value: updates.discount_value }
            : {}),
          ...(updates.min_purchase_amount !== undefined
            ? { min_purchase_amount: updates.min_purchase_amount }
            : {}),
          ...(updates.max_uses !== undefined ? { max_uses: updates.max_uses } : {}),
          ...(updates.start_date !== undefined ? { starts_at: updates.start_date } : {}),
          ...(updates.end_date !== undefined ? { ends_at: updates.end_date } : {}),
          ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
        })
        .eq('id', id)
        .select(PRODUCT_PROMOTION_LIST_FIELDS)
        .single();

      if (error) {
        logger.error('Error updating promotion', { error, id });
        throw error;
      }

      return mapProductPromotionRow(data);
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['promotion', data.id] });
      toast({
        title: 'Succès',
        description: 'Promotion mise à jour avec succès',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: promotionErrorMessage(error, 'Impossible de mettre à jour la promotion'),
        variant: 'destructive',
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
    mutationFn: async ({ id }: { id: string; storeId: string }) => {
      const { error } = await supabase.from('product_promotions').delete().eq('id', id);

      if (error) {
        logger.error('Error deleting promotion', { error, id });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', variables.storeId] });
      toast({
        title: 'Succès',
        description: 'Promotion supprimée avec succès',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: promotionErrorMessage(error, 'Impossible de supprimer la promotion'),
        variant: 'destructive',
      });
    },
  });
};
