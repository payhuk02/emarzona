/**
 * Batch Shipping Management Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les expéditions par lots et génération d'étiquettes multiples
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface BatchShipment {
  id: string;
  store_id: string;
  batch_number: string;
  batch_name?: string;
  status: 'pending' | 'processing' | 'label_generated' | 'shipped' | 'completed' | 'cancelled';
  total_orders: number;
  processed_orders: number;
  failed_orders: number;
  carrier_id?: string;
  carrier_name?: string;
  created_by?: string;
  processed_by?: string;
  processed_at?: string;
  completed_at?: string;
  notes?: string;
  error_log: Array<{ order_id: string; error: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

export interface BatchShipmentOrder {
  id: string;
  batch_shipment_id: string;
  order_id: string;
  order_in_batch: number;
  status: 'pending' | 'processing' | 'label_generated' | 'shipped' | 'failed' | 'skipped';
  shipping_label_id?: string;
  tracking_number?: string;
  error_message?: string;
  error_details?: Record<string, any>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BatchLabelTemplate {
  id: string;
  store_id: string;
  template_name: string;
  template_type: '4x6' | 'a4' | 'thermal' | 'custom';
  layout_config: Record<string, any>;
  include_tracking: boolean;
  include_barcode: boolean;
  include_instructions: boolean;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useBatchShipments - Récupère les lots d'expédition
 */
export const useBatchShipments = (storeId?: string, filters?: {
  status?: BatchShipment['status'];
}) => {
  return useQuery({
    queryKey: ['batch-shipments', storeId, filters],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      let query = supabase
        .from('batch_shipments')
        .select(`
          *,
          carrier:shipping_carriers (id, name)
        `)
        .eq('store_id', storeId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching batch shipments', { error, storeId });
        throw error;
      }

      return (data || []) as BatchShipment[];
    },
    enabled: !!storeId,
  });
};

/**
 * useBatchShipmentOrders - Récupère les commandes d'un lot
 */
export const useBatchShipmentOrders = (batchId?: string) => {
  return useQuery({
    queryKey: ['batch-shipment-orders', batchId],
    queryFn: async () => {
      if (!batchId) throw new Error('Batch ID manquant');

      const { data, error } = await supabase
        .from('batch_shipment_orders')
        .select(`
          *,
          order:orders (
            id,
            order_number,
            customer_email,
            customer_name,
            shipping_address,
            status
          ),
          shipping_label:shipping_labels (
            id,
            tracking_number,
            label_url
          )
        `)
        .eq('batch_shipment_id', batchId)
        .order('order_in_batch', { ascending: true });

      if (error) {
        logger.error('Error fetching batch shipment orders', { error, batchId });
        throw error;
      }

      return (data || []) as BatchShipmentOrder[];
    },
    enabled: !!batchId,
  });
};

/**
 * useBatchLabelTemplates - Récupère les templates d'étiquettes
 */
