/**
 * Hook pour la gestion des bundles de produits physiques
 * Date: 28 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type BundleType = 'fixed' | 'flexible' | 'mix_and_match';

export interface Bundle {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  type: BundleType;
  image_url?: string;
  original_price: number;
  bundle_price: number;
  discount_percentage: number;
  discount_amount: number;
  min_products?: number;
  max_products?: number;
  track_inventory: boolean;
  total_quantity?: number;
  is_active: boolean;
  show_savings: boolean;
  show_individual_prices: boolean;
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  is_required: boolean;
  display_order: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
  };
  variant?: {
    id: string;
    name: string;
  };
}

export interface BundleWithItems extends Bundle {
  items: BundleItem[];
}

/**
 * Récupérer tous les bundles d'un store
 */
export function useBundles(storeId: string | null, filters?: {
  is_active?: boolean;
  type?: BundleType;
}) {
  return useQuery({
    queryKey: ['bundles', storeId, filters],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('product_bundles')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Bundle[];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer un bundle avec ses items
 */
export function useBundle(bundleId: string | null) {
  return useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: async () => {
      if (!bundleId) return null;

      // Récupérer le bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('product_bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (bundleError) throw bundleError;

      // Récupérer les items
      const { data: items, error: itemsError } = await supabase
        .from('bundle_items')
        .select(`
          *,
          product:products!inner(
            id,
            name
          ),
          variant:product_variants(
            id,
            name
          )
        `)
        .eq('bundle_id', bundleId)
        .order('display_order', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...bundle,
        items: items || [],
      } as BundleWithItems;
    },
    enabled: !!bundleId,
  });
}

/**
 * Calculer le prix dynamique d'un bundle
 */
export function useCalculateBundlePrice() {
  return useMutation({
    mutationFn: async (items: Array<{ product_id: string; variant_id?: string; quantity: number }>) => {
      // Récupérer les prix des produits
      const productIds = items.map((item) => item.product_id);
      const { data: products, error } = await supabase
        .from('products')
        .select('id, price')
        .in('id', productIds);

      if (error) throw error;

      // Calculer le prix total
      let totalPrice = 0;
      for (const item of items) {
        const product = products?.find((p) => p.id === item.product_id);
        if (product) {
          totalPrice += (product.price || 0) * item.quantity;
        }
      }

      return totalPrice;
    },
  });
}

/**
 * Créer un bundle
 */
export function useCreateBundle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      store_id: string;
      name: string;
      description?: string;
      type: BundleType;
      image_url?: string;
      bundle_price: number;
      min_products?: number;
      max_products?: number;
      track_inventory?: boolean;
      total_quantity?: number;
      is_active?: boolean;
      show_savings?: boolean;
      show_individual_prices?: boolean;
      items: Array<{
        product_id: string;
        variant_id?: string;
        quantity: number;
        price: number;
        is_required?: boolean;
        display_order?: number;
      }>;
    }) => {
      // Calculer le prix original
      const originalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const discountAmount = originalPrice - data.bundle_price;
      const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

      // Créer le bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('product_bundles')
        .insert({
          store_id: data.store_id,
          name: data.name,
          description: data.description,
          type: data.type,
          image_url: data.image_url,
          original_price: originalPrice,
          bundle_price: data.bundle_price,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount,
          min_products: data.min_products,
          max_products: data.max_products,
          track_inventory: data.track_inventory ?? false,
          total_quantity: data.total_quantity,
          is_active: data.is_active ?? true,
          show_savings: data.show_savings ?? true,
          show_individual_prices: data.show_individual_prices ?? false,
        })
        .select()
        .single();

      if (bundleError) throw bundleError;

      // Créer les items
      const itemsToInsert = data.items.map((item, index) => ({
        bundle_id: bundle.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price: item.price,
        is_required: item.is_required ?? true,
        display_order: item.display_order ?? index,
      }));

      const { error: itemsError } = await supabase
        .from('bundle_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return bundle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      toast({
        title: 'Bundle créé',
        description: 'Le bundle a été créé avec succès',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour un bundle
 */
export function useUpdateBundle() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bundleId,
      bundleData,
      items,
    }: {
      bundleId: string;
      bundleData?: Partial<Bundle>;
      items?: Array<{
        id?: string;
        product_id: string;
        variant_id?: string;
        quantity: number;
        price: number;
        is_required?: boolean;
        display_order?: number;
      }>;
    }) => {
      // Mettre à jour le bundle si nécessaire
      if (bundleData) {
        // Recalculer les prix si les items sont modifiés
        if (items && items.length > 0) {
          const originalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const bundlePrice = bundleData.bundle_price || 0;
          const discountAmount = originalPrice - bundlePrice;
          const discountPercentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0;

          bundleData.original_price = originalPrice;
          bundleData.discount_percentage = discountPercentage;
          bundleData.discount_amount = discountAmount;
        }

        const { error: updateError } = await supabase
          .from('product_bundles')
          .update(bundleData)
          .eq('id', bundleId);

        if (updateError) throw updateError;
      }

      // Mettre à jour les items si fournis
      if (items) {
        // Supprimer les anciens items
        await supabase.from('bundle_items').delete().eq('bundle_id', bundleId);

        // Insérer les nouveaux items
        const itemsToInsert = items.map((item, index) => ({
          bundle_id: bundleId,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price: item.price,
          is_required: item.is_required ?? true,
          display_order: item.display_order ?? index,
        }));

        const { error: itemsError } = await supabase
          .from('bundle_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      queryClient.invalidateQueries({ queryKey: ['bundle'] });
      toast({
        title: 'Bundle mis à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Vérifier la disponibilité d'un bundle (inventaire)
 */
export function useCheckBundleAvailability() {
  return useMutation({
    mutationFn: async (bundleId: string) => {
      // Récupérer le bundle avec ses items
      const { data: bundle, error: bundleError } = await supabase
        .from('product_bundles')
        .select('track_inventory, total_quantity')
        .eq('id', bundleId)
        .single();

      if (bundleError) throw bundleError;

      // Si le bundle ne suit pas l'inventaire, il est toujours disponible
      if (!bundle.track_inventory) {
        return { available: true, quantity: null };
      }

      // Vérifier la quantité disponible
      const available = (bundle.total_quantity || 0) > 0;
      return { available, quantity: bundle.total_quantity || 0 };
    },
  });
}

/**
 * Appliquer une promotion automatique à un bundle
 */
export function useApplyBundlePromotion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bundleId,
      discountPercentage,
      discountAmount,
    }: {
      bundleId: string;
      discountPercentage?: number;
      discountAmount?: number;
    }) => {
      // Récupérer le bundle
      const { data: bundle, error: fetchError } = await supabase
        .from('product_bundles')
        .select('original_price, bundle_price')
        .eq('id', bundleId)
        .single();

      if (fetchError) throw fetchError;

      let newBundlePrice = bundle.bundle_price;
      let newDiscountAmount = bundle.original_price - bundle.bundle_price;
      let newDiscountPercentage = bundle.original_price > 0
        ? ((bundle.original_price - bundle.bundle_price) / bundle.original_price) * 100
        : 0;

      // Appliquer la promotion
      if (discountPercentage !== undefined) {
        newDiscountPercentage = discountPercentage;
        newDiscountAmount = (bundle.original_price * discountPercentage) / 100;
        newBundlePrice = bundle.original_price - newDiscountAmount;
      } else if (discountAmount !== undefined) {
        newDiscountAmount = discountAmount;
        newBundlePrice = bundle.original_price - discountAmount;
        newDiscountPercentage = bundle.original_price > 0
          ? (discountAmount / bundle.original_price) * 100
          : 0;
      }

      // Mettre à jour le bundle
      const { error: updateError } = await supabase
        .from('product_bundles')
        .update({
          bundle_price: newBundlePrice,
          discount_percentage: newDiscountPercentage,
          discount_amount: newDiscountAmount,
        })
        .eq('id', bundleId);

      if (updateError) throw updateError;

      return {
        bundle_price: newBundlePrice,
        discount_percentage: newDiscountPercentage,
        discount_amount: newDiscountAmount,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bundles'] });
      queryClient.invalidateQueries({ queryKey: ['bundle'] });
      toast({
        title: 'Promotion appliquée',
        description: 'La promotion a été appliquée au bundle',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

