/**
 * Cost Optimization & Margin Analysis Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les coûts, marges et recommandations d'optimisation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface ProductCost {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  cost_of_goods_sold: number;
  manufacturing_cost: number;
  material_cost: number;
  labor_cost: number;
  packaging_cost: number;
  overhead_cost: number;
  shipping_cost_per_unit: number;
  storage_cost_per_unit: number;
  marketing_cost_per_unit: number;
  platform_fees_percentage: number;
  payment_processing_fees_percentage: number;
  tax_rate: number;
  total_cost_per_unit: number;
  cost_basis_date: string;
  cost_source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MarginAnalysis {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  analysis_period_start: string;
  analysis_period_end: string;
  analysis_date: string;
  average_selling_price: number;
  total_revenue: number;
  total_units_sold: number;
  total_cost_of_goods: number;
  total_variable_costs: number;
  total_fixed_costs: number;
  total_costs: number;
  gross_profit: number;
  gross_margin_percentage: number;
  net_profit: number;
  net_margin_percentage: number;
  contribution_margin: number;
  contribution_margin_percentage: number;
  profit_per_unit: number;
  break_even_units?: number;
  break_even_revenue?: number;
  previous_period_margin?: number;
  margin_change_percentage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PriceOptimizationRecommendation {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  recommendation_type: 'increase_price' | 'decrease_price' | 'maintain_price' | 'promotional_price' | 'bundle_pricing' | 'volume_discount';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  current_price: number;
  recommended_price: number;
  price_change_percentage: number;
  expected_revenue_change?: number;
  expected_margin_change?: number;
  expected_volume_change?: number;
  expected_profit_change?: number;
  reasoning: Record<string, any>;
  factors_considered: Record<string, any>;
  confidence_level: number;
  status: 'pending' | 'approved' | 'implemented' | 'dismissed';
  calculated_at: string;
  calculated_by?: string;
  implemented_at?: string;
  implemented_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useProductCosts - Récupère les coûts d'un produit
 */
export const useProductCosts = (storeId?: string, productId?: string) => {
  return useQuery({
    queryKey: ['product-costs', storeId, productId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('product_costs')
        .select(`
          *,
          product:products (id, name, image_url)
        `)
        .eq('store_id', storeId);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching product costs', { error, storeId });
        throw error;
      }

      return (data || []) as ProductCost[];
    },
    enabled: !!storeId,
  });
};

/**
 * useMarginAnalysis - Récupère les analyses de marge
 */
export const useMarginAnalysis = (storeId?: string, filters?: {
  productId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['margin-analysis', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('margin_analysis')
        .select(`
          *,
          product:products (id, name, image_url)
        `)
        .eq('store_id', storeId);

      if (filters?.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters?.startDate) {
        query = query.gte('analysis_period_start', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('analysis_period_end', filters.endDate);
      }

      query = query.order('analysis_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching margin analysis', { error, storeId });
        throw error;
      }

      return (data || []) as MarginAnalysis[];
    },
    enabled: !!storeId,
  });
};

/**
 * usePriceOptimizationRecommendations - Récupère les recommandations
 */
export const usePriceOptimizationRecommendations = (storeId?: string, filters?: {
  status?: PriceOptimizationRecommendation['status'];
  priority?: PriceOptimizationRecommendation['priority'];
}) => {
  return useQuery({
    queryKey: ['price-optimization-recommendations', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('price_optimization_recommendations')
        .select(`
          *,
          product:products (id, name, image_url)
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      query = query.order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching recommendations', { error, storeId });
        throw error;
      }

      return (data || []) as PriceOptimizationRecommendation[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateOrUpdateProductCost - Créer ou mettre à jour les coûts
 */
export const useCreateOrUpdateProductCost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (costData: Partial<ProductCost>) => {
      const { data, error } = await supabase
        .from('product_costs')
        .upsert({
          ...costData,
        }, {
          onConflict: 'store_id,product_id,variant_id',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating/updating product cost', { error, costData });
        throw error;
      }

      return data as ProductCost;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-costs', data.store_id] });
      toast({
        title: '✅ Coûts sauvegardés',
        description: 'Les coûts du produit ont été sauvegardés',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateOrUpdateProductCost', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de sauvegarder les coûts',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCalculateProductMargin - Calculer la marge d'un produit
 */
export const useCalculateProductMargin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      productId,
      variantId,
      periodStart,
      periodEnd,
    }: {
      storeId: string;
      productId: string;
      variantId?: string;
      periodStart?: string;
      periodEnd?: string;
    }) => {
      const { data, error } = await supabase.rpc('calculate_product_margin', {
        p_store_id: storeId,
        p_product_id: productId,
        p_variant_id: variantId,
        p_period_start: periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_period_end: periodEnd || new Date().toISOString().split('T')[0],
      });

      if (error) {
        logger.error('Error calculating product margin', { error });
        throw error;
      }

      const margin = data[0];

      // Sauvegarder l'analyse
      const { data: analysis, error: analysisError } = await supabase
        .from('margin_analysis')
        .insert({
          store_id: storeId,
          product_id: productId,
          variant_id: variantId,
          analysis_period_start: periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          analysis_period_end: periodEnd || new Date().toISOString().split('T')[0],
          average_selling_price: 0, // À calculer selon besoins
          total_revenue: margin.total_revenue,
          total_units_sold: margin.total_units_sold,
          total_cost_of_goods: margin.total_cost_of_goods,
          total_variable_costs: margin.total_variable_costs,
          total_fixed_costs: margin.total_fixed_costs,
          total_costs: margin.total_costs,
        })
        .select()
        .single();

      if (analysisError) {
        logger.error('Error saving margin analysis', { error: analysisError });
        // Ne pas throw, juste logger
      }

      return margin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['margin-analysis'] });
      toast({
        title: '✅ Marge calculée',
        description: 'La marge du produit a été calculée',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCalculateProductMargin', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de calculer la marge',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useGeneratePriceOptimizationRecommendations - Générer recommandations
 */
export const useGeneratePriceOptimizationRecommendations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (storeId: string) => {
      const { data, error } = await supabase.rpc('generate_price_optimization_recommendations', {
        p_store_id: storeId,
      });

      if (error) {
        logger.error('Error generating recommendations', { error });
        throw error;
      }

      return data as number; // Nombre de recommandations générées
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['price-optimization-recommendations'] });
      toast({
        title: '✅ Recommandations générées',
        description: `${count} recommandation${count > 1 ? 's' : ''} générée${count > 1 ? 's' : ''}`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useGeneratePriceOptimizationRecommendations', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer les recommandations',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateRecommendationStatus - Mettre à jour le statut d'une recommandation
 */
export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      recommendationId,
      status,
    }: {
      recommendationId: string;
      status: PriceOptimizationRecommendation['status'];
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'implemented') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.implemented_at = new Date().toISOString();
        updateData.implemented_by = user?.id;
      }

      const { data, error } = await supabase
        .from('price_optimization_recommendations')
        .update(updateData)
        .eq('id', recommendationId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating recommendation status', { error, recommendationId });
        throw error;
      }

      return data as PriceOptimizationRecommendation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-optimization-recommendations'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de la recommandation a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateRecommendationStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

