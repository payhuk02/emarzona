/**
 * Hook pour récupérer les images des variantes
 * Date: 3 Février 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface VariantImage {
  id: string;
  variant_id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  file_size?: number;
  width?: number;
  height?: number;
  created_at: string;
}

export interface VariantWithImages {
  id: string;
  option1_value: string;
  option2_value?: string;
  option3_value?: string;
  sku?: string;
  price: number;
  images: VariantImage[];
}

/**
 * Récupère toutes les images pour toutes les variantes d'un produit
 */
export function useVariantImages(physicalProductId: string | undefined) {
  return useQuery({
    queryKey: ['variant-images', physicalProductId],
    queryFn: async () => {
      if (!physicalProductId) throw new Error('Physical Product ID manquant');

      // Récupérer toutes les variantes avec leurs images
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select('id, option1_value, option2_value, option3_value, sku, price')
        .eq('physical_product_id', physicalProductId);

      if (variantsError) throw variantsError;

      // Récupérer toutes les images des variantes
      const variantIds = variants?.map(v => v.id) || [];

      if (variantIds.length === 0) {
        return [] as VariantWithImages[];
      }

      const { data: images, error: imagesError } = await supabase
        .from('variant_images')
        .select('*')
        .in('variant_id', variantIds)
        .order('display_order', { ascending: true });

      if (imagesError) {
        logger.warn('Error fetching variant images', { error: imagesError });
        // Ne pas faire échouer la requête si les images ne sont pas disponibles
      }

      // Grouper les images par variant
      const  variantsWithImages: VariantWithImages[] = (variants || []).map(variant => {
        const variantImages = (images || []).filter(img => img.variant_id === variant.id);

        return {
          id: variant.id,
          option1_value: variant.option1_value,
          option2_value: variant.option2_value,
          option3_value: variant.option3_value,
          sku: variant.sku,
          price: variant.price,
          images: variantImages.map(img => ({
            id: img.id,
            variant_id: img.variant_id,
            url: img.url,
            alt_text: img.alt_text,
            is_primary: img.is_primary,
            display_order: img.display_order,
            file_size: img.file_size,
            width: img.width,
            height: img.height,
            created_at: img.created_at,
          })),
        };
      });

      return variantsWithImages;
    },
    enabled: !!physicalProductId,
  });
}

/**
 * Récupère les images d'une variante spécifique
 */
export function useVariantImagesByVariant(variantId: string | undefined) {
  return useQuery({
    queryKey: ['variant-images', variantId],
    queryFn: async () => {
      if (!variantId) throw new Error('Variant ID manquant');

      const { data, error } = await supabase
        .from('variant_images')
        .select('*')
        .eq('variant_id', variantId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(img => ({
        id: img.id,
        variant_id: img.variant_id,
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
        display_order: img.display_order,
        file_size: img.file_size,
        width: img.width,
        height: img.height,
        created_at: img.created_at,
      })) as VariantImage[];
    },
    enabled: !!variantId,
  });
}







