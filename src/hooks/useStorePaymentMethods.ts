/**
 * Hook: useStorePaymentMethods
 * Description: Gère les méthodes de paiement sauvegardées pour les retraits
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { 
  SavedStorePaymentMethod, 
  StorePaymentMethodForm,
  StorePaymentMethod as PaymentMethodType
} from '@/types/store-withdrawals';

interface UseStorePaymentMethodsOptions {
  storeId?: string;
  paymentMethod?: PaymentMethodType;
  activeOnly?: boolean;
}

export const useStorePaymentMethods = (options: UseStorePaymentMethodsOptions = {}) => {
  const { storeId, paymentMethod, activeOnly = true } = options;
  const { toast } = useToast();
  
  const [paymentMethods, setPaymentMethods] = useState<SavedStorePaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPaymentMethods = useCallback(async () => {
    if (!storeId) {
      setPaymentMethods([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let  query= supabase
        .from('store_payment_methods')
        .select('*')
        .eq('store_id', storeId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      if (paymentMethod) {
        query = query.eq('payment_method', paymentMethod);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setPaymentMethods(data || []);
    } catch ( _err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error fetching payment methods', { error: err });
      setError(err instanceof Error ? err : new Error(String(err)));
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les méthodes de paiement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, paymentMethod, activeOnly, toast]);

  const createPaymentMethod = useCallback(async (formData: StorePaymentMethodForm): Promise<SavedStorePaymentMethod | null> => {
    if (!storeId) {
      toast({
        title: 'Erreur',
        description: 'Store ID manquant',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error: createError } = await supabase
        .from('store_payment_methods')
        .insert({
          store_id: storeId,
          payment_method: formData.payment_method,
          label: formData.label,
          payment_details: formData.payment_details,
          is_default: formData.is_default || false,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Succès',
        description: 'Méthode de paiement ajoutée avec succès',
      });

      await fetchPaymentMethods();
      return data;
    } catch ( _err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error creating payment method', { error: err });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible d\'ajouter la méthode de paiement',
        variant: 'destructive',
      });
      return null;
    }
  }, [storeId, toast, fetchPaymentMethods]);

  const updatePaymentMethod = useCallback(async (
    id: string, 
    formData: Partial<StorePaymentMethodForm>
  ): Promise<SavedStorePaymentMethod | null> => {
    try {
      const  updateData: Record<string, unknown> = {};
      
      if (formData.label !== undefined) updateData.label = formData.label;
      if (formData.payment_details !== undefined) updateData.payment_details = formData.payment_details;
      if (formData.is_default !== undefined) updateData.is_default = formData.is_default;
      if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
      if (formData.notes !== undefined) updateData.notes = formData.notes || null;

      const { data, error: updateError } = await supabase
        .from('store_payment_methods')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: 'Succès',
        description: 'Méthode de paiement mise à jour',
      });

      await fetchPaymentMethods();
      return data;
    } catch ( _err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error updating payment method', { error: err });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de mettre à jour la méthode de paiement',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, fetchPaymentMethods]);

  const deletePaymentMethod = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('store_payment_methods')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Succès',
        description: 'Méthode de paiement supprimée',
      });

      await fetchPaymentMethods();
      return true;
    } catch ( _err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error deleting payment method', { error: err });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de supprimer la méthode de paiement',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, fetchPaymentMethods]);

  const setAsDefault = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Récupérer la méthode pour connaître son type
      const method = paymentMethods.find(m => m.id === id);
      if (!method) {
        toast({
          title: 'Erreur',
          description: 'Méthode de paiement introuvable',
          variant: 'destructive',
        });
        return false;
      }

      // Mettre à jour cette méthode comme default
      const { error: updateError } = await supabase
        .from('store_payment_methods')
        .update({ is_default: true })
        .eq('id', id);

      if (updateError) throw updateError;

      // Le trigger SQL s'occupera de désactiver les autres defaults du même type
      await fetchPaymentMethods();
      
      toast({
        title: 'Succès',
        description: 'Méthode de paiement définie par défaut',
      });

      return true;
    } catch ( _err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error setting default payment method', { error: err });
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de définir la méthode par défaut',
        variant: 'destructive',
      });
      return false;
    }
  }, [paymentMethods, toast, fetchPaymentMethods]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    paymentMethods,
    loading,
    error,
    refetch: fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    setAsDefault,
  };
};







