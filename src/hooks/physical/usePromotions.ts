/**
 * Product Promotions Hooks
 * Date: 2025-01-28
 * 
 * Hooks for managing product promotions and discounts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface ProductPromotion {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  code?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discount_value: number;
  applies_to: 'all_products' | 'specific_products' | 'categories' | 'collections';
  product_ids?: string[];
  category_ids?: string[];
  collection_ids?: string[];
  applies_to_variants: boolean;
  variant_ids?: string[];
  min_purchase_amount?: number;
  min_quantity?: number;
  max_uses?: number;
  max_uses_per_customer?: number;
  current_uses: number;
  starts_at: string;
  ends_at?: string;
  is_active: boolean;
  is_automatic: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionUsage {
  id: string;
  promotion_id: string;
  order_id?: string;
  customer_id?: string;
  user_id?: string;
  discount_amount: number;
  order_total_before_discount: number;
  order_total_after_discount: number;
  used_at: string;
}

export interface PromotionValidationResult {
  valid: boolean;
  discount_amount: number;
  error?: string;
  message?: string;
  promotion_id?: string;
  code?: string;
  name?: string;
  discount_type?: 'percentage' | 'fixed_amount';
  discount_value?: number;
  order_total_before?: number;
  order_total_after?: number;
}

// =====================================================
// HOOKS: Promotions
// =====================================================

/**
 * Get all promotions for a store
 */
