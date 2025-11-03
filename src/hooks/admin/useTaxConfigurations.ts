/**
 * Hook useTaxConfigurations - Gestion des configurations de taxes (Admin)
 * Date: 26 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { TaxConfiguration } from '@/types/invoice';

const TAX_CONFIG_QUERY_KEY = ['tax-configurations'];

/**
 * Récupérer toutes les configurations de taxes
 */
export function useTaxConfigurations(storeId?: string) {
  return useQuery({
    queryKey: [...TAX_CONFIG_QUERY_KEY, storeId],
    queryFn: async (): Promise<TaxConfiguration[]> => {
      let query = supabase
        .from('tax_configurations')
        .select('*')
        .order('country_code', { ascending: true })
        .order('priority', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      } else {
        // Platform-wide only
        query = query.is('store_id', null);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching tax configurations:', error);
        throw error;
      }

      return (data as TaxConfiguration[]) || [];
    },
    enabled: true,
  });
}

/**
 * Récupérer une configuration spécifique
 */
export function useTaxConfiguration(taxId: string) {
  return useQuery({
    queryKey: [...TAX_CONFIG_QUERY_KEY, taxId],
    queryFn: async (): Promise<TaxConfiguration | null> => {
      const { data, error } = await supabase
        .from('tax_configurations')
        .select('*')
        .eq('id', taxId)
        .single();

      if (error) {
        logger.error('Error fetching tax configuration:', error);
        throw error;
      }

      return data as TaxConfiguration;
    },
    enabled: !!taxId,
  });
}

/**
 * Créer une nouvelle configuration de taxe
 */
export function useCreateTaxConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TaxConfiguration>): Promise<TaxConfiguration> => {
      const { data: config, error } = await supabase
        .from('tax_configurations')
        .insert({
          store_id: data.store_id || null,
          country_code: data.country_code,
          state_province: data.state_province || null,
          tax_type: data.tax_type || 'VAT',
          tax_name: data.tax_name,
          rate: data.rate,
          applies_to_product_types: data.applies_to_product_types || null,
          applies_to_shipping: data.applies_to_shipping || false,
          tax_inclusive: data.tax_inclusive || false,
          priority: data.priority || 0,
          effective_from: data.effective_from || new Date().toISOString().split('T')[0],
          effective_to: data.effective_to || null,
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating tax configuration:', error);
        throw error;
      }

      return config as TaxConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_CONFIG_QUERY_KEY });
      toast({
        title: '✅ Configuration créée',
        description: 'La configuration de taxe a été créée avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating tax configuration:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la configuration',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mettre à jour une configuration de taxe
 */
export function useUpdateTaxConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<TaxConfiguration> & { id: string }): Promise<TaxConfiguration> => {
      const { data: config, error } = await supabase
        .from('tax_configurations')
        .update({
          country_code: data.country_code,
          state_province: data.state_province,
          tax_type: data.tax_type,
          tax_name: data.tax_name,
          rate: data.rate,
          applies_to_product_types: data.applies_to_product_types,
          applies_to_shipping: data.applies_to_shipping,
          tax_inclusive: data.tax_inclusive,
          priority: data.priority,
          effective_from: data.effective_from,
          effective_to: data.effective_to,
          is_active: data.is_active,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating tax configuration:', error);
        throw error;
      }

      return config as TaxConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_CONFIG_QUERY_KEY });
      toast({
        title: '✅ Configuration mise à jour',
        description: 'La configuration de taxe a été mise à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error updating tax configuration:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour la configuration',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Supprimer une configuration de taxe
 */
export function useDeleteTaxConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taxId: string): Promise<void> => {
      const { error } = await supabase
        .from('tax_configurations')
        .delete()
        .eq('id', taxId);

      if (error) {
        logger.error('Error deleting tax configuration:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAX_CONFIG_QUERY_KEY });
      toast({
        title: '✅ Configuration supprimée',
        description: 'La configuration de taxe a été supprimée',
      });
    },
    onError: (error: any) => {
      logger.error('Error deleting tax configuration:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la configuration',
        variant: 'destructive',
      });
    },
  });
}

