/**
 * Hook useDigitalBundles - Gestion des bundles de produits digitaux
 * Date: 26 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const BUNDLES_QUERY_KEY = ['digital-bundles'];

export interface DigitalBundle {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  image_url?: string;
  banner_url?: string;
  status: 'draft' | 'active' | 'inactive' | 'scheduled' | 'expired';
  original_price: number;
  bundle_price: number;
  discount_type: 'percentage' | 'fixed' | 'custom';
  discount_value: number;
  savings: number;
  savings_percentage: number;
  is_available: boolean;
  start_date?: string;
  end_date?: string;
  max_purchases?: number;
  current_purchases: number;
  bundle_items?: BundleItem[];
  created_at: string;
  updated_at: string;
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  order_index: number;
  product_price: number;
  is_visible: boolean;
  is_highlighted: boolean;
  product?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    price: number;
  };
}

/**
 * Récupérer tous les bundles d'une boutique
 */
export function useDigitalBundles(storeId: string) {
  return useQuery({
    queryKey: [...BUNDLES_QUERY_KEY, storeId],
    queryFn: async (): Promise<DigitalBundle[]> => {
      const { data, error } = await supabase
        .from('digital_bundles')
        .select(`
          *,
          digital_bundle_items (
            *,
            products (
              id,
              name,
              slug,
              description,
              image_url,
              price
            )
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching bundles:', error);
        throw error;
      }

      return (data as DigitalBundle[]) || [];
    },
    enabled: !!storeId,
  });
}

/**
 * Récupérer un bundle spécifique
 */
export function useDigitalBundle(bundleId: string) {
  return useQuery({
    queryKey: [...BUNDLES_QUERY_KEY, bundleId],
    queryFn: async (): Promise<DigitalBundle | null> => {
      const { data, error } = await supabase
        .from('digital_bundles')
        .select(`
          *,
          digital_bundle_items (
            *,
            products (
              id,
              name,
              slug,
              description,
              image_url,
              price
            )
          )
        `)
        .eq('id', bundleId)
        .single();

      if (error) {
        logger.error('Error fetching bundle:', error);
        throw error;
      }

      return data as DigitalBundle;
    },
    enabled: !!bundleId,
  });
}

/**
 * Récupérer les bundles actifs pour le marketplace
 */
export function useActiveBundles(limit?: number) {
  return useQuery({
    queryKey: [...BUNDLES_QUERY_KEY, 'active', limit],
    queryFn: async (): Promise<DigitalBundle[]> => {
      let query = supabase
        .from('digital_bundles')
        .select(`
          *,
          digital_bundle_items (
            *,
            products (
              id,
              name,
              slug,
              description,
              image_url,
              price
            )
          ),
          stores!inner (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq('status', 'active')
        .eq('is_available', true)
        .order('total_sales', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching active bundles:', error);
        throw error;
      }

      return (data as DigitalBundle[]) || [];
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
    mutationFn: async (bundleData: {
      store_id: string;
      name: string;
      slug: string;
      description?: string;
      short_description?: string;
      image_url?: string;
      original_price: number;
      bundle_price: number;
      discount_type: 'percentage' | 'fixed' | 'custom';
      discount_value: number;
      product_ids: string[];
    }): Promise<DigitalBundle> => {
      // Créer le bundle
      const { data: bundle, error: bundleError } = await supabase
        .from('digital_bundles')
        .insert({
          store_id: bundleData.store_id,
          name: bundleData.name,
          slug: bundleData.slug,
          description: bundleData.description,
          short_description: bundleData.short_description,
          image_url: bundleData.image_url,
          original_price: bundleData.original_price,
          bundle_price: bundleData.bundle_price,
          discount_type: bundleData.discount_type,
          discount_value: bundleData.discount_value,
          status: 'draft',
        })
        .select()
        .single();

      if (bundleError) {
        logger.error('Error creating bundle:', bundleError);
        throw bundleError;
      }

      // Récupérer les prix des produits
      const { data: products } = await supabase
        .from('products')
        .select('id, price')
        .in('id', bundleData.product_ids);

      // Créer les bundle items
      const bundleItems = bundleData.product_ids.map((productId, index) => {
        const product = products?.find(p => p.id === productId);
        return {
          bundle_id: bundle.id,
          product_id: productId,
          order_index: index,
          product_price: product?.price || 0,
          is_visible: true,
        };
      });

      const { error: itemsError } = await supabase
        .from('digital_bundle_items')
        .insert(bundleItems);

      if (itemsError) {
        logger.error('Error creating bundle items:', itemsError);
        throw itemsError;
      }

      return bundle as DigitalBundle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUNDLES_QUERY_KEY });
      toast({
        title: '✅ Bundle créé',
        description: 'Le bundle a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating bundle:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le bundle',
        variant: 'destructive',
      });
    },
  });
}

