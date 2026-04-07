/**
 * Hook pour gérer les dédicaces artistes
 * Date: 1 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface ArtistDedication {
  id: string;
  artist_product_id: string;
  product_id: string;
  order_id?: string;
  dedication_text: string;
  recipient_name?: string;
  font_style: 'standard' | 'elegant' | 'casual' | 'formal';
  text_position: 'top' | 'center' | 'bottom';
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string;
  notes?: string;
  preview_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DedicationTemplate {
  id: string;
  artist_product_id: string;
  store_id: string;
  name: string;
  template_text: string;
  font_style: 'standard' | 'elegant' | 'casual' | 'formal';
  text_position: 'top' | 'center' | 'bottom';
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDedicationInput {
  artist_product_id: string;
  product_id: string;
  order_id?: string;
  dedication_text: string;
  recipient_name?: string;
  font_style?: 'standard' | 'elegant' | 'casual' | 'formal';
  text_position?: 'top' | 'center' | 'bottom';
  notes?: string;
}

/**
 * Récupère les dédicaces d'un produit artiste
 */
export const useArtistDedications = (productId: string) => {
  return useQuery({
    queryKey: ['artist-dedications', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_product_dedications')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching artist dedications', { error, productId });
        throw error;
      }

      return (data || []) as ArtistDedication[];
    },
    enabled: !!productId,
  });
};

/**
 * Récupère les templates de dédicaces
 */
export const useDedicationTemplates = (artistProductId: string) => {
  return useQuery({
    queryKey: ['dedication-templates', artistProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artist_dedication_templates')
        .select('*')
        .eq('artist_product_id', artistProductId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching dedication templates', { error, artistProductId });
        throw error;
      }

      return (data || []) as DedicationTemplate[];
    },
    enabled: !!artistProductId,
  });
};

/**
 * Crée une nouvelle dédicace
 */
export const useCreateDedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDedicationInput) => {
      const { data, error } = await supabase
        .from('artist_product_dedications')
        .insert({
          ...input,
          font_style: input.font_style || 'standard',
          text_position: input.text_position || 'center',
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating dedication', { error, input });
        throw error;
      }

      return data as ArtistDedication;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artist-dedications', variables.product_id] });
    },
  });
};

/**
 * Met à jour une dédicace
 */
export const useUpdateDedication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ArtistDedication> & { id: string }) => {
      const { data, error } = await supabase
        .from('artist_product_dedications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating dedication', { error, id, updates });
        throw error;
      }

      return data as ArtistDedication;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['artist-dedications', data.product_id] });
    },
  });
};







