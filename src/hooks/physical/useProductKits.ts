/**
 * Product Kits Management Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les kits produits et assemblages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface ProductKit {
  id: string;
  store_id: string;
  kit_product_id: string;
  kit_name: string;
  kit_description?: string;
  kit_type: 'fixed' | 'flexible' | 'bundle' | 'assembly';
  min_items: number;
  max_items?: number;
  kit_price?: number;
  discount_percentage: number;
  discount_amount: number;
  track_kit_inventory: boolean;
  track_components_inventory: boolean;
  auto_allocate: boolean;
  requires_assembly: boolean;
  assembly_time_minutes?: number;
  assembly_instructions?: string;
  assembly_required: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface KitComponent {
  id: string;
  kit_id: string;
  component_product_id: string;
  component_variant_id?: string;
  quantity: number;
  is_required: boolean;
  is_option: boolean;
  price_override?: number;
  use_component_price: boolean;
  display_order: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface KitAssembly {
  id: string;
  kit_id: string;
  order_id: string;
  order_item_id?: string;
  assembly_number: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  started_date?: string;
  completed_date?: string;
  estimated_completion_date?: string;
  assigned_to?: string;
  assembled_by?: string;
  components_used: Array<{
    component_id: string;
    quantity: number;
    serial_number?: string;
  }>;
  notes?: string;
  quality_check_passed?: boolean;
  quality_check_notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useProductKits - Récupère les kits d'un store
 */
export const useProductKits = (storeId?: string, filters?: {
  productId?: string;
  kitType?: ProductKit['kit_type'];
}) => {
  return useQuery({
    queryKey: ['product-kits', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('product_kits')
        .select(`
          *,
          kit_product:products!kit_product_id (
            id,
            name,
            image_url
          )
        `)
        .eq('store_id', storeId);

      if (filters?.productId) {
        query = query.eq('kit_product_id', filters.productId);
      }
      if (filters?.kitType) {
        query = query.eq('kit_type', filters.kitType);
      }

      query = query.eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('kit_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching product kits', { error, storeId });
        throw error;
      }

      return (data || []) as ProductKit[];
    },
    enabled: !!storeId,
  });
};

/**
 * useKitComponents - Récupère les composants d'un kit
 */
export const useKitComponents = (kitId?: string) => {
  return useQuery({
    queryKey: ['kit-components', kitId],
    queryFn: async () => {
      if (!kitId) throw new Error('Kit ID manquant');

      const { data, error } = await supabase
        .from('kit_components')
        .select(`
          *,
          component_product:products!component_product_id (
            id,
            name,
            image_url,
            price
          ),
          component_variant:product_variants!component_variant_id (
            id,
            option1_value,
            option2_value,
            price
          )
        `)
        .eq('kit_id', kitId)
        .order('display_order', { ascending: true })
        .order('is_required', { ascending: false });

      if (error) {
        logger.error('Error fetching kit components', { error, kitId });
        throw error;
      }

      return (data || []) as KitComponent[];
    },
    enabled: !!kitId,
  });
};

/**
 * useKitAssemblies - Récupère les assemblages
 */
