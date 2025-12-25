/**
 * useCartOptimistic Hook
 * Date: 28 Janvier 2025
 * 
 * Hook panier avec optimistic updates pour meilleure UX
 */

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useMutationWithRetry } from '@/hooks/useMutationWithRetry';
import {
  applyOptimisticUpdate,
  rollbackOptimisticUpdate,
  createListOptimisticUpdate,
} from '@/lib/optimistic-updates';
import type { CartItem, AddToCartOptions, UpdateCartItemOptions } from '@/types/cart';

const CART_QUERY_KEY = ['cart'];

/**
 * Hook pour ajouter un item au panier avec optimistic update
 */
export function useAddToCartOptimistic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listUpdate = createListOptimisticUpdate<CartItem, AddToCartOptions>(
    CART_QUERY_KEY,
    (variables) => {
      // Créer un item temporaire (sera remplacé par la vraie réponse)
      return {
        id: `temp-${Date.now()}`,
        product_id: variables.product_id,
        variant_id: variables.variant_id || null,
        quantity: variables.quantity || 1,
        unit_price: 0, // Sera mis à jour avec la vraie réponse
        discount_amount: null,
        added_at: new Date().toISOString(),
        user_id: null,
        session_id: null,
      } as CartItem;
    }
  );

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur panier',
    mutationFn: async (options: AddToCartOptions) => {
      // Récupérer les détails du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, image_url, price, currency, promotional_price, product_type')
        .eq('id', options.product_id)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      const finalPrice = product.promotional_price || product.price;

      // Vérifier si le produit existe déjà
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', options.product_id);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        const sessionId = localStorage.getItem('cart_session_id') || `session_${Date.now()}`;
        query = query.eq('session_id', sessionId);
      }

      if (options.variant_id) {
        query = query.eq('variant_id', options.variant_id);
      }

      const { data: existingItem } = await query.single();

      if (existingItem) {
        // Mettre à jour la quantité
        const newQuantity = (existingItem.quantity || 0) + (options.quantity || 1);
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (error) throw error;
        return data as CartItem;
      } else {
        // Créer un nouvel item
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            product_id: options.product_id,
            variant_id: options.variant_id || null,
            quantity: options.quantity || 1,
            unit_price: finalPrice,
            user_id: user?.id || null,
            session_id: user ? null : localStorage.getItem('cart_session_id') || `session_${Date.now()}`,
          })
          .select()
          .single();

        if (error) throw error;
        return data as CartItem;
      }
    },
    onMutate: async (variables) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      // Sauvegarder l'état actuel
      const previousData = queryClient.getQueryData<CartItem[]>(CART_QUERY_KEY);

      // Appliquer optimistic update
      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEY, (oldData) => {
        return listUpdate.add(oldData, variables);
      });

      return previousData;
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context) {
        queryClient.setQueryData(CART_QUERY_KEY, context);
      }

      logger.error('Erreur ajout panier', { error, variables });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le produit au panier',
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      // Remplacer l'item temporaire par la vraie réponse
      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEY, (oldData) => {
        if (!oldData) return [data];
        
        // Remplacer l'item temporaire
        const index = oldData.findIndex((item) => item.id?.startsWith('temp-'));
        if (index !== -1) {
          const updated = [...oldData];
          updated[index] = data;
          return updated;
        }
        
        // Ou ajouter si pas trouvé
        return [data, ...oldData];
      });

      toast({
        title: '✅ Ajouté au panier',
        description: 'Le produit a été ajouté au panier',
      });
    },
    onSettled: () => {
      // Invalider pour s'assurer d'avoir les dernières données
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

/**
 * Hook pour mettre à jour un item du panier avec optimistic update
 */
export function useUpdateCartItemOptimistic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listUpdate = createListOptimisticUpdate<CartItem, UpdateCartItemOptions>(
    CART_QUERY_KEY,
    () => ({} as CartItem), // Pas utilisé pour update
    (item, variables) => item.id === variables.item_id,
    (item, variables) => ({
      ...item,
      quantity: variables.quantity ?? item.quantity,
      unit_price: variables.unit_price ?? item.unit_price,
    })
  );

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur panier',
    mutationFn: async (options: UpdateCartItemOptions) => {
      const updates: Partial<CartItem> = {};
      if (options.quantity !== undefined) updates.quantity = options.quantity;
      if (options.unit_price !== undefined) updates.unit_price = options.unit_price;

      const { data, error } = await supabase
        .from('cart_items')
        .update(updates)
        .eq('id', options.item_id)
        .select()
        .single();

      if (error) throw error;
      return data as CartItem;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      const previousData = queryClient.getQueryData<CartItem[]>(CART_QUERY_KEY);

      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEY, (oldData) => {
        return listUpdate.update(oldData, variables);
      });

      return previousData;
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(CART_QUERY_KEY, context);
      }

      logger.error('Erreur mise à jour panier', { error, variables });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le panier',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ Panier mis à jour',
        description: 'Le panier a été mis à jour',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

/**
 * Hook pour supprimer un item du panier avec optimistic update
 */
export function useRemoveFromCartOptimistic() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const listUpdate = createListOptimisticUpdate<CartItem, { item_id: string }>(
    CART_QUERY_KEY,
    () => ({} as CartItem), // Pas utilisé pour delete
    undefined,
    undefined,
    (item, variables) => item.id === variables.item_id
  );

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur panier',
    mutationFn: async ({ item_id }: { item_id: string }) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', item_id);

      if (error) throw error;
      return item_id;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      const previousData = queryClient.getQueryData<CartItem[]>(CART_QUERY_KEY);

      queryClient.setQueryData<CartItem[]>(CART_QUERY_KEY, (oldData) => {
        return listUpdate.remove(oldData, variables);
      });

      return previousData;
    },
    onError: (error, variables, context) => {
      if (context) {
        queryClient.setQueryData(CART_QUERY_KEY, context);
      }

      logger.error('Erreur suppression panier', { error, variables });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'item du panier',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ Item supprimé',
        description: 'L\'item a été supprimé du panier',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

