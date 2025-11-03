/**
 * Hook useCart - Gestion complète du panier
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Ajout/Modification/Suppression produits
 * - Support variants (physiques)
 * - Calculs automatiques (subtotal, taxes, shipping)
 * - Persistance base de données
 * - Sync localStorage + DB
 * - Support paniers anonymes (session)
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { CartItem, CartSummary, AddToCartOptions, UpdateCartItemOptions } from '@/types/cart';

const CART_QUERY_KEY = ['cart'];

/**
 * Génère ou récupère un session ID pour paniers anonymes
 */
function getSessionId(): string {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Hook principal useCart
 */
export function useCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId] = useState(() => getSessionId());
  // Récupérer l'utilisateur de manière synchrone au besoin
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch cart items
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async (): Promise<CartItem[]> => {
      let query = supabase
        .from('cart_items')
        .select('*')
        .order('added_at', { ascending: false });

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching cart:', error);
        throw error;
      }

      return (data as CartItem[]) || [];
    },
    enabled: true,
    staleTime: 1000 * 60, // 1 minute
  });

  // Calculer le summary
  const summary: CartSummary = {
    subtotal: items.reduce((sum, item) => {
      const itemPrice = (item.unit_price - (item.discount_amount || 0)) * item.quantity;
      return sum + itemPrice;
    }, 0),
    discount_amount: items.reduce((sum, item) => (item.discount_amount || 0) * item.quantity, 0),
    tax_amount: 0, // Calculé côté checkout selon pays
    shipping_amount: 0, // Calculé côté checkout selon adresse
    total: 0,
    item_count: items.length,
  };

  summary.total = summary.subtotal + summary.tax_amount + summary.shipping_amount;

  /**
   * Ajouter un produit au panier
   */
  const addItem = useMutation({
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

      // Prix final (promotional ou normal)
      const finalPrice = product.promotional_price || product.price;

      // Vérifier si le produit existe déjà dans le panier
      let query = supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', options.product_id);

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      if (options.variant_id) {
        query = query.eq('variant_id', options.variant_id);
      } else {
        query = query.is('variant_id', null);
      }

      const { data: existingItems } = await query;

      // Si existe déjà, augmenter la quantité
      if (existingItems && existingItems.length > 0) {
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + (options.quantity || 1);

        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated as CartItem;
      }

      // Sinon, créer un nouvel item
      const newItem: Partial<CartItem> = {
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
        product_id: options.product_id,
        product_type: options.product_type,
        product_name: product.name,
        product_image_url: product.image_url,
        variant_id: options.variant_id || null,
        variant_name: options.variant_name || null,
        quantity: options.quantity || 1,
        unit_price: finalPrice,
        currency: product.currency || 'XOF',
        coupon_code: options.coupon_code || null,
        metadata: options.metadata || {},
      };

      const { data: inserted, error: insertError } = await supabase
        .from('cart_items')
        .insert(newItem)
        .select()
        .single();

      if (insertError) throw insertError;

      return inserted as CartItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Ajouté au panier',
        description: 'Le produit a été ajouté avec succès',
      });
    },
    onError: (error: any) => {
      logger.error('Error adding to cart:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    },
  });

  /**
   * Modifier un item du panier
   */
  const updateItem = useMutation({
    mutationFn: async (options: UpdateCartItemOptions) => {
      const updates: Partial<CartItem> = {};

      if (options.quantity !== undefined) {
        if (options.quantity <= 0) {
          // Supprimer si quantité = 0
          return removeItem.mutateAsync(options.item_id);
        }
        updates.quantity = options.quantity;
      }

      if (options.variant_id !== undefined) {
        updates.variant_id = options.variant_id;
      }

      const { data: updated, error } = await supabase
        .from('cart_items')
        .update(updates)
        .eq('id', options.item_id)
        .select()
        .single();

      if (error) throw error;
      return updated as CartItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error: any) => {
      logger.error('Error updating cart item:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier le panier',
        variant: 'destructive',
      });
    },
  });

  /**
   * Supprimer un item du panier
   */
  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Retiré du panier',
        description: 'L\'article a été retiré',
      });
    },
    onError: (error: any) => {
      logger.error('Error removing cart item:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de retirer l\'article',
        variant: 'destructive',
      });
    },
  });

  /**
   * Vider le panier
   */
  const clearCart = useMutation({
    mutationFn: async () => {
      let query = supabase.from('cart_items').delete();

      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('session_id', sessionId);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Panier vidé',
        description: 'Tous les articles ont été retirés',
      });
    },
    onError: (error: any) => {
      logger.error('Error clearing cart:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de vider le panier',
        variant: 'destructive',
      });
    },
  });

  /**
   * Appliquer un coupon
   */
  const applyCoupon = useMutation({
    mutationFn: async (couponCode: string) => {
      // TODO: Vérifier validité du coupon dans table coupons
      // Pour l'instant, placeholder
      const { error } = await supabase
        .from('cart_items')
        .update({ coupon_code: couponCode })
        .or(`user_id.eq.${user?.id},session_id.eq.${sessionId}`);

      if (error) throw error;
      return { valid: true, message: 'Coupon appliqué' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Coupon appliqué',
        description: 'La remise a été appliquée',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Coupon invalide',
        description: error.message || 'Ce code promo n\'est pas valide',
        variant: 'destructive',
      });
    },
  });

  return {
    items,
    summary,
    isLoading,
    error: error?.message || null,
    addItem: addItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    removeItem: removeItem.mutateAsync,
    clearCart: clearCart.mutateAsync,
    applyCoupon: applyCoupon.mutateAsync,
    itemCount: items.length,
    isEmpty: items.length === 0,
  };
}