export const usePromotions = (storeId?: string, activeOnly = false) => {
  return useQuery({
    queryKey: ['promotions', storeId, activeOnly],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('product_promotions')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query
          .eq('is_active', true)
          .lte('starts_at', new Date().toISOString())
          .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ProductPromotion[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get a single promotion
 */
export const usePromotion = (promotionId?: string) => {
  return useQuery({
    queryKey: ['promotion', promotionId],
    queryFn: async () => {
      if (!promotionId) return null;

      const { data, error } = await supabase
        .from('product_promotions')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error) throw error;
      return data as ProductPromotion;
    },
    enabled: !!promotionId,
  });
};

/**
 * Get active promotions for a product
 */
export const useProductPromotions = (productId?: string, variantId?: string) => {
  return useQuery({
    queryKey: ['product-promotions', productId, variantId],
    queryFn: async () => {
      if (!productId) return [];

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('product_promotions')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .or(`applies_to.eq.all_products,product_ids.cs.{${productId}}`);

      if (error) throw error;

      // Filter promotions that apply to this product/variant
      const applicablePromotions = (data as ProductPromotion[]).filter((promo) => {
        if (promo.applies_to === 'all_products') return true;
        if (promo.applies_to === 'specific_products' && promo.product_ids?.includes(productId)) {
          if (variantId && promo.variant_ids && promo.variant_ids.length > 0) {
            return promo.applies_to_variants && promo.variant_ids.includes(variantId);
          }
          return true;
        }
        return false;
      });

      return applicablePromotions;
    },
    enabled: !!productId,
  });
};

/**
 * Validate promotion code using the unified validation RPC function
 * This uses validate_unified_promotion which handles all validation logic server-side
 */
export const useValidateUnifiedPromotion = (
  code: string | undefined,
  options?: {
    storeId?: string;
    productIds?: string[];
    categoryIds?: string[];
    collectionIds?: string[];
    orderAmount?: number;
    customerId?: string;
    isFirstOrder?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['validate-unified-promotion', code, options],
    queryFn: async () => {
      if (!code || code.trim() === '') {
        return {
          valid: false,
          error: 'code_empty',
          message: 'Veuillez entrer un code promo',
        } as PromotionValidationResult;
      }

      const { data, error } = await supabase.rpc('validate_unified_promotion', {
        p_code: code.toUpperCase().trim(),
        p_store_id: options?.storeId || null,
        p_product_ids: options?.productIds || null,
        p_category_ids: options?.categoryIds || null,
        p_collection_ids: options?.collectionIds || null,
        p_order_amount: options?.orderAmount || 0,
        p_customer_id: options?.customerId || null,
        p_is_first_order: options?.isFirstOrder || false,
      });

      if (error) {
        logger.error('Error validating unified promotion', { error, code });
        return {
          valid: false,
          discount_amount: 0,
          error: 'validation_error',
          message: error.message || 'Erreur lors de la validation',
        } as PromotionValidationResult;
      }

      const result = data as any;
      
      // Map the RPC result to PromotionValidationResult format
      if (result.valid === false) {
        return {
          valid: false,
          discount_amount: 0,
          error: 'invalid_code',
          message: result.error || 'Code promotionnel invalide',
        } as PromotionValidationResult;
      }

      return {
        valid: true,
        promotion_id: result.promotion_id,
        discount_amount: Number(result.discount_amount) || 0,
        discount_type: result.discount_type,
        discount_value: Number(result.discount_value) || 0,
        order_total_before: Number(result.order_total_before) || 0,
        order_total_after: Number(result.order_total_after) || 0,
        code: result.code,
        name: result.name,
      } as PromotionValidationResult;
    },
    enabled: !!code && code.trim() !== '',
    staleTime: 0, // Always validate again
  });
};

/**
 * Validate promotion code (legacy client-side validation)
 * @deprecated Use useValidateUnifiedPromotion instead for better performance and server-side validation
 */
export const useValidatePromotionCode = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      code,
      customerId,
      orderAmount,
      productIds,
      categoryIds,
    }: {
      code: string;
      customerId?: string;
      orderAmount?: number;
      productIds?: string[];
      categoryIds?: string[];
    }): Promise<PromotionValidationResult> => {
      const now = new Date().toISOString();

      // Find promotion by code
      const { data: promotion, error } = await supabase
        .from('product_promotions')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .single();

      if (error || !promotion) {
        return {
          valid: false,
          discount_amount: 0,
          error: 'Code promotionnel invalide ou expiré.',
        };
      }

      const promo = promotion as ProductPromotion;

      // Check max uses
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return {
          valid: false,
          discount_amount: 0,
          error: 'Ce code promotionnel a atteint sa limite d\'utilisation.',
        };
      }

      // Check per customer limit
      if (customerId && promo.max_uses_per_customer) {
        const { count } = await supabase
          .from('promotion_usage')
          .select('*', { count: 'exact', head: true })
          .eq('promotion_id', promo.id)
          .eq('customer_id', customerId);

        if (count && count >= promo.max_uses_per_customer) {
          return {
            valid: false,
            discount_amount: 0,
            error: 'Vous avez déjà utilisé ce code promotionnel le maximum de fois autorisé.',
          };
        }
      }

      // Check minimum purchase amount
      if (orderAmount && promo.min_purchase_amount && orderAmount < promo.min_purchase_amount) {
        return {
          valid: false,
          discount_amount: 0,
          error: `Montant minimum de commande requis: ${promo.min_purchase_amount} XOF`,
        };
      }

      // Vérifier que les produits du panier correspondent à la promotion
      if (productIds && productIds.length > 0) {
        // Si la promotion s'applique à des produits spécifiques
        if (promo.applies_to === 'specific_products' && promo.product_ids && promo.product_ids.length > 0) {
          const hasMatchingProduct = productIds.some(id => promo.product_ids?.includes(id));
          if (!hasMatchingProduct) {
            return {
              valid: false,
              discount_amount: 0,
              error: 'Ce code promotionnel ne s\'applique pas aux produits de votre panier.',
            };
          }
        }

        // Si la promotion s'applique à des catégories
        if (promo.applies_to === 'categories' && promo.category_ids && promo.category_ids.length > 0) {
          // Récupérer les catégories des produits du panier
          const { data: products } = await supabase
            .from('products')
            .select('category_id, category')
            .in('id', productIds);

          if (products) {
            const productCategoryIds = products
              .map(p => p.category_id)
              .filter(Boolean) as string[];
            
            const productCategories = products
              .map(p => p.category)
              .filter(Boolean) as string[];

            // Vérifier si au moins un produit appartient à une catégorie sélectionnée
            const hasMatchingCategory = 
              productCategoryIds.some(id => promo.category_ids?.includes(id)) ||
              (categoryIds && categoryIds.some(id => promo.category_ids?.includes(id)));

            if (!hasMatchingCategory && promo.category_ids.length > 0) {
              return {
                valid: false,
                discount_amount: 0,
                error: 'Ce code promotionnel ne s\'applique pas aux catégories de produits de votre panier.',
              };
            }
          }
        }

        // Si la promotion s'applique à des collections
        if (promo.applies_to === 'collections' && promo.collection_ids && promo.collection_ids.length > 0) {
          // Récupérer les collections des produits du panier
          const { data: collectionProducts } = await supabase
            .from('collection_products')
            .select('collection_id')
            .in('product_id', productIds)
            .in('collection_id', promo.collection_ids);

          if (!collectionProducts || collectionProducts.length === 0) {
            return {
              valid: false,
              discount_amount: 0,
              error: 'Ce code promotionnel ne s\'applique pas aux collections de produits de votre panier.',
            };
          }
        }
      }

      // Calculate discount (will be calculated based on order items)
      return {
        valid: true,
        discount_amount: 0, // Will be calculated when applied
      };
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de valider le code promotionnel.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Create promotion
 */