export const useBatchLabelTemplates = (storeId?: string) => {
  return useQuery({
    queryKey: ['batch-label-templates', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID manquant');

      const { data, error } = await supabase
        .from('batch_label_templates')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching label templates', { error, storeId });
        throw error;
      }

      return (data || []) as BatchLabelTemplate[];
    },
    enabled: !!storeId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useCreateBatchShipment - Créer un nouveau lot
 */
export const useCreateBatchShipment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      orderIds,
      batchName,
      carrierId,
    }: {
      storeId: string;
      orderIds: string[];
      batchName?: string;
      carrierId?: string;
    }) => {
      // Générer numéro de lot
      const { data: batchNumber, error: batchNumberError } = await supabase.rpc('generate_batch_shipment_number');
      if (batchNumberError) throw batchNumberError;

      const { data: { user } } = await supabase.auth.getUser();

      // Créer le lot
      const { data: batch, error: batchError } = await supabase
        .from('batch_shipments')
        .insert({
          store_id: storeId,
          batch_number: batchNumber,
          batch_name: batchName,
          carrier_id: carrierId,
          total_orders: orderIds.length,
          created_by: user?.id,
          status: 'pending',
        })
        .select()
        .single();

      if (batchError) {
        logger.error('Error creating batch shipment', { error: batchError });
        throw batchError;
      }

      // Ajouter les commandes au lot
      const batchOrders = orderIds.map((orderId, index) => ({
        batch_shipment_id: batch.id,
        order_id: orderId,
        order_in_batch: index + 1,
        status: 'pending',
      }));

      const { error: ordersError } = await supabase
        .from('batch_shipment_orders')
        .insert(batchOrders);

      if (ordersError) {
        logger.error('Error adding orders to batch', { error: ordersError });
        throw ordersError;
      }

      return batch as BatchShipment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch-shipments', data.store_id] });
      toast({
        title: '✅ Lot créé',
        description: `Le lot ${data.batch_number} a été créé avec ${data.total_orders} commande${data.total_orders > 1 ? 's' : ''}`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateBatchShipment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le lot',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useProcessBatchShipment - Traiter un lot (générer étiquettes)
 */
export const useProcessBatchShipment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      batchId,
      carrierId,
    }: {
      batchId: string;
      carrierId?: string;
    }) => {
      // Mettre à jour le statut du lot
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: batch, error: batchError } = await supabase
        .from('batch_shipments')
        .update({
          status: 'processing',
          processed_by: user?.id,
          processed_at: new Date().toISOString(),
          carrier_id: carrierId,
        })
        .eq('id', batchId)
        .select()
        .single();

      if (batchError) throw batchError;

      // Récupérer les commandes du lot
      const { data: batchOrders, error: ordersError } = await supabase
        .from('batch_shipment_orders')
        .select('*, order:orders (*)')
        .eq('batch_shipment_id', batchId)
        .eq('status', 'pending')
        .order('order_in_batch');

      if (ordersError) throw ordersError;

      // Traiter chaque commande (simplifié - à adapter selon votre système de génération d'étiquettes)
      const errors: Array<{ order_id: string; error: string; timestamp: string }> = [];
      
      for (const batchOrder of batchOrders || []) {
        try {
          // Mettre à jour le statut
          await supabase
            .from('batch_shipment_orders')
            .update({
              status: 'processing',
            })
            .eq('id', batchOrder.id);

          // Ici, vous appelleriez votre fonction de génération d'étiquette
          // Pour l'instant, on simule juste le traitement
          
          // Simuler génération d'étiquette (à remplacer par votre logique)
          await supabase
            .from('batch_shipment_orders')
            .update({
              status: 'label_generated',
              processed_at: new Date().toISOString(),
            })
            .eq('id', batchOrder.id);
        } catch (error: any) {
          errors.push({
            order_id: batchOrder.order_id,
            error: error.message || 'Erreur inconnue',
            timestamp: new Date().toISOString(),
          });

          await supabase
            .from('batch_shipment_orders')
            .update({
              status: 'failed',
              error_message: error.message,
            })
            .eq('id', batchOrder.id);
        }
      }

      // Mettre à jour le statut du lot
      await supabase.rpc('update_batch_shipment_status', {
        p_batch_id: batchId,
      });

      // Mettre à jour les erreurs
      if (errors.length > 0) {
        await supabase
          .from('batch_shipments')
          .update({
            error_log: errors,
          })
          .eq('id', batchId);
      }

      return batch as BatchShipment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['batch-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['batch-shipment-orders'] });
      toast({
        title: '✅ Lot traité',
        description: 'Le lot a été traité et les étiquettes générées',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useProcessBatchShipment', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de traiter le lot',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useGenerateBatchLabels - Générer les étiquettes d'un lot
 */
export const useGenerateBatchLabels = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      batchId,
      templateId,
    }: {
      batchId: string;
      templateId?: string;
    }) => {
      // Récupérer les commandes avec étiquettes générées
      const { data: batchOrders, error: ordersError } = await supabase
        .from('batch_shipment_orders')
        .select('*, shipping_label:shipping_labels (*)')
        .eq('batch_shipment_id', batchId)
        .eq('status', 'label_generated');

      if (ordersError) throw ordersError;

      // Générer PDF/étiquettes (simplifié - à adapter)
      // Ici vous appelleriez votre service de génération d'étiquettes
      
      return {
        batchId,
        labelsGenerated: batchOrders?.length || 0,
        pdfUrl: '#', // URL du PDF généré
      };
    },
    onSuccess: (data) => {
      toast({
        title: '✅ Étiquettes générées',
        description: `${data.labelsGenerated} étiquette${data.labelsGenerated > 1 ? 's' : ''} générée${data.labelsGenerated > 1 ? 's' : ''}`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useGenerateBatchLabels', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer les étiquettes',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useUpdateBatchStatus - Mettre à jour le statut d'un lot
 */
export const useUpdateBatchStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      batchId,
      status,
    }: {
      batchId: string;
      status: BatchShipment['status'];
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'shipped' || status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('batch_shipments')
        .update(updateData)
        .eq('id', batchId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating batch status', { error, batchId });
        throw error;
      }

      return data as BatchShipment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-shipments'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut du lot a été mis à jour',
      });
    },
    onError: (error: any) => {
      logger.error('Error in useUpdateBatchStatus', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    },
  });
};

