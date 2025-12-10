/**
 * Hook pour gérer les images avancées des produits physiques
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface PhysicalProductImage {
  id: string;
  image_url: string;
  image_type: 'standard' | '360' | 'video' | 'zoom';
  is_360: boolean;
  images_360_urls: string[];
  rotation_steps: number;
  supports_zoom: boolean;
  zoom_image_url?: string;
  zoom_levels: number;
  is_video: boolean;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration_seconds?: number;
  video_provider?: 'youtube' | 'vimeo' | 'direct' | 'self-hosted';
  variant_id?: string;
  display_order: number;
  alt_text?: string;
  caption?: string;
}

export interface CreatePhysicalProductImageInput {
  physical_product_id: string;
  product_id: string;
  image_url: string;
  image_type?: 'standard' | '360' | 'video' | 'zoom';
  is_360?: boolean;
  images_360_urls?: string[];
  rotation_steps?: number;
  supports_zoom?: boolean;
  zoom_image_url?: string;
  zoom_levels?: number;
  is_video?: boolean;
  video_url?: string;
  video_thumbnail_url?: string;
  video_duration_seconds?: number;
  video_provider?: 'youtube' | 'vimeo' | 'direct' | 'self-hosted';
  variant_id?: string;
  display_order?: number;
  alt_text?: string;
  caption?: string;
}

/**
 * Récupère les images avancées d'un produit physique
 */
export const usePhysicalProductImages = (productId: string) => {
  return useQuery({
    queryKey: ['physical-product-images', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Error fetching physical product images', { error, productId });
        throw error;
      }

      return (data || []) as PhysicalProductImage[];
    },
    enabled: !!productId,
  });
};

/**
 * Crée une nouvelle image avancée
 */
export const useCreatePhysicalProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePhysicalProductImageInput) => {
      const { data, error } = await supabase
        .from('physical_product_images')
        .insert(input)
        .select()
        .single();

      if (error) {
        logger.error('Error creating physical product image', { error, input });
        throw error;
      }

      return data as PhysicalProductImage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physical-product-images', variables.product_id] });
    },
  });
};

/**
 * Met à jour une image avancée
 */
export const useUpdatePhysicalProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PhysicalProductImage> & { id: string }) => {
      const { data, error } = await supabase
        .from('physical_product_images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating physical product image', { error, id, updates });
        throw error;
      }

      return data as PhysicalProductImage;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['physical-product-images', data.product_id] });
    },
  });
};

/**
 * Supprime une image avancée
 */
export const useDeletePhysicalProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('physical_product_images')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting physical product image', { error, id });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physical-product-images', variables.productId] });
    },
  });
};