export const useKitAssemblies = (kitId?: string, filters?: {
  orderId?: string;
  status?: KitAssembly['status'];
}) => {
  return useQuery({
    queryKey: ['kit-assemblies', kitId, filters],
    queryFn: async () => {
      if (!kitId) throw new Error('Kit ID manquant');

      let query = supabase
        .from('kit_assemblies')
        .select(`
          *,
          order:orders (id, order_number),
          kit:product_kits (id, kit_name)
        `)
        .eq('kit_id', kitId);

      if (filters?.orderId) {
        query = query.eq('order_id', filters.orderId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching kit assemblies', { error, kitId });
        throw error;
      }

      return (data || []) as KitAssembly[];
    },
    enabled: !!kitId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateProductKit - Créer un kit
 */
export const useCreateProductKit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (kitData: Partial<ProductKit>) => {
      const { data, error } = await supabase
        .from('product_kits')
        .insert({
          ...kitData,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating product kit', { error, kitData });
        throw error;
      }

      return data as ProductKit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-kits', data.store_id] });
      toast({
        title: '✅ Kit créé',
        description: 'Le kit produit a été créé avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateProductKit', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le kit',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateKitAssembly - Créer un assemblage
 */
export const useCreateKitAssembly = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      kitId,
      orderId,
      orderItemId,
      scheduledDate,
      estimatedCompletionDate,
      assignedTo,
    }: {
      kitId: string;
      orderId: string;
      orderItemId?: string;
      scheduledDate?: string;
      estimatedCompletionDate?: string;
      assignedTo?: string;
    }) => {
      // Générer numéro d'assemblage
      const { data: assemblyNumber, error: assemblyNumberError } = await supabase.rpc('generate_kit_assembly_number');
      if (assemblyNumberError) throw assemblyNumberError;

      // Créer assemblage
      const { data, error } = await supabase
        .from('kit_assemblies')
        .insert({
          kit_id: kitId,
          order_id: orderId,
          order_item_id: orderItemId,
          assembly_number: assemblyNumber,
          status: 'pending',
          scheduled_date: scheduledDate,
          estimated_completion_date: estimatedCompletionDate,
          assigned_to: assignedTo,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating kit assembly', { error });
        throw error;
      }

      return data as KitAssembly;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kit-assemblies', data.kit_id] });
      toast({
        title: '✅ Assemblage créé',
        description: `L'assemblage ${data.assembly_number} a été créé`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateKitAssembly', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'assemblage',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateAssemblyStatus - Mettre à jour le statut d'un assemblage
 */
export const useUpdateAssemblyStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      assemblyId,
      status,
      userId,
      qualityCheckPassed,
      qualityCheckNotes,
      componentsUsed,
    }: {
      assemblyId: string;
      status: KitAssembly['status'];
      userId?: string;
      qualityCheckPassed?: boolean;
      qualityCheckNotes?: string;
      componentsUsed?: Array<{ component_id: string; quantity: number; serial_number?: string }>;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Mettre à jour les dates selon le statut
      const now = new Date().toISOString();
      if (status === 'in_progress') {
        updateData.started_date = now;
        updateData.assembled_by = userId;
      } else if (status === 'completed') {
        updateData.completed_date = now;
        updateData.assembled_by = userId;
      }

      if (qualityCheckPassed !== undefined) {
        updateData.quality_check_passed = qualityCheckPassed;
      }
      if (qualityCheckNotes) {
        updateData.quality_check_notes = qualityCheckNotes;
      }
      if (componentsUsed) {
        updateData.components_used = componentsUsed;
      }

      const { data, error } = await supabase
        .from('kit_assemblies')
        .update(updateData)
        .eq('id', assemblyId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating assembly status', { error, assemblyId });
        throw error;
      }

      // Si terminé, mettre à jour l'inventaire
      if (status === 'completed' && componentsUsed) {
        // Récupérer le kit pour obtenir les composants
        const { data: assembly } = await supabase
          .from('kit_assemblies')
          .select('kit_id')
          .eq('id', assemblyId)
          .single();

        if (assembly) {
          // Réduire stock des composants utilisés
          for (const component of componentsUsed) {
            // Logique de mise à jour inventaire selon votre système
            // Cela dépendra de votre structure d'inventaire
          }
        }
      }

      return data as KitAssembly;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kit-assemblies'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de l\'assemblage a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateAssemblyStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCalculateKitPrice - Calculer le prix d'un kit
 */
export const useCalculateKitPrice = () => {
  return useMutation({
    mutationFn: async (kitId: string) => {
      const { data, error } = await supabase.rpc('calculate_kit_price', {
        p_kit_id: kitId,
      });

      if (error) {
        logger.error('Error calculating kit price', { error, kitId });
        throw error;
      }

      return data as number;
    },
  });
};