export const useCreatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      promotion: Omit<ProductPromotion, 'id' | 'created_at' | 'updated_at' | 'current_uses'>
    ) => {
      // Uppercase code if provided
      const promotionData = {
        ...promotion,
        code: promotion.code ? promotion.code.toUpperCase() : null,
      };

      const { data, error } = await supabase
        .from('product_promotions')
        .insert(promotionData)
        .select()
        .single();

      if (error) throw error;
      return data as ProductPromotion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['product-promotions'] });
      toast({
        title: 'Promotion créée',
        description: `La promotion "${data.name}" a été créée avec succès.`,
      });
      logger.info('Promotion created', { promotionId: data.id });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la promotion.',
        variant: 'destructive',
      });
      logger.error('Error creating promotion', { error });
    },
  });
};

/**
 * Update promotion
 */
export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ProductPromotion> & { id: string }) => {
      // Uppercase code if provided
      const updateData = {
        ...updates,
        code: updates.code ? updates.code.toUpperCase() : undefined,
      };

      const { data, error } = await supabase
        .from('product_promotions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProductPromotion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotions', data.store_id] });
      queryClient.invalidateQueries({ queryKey: ['promotion', data.id] });
      queryClient.invalidateQueries({ queryKey: ['product-promotions'] });
      toast({
        title: 'Promotion mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour la promotion.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Delete promotion
 */
export const useDeletePromotion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (promotionId: string) => {
      const { error } = await supabase
        .from('product_promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;
    },
    onSuccess: (_, promotionId) => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['product-promotions'] });
      toast({
        title: 'Promotion supprimée',
        description: 'La promotion a été supprimée avec succès.',
      });
      logger.info('Promotion deleted', { promotionId });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer la promotion.',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Get promotion usage statistics
 */
export const usePromotionUsage = (promotionId?: string) => {
  return useQuery({
    queryKey: ['promotion-usage', promotionId],
    queryFn: async () => {
      if (!promotionId) return [];

      const { data, error } = await supabase
        .from('promotion_usage')
        .select('*')
        .eq('promotion_id', promotionId)
        .order('used_at', { ascending: false });

      if (error) throw error;
      return data as PromotionUsage[];
    },
    enabled: !!promotionId,
  });
};

/**
 * Calculate discount amount for an order
 */
export const calculateDiscount = (
  promotion: ProductPromotion,
  orderItems: Array<{ price: number; quantity: number }>
): number => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  switch (promotion.discount_type) {
    case 'percentage':
      return (subtotal * promotion.discount_value) / 100;
    case 'fixed_amount':
      return Math.min(promotion.discount_value, subtotal);
    case 'free_shipping':
      return 0; // Shipping will be handled separately
    case 'buy_x_get_y':
      // This would need more complex logic based on specific rules
      return 0;
    default:
      return 0;
  }
};



