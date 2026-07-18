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

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { assertCanAddServiceToCart } from '@/lib/cart/service-cart-policy';
import { assertCompatibleCartAddition } from '@/lib/cart/mixed-cart-policy';
import { assertPhysicalStockAvailable } from '@/lib/cart/physical-stock-validation';
import { getCartItemStoreId } from '@/lib/checkout/cart-validation';
import {
  fetchCartItems,
  fetchProductForCart,
  fetchStoreCartMedia,
  findExistingCartLine,
  updateCartItemQuantity,
  insertCartItem,
  patchCartItem,
  deleteCartItemById,
  clearCartItems,
  type CartItemInsert,
  type CartItemUpdate,
  type Json,
} from '@/lib/cart/cart-data';
import type { User } from '@supabase/supabase-js';
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

function getCartScope(user: User | null, sessionId: string) {
  return user ? { userId: user.id } : { sessionId };
}

/**
 * Hook principal useCart
 */
export function useCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionId] = useState(() => getSessionId());
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: async (): Promise<CartItem[]> => {
      try {
        return await fetchCartItems(getCartScope(user, sessionId));
      } catch (err) {
        logger.error('Error fetching cart:', err);
        throw err;
      }
    },
    enabled: true,
    staleTime: 1000 * 60,
  });

  const subtotal = items.reduce((sum, item) => {
    const itemPrice = (item.unit_price - (item.discount_amount || 0)) * item.quantity;
    return sum + itemPrice;
  }, 0);

  const itemDiscounts = items.reduce((sum, item) => (item.discount_amount || 0) * item.quantity, 0);

  const summary: CartSummary = {
    subtotal,
    discount_amount: itemDiscounts,
    tax_amount: 0,
    shipping_amount: 0,
    total: 0,
    item_count: items.length,
  };

  summary.total = Math.max(
    0,
    summary.subtotal - summary.discount_amount + summary.tax_amount + summary.shipping_amount
  );

  const addItem = useMutation({
    mutationFn: async (options: AddToCartOptions) => {
      const scope = getCartScope(user, sessionId);
      const product = await fetchProductForCart(options.product_id);

      if (options.product_type === 'service') {
        assertCanAddServiceToCart(options.metadata);
      }

      assertCompatibleCartAddition(items, {
        product_type: options.product_type,
        metadata: options.metadata,
        storeId: product.store_id,
      });

      const metadataRecord =
        options.metadata && typeof options.metadata === 'object' && !Array.isArray(options.metadata)
          ? { ...(options.metadata as Record<string, unknown>) }
          : {};

      if (
        !getCartItemStoreId({
          product_id: options.product_id,
          product_type: options.product_type,
          quantity: options.quantity ?? 1,
          unit_price: 0,
          metadata: metadataRecord,
        } as CartItem)
      ) {
        metadataRecord.store_id = product.store_id;
      }

      try {
        const storeMedia = await fetchStoreCartMedia(product.store_id);
        if (storeMedia) {
          metadataRecord.store_name = storeMedia.name;
          metadataRecord.store_slug = storeMedia.slug;
          if (storeMedia.placeholder_image_url) {
            metadataRecord.store_placeholder_image_url = storeMedia.placeholder_image_url;
          }
        }
      } catch {
        // Non-blocking enrichment
      }

      const finalPrice = product.promotional_price || product.price;

      const existingItem = await findExistingCartLine(
        scope,
        options.product_id,
        options.variant_id
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + (options.quantity || 1);
        if (options.product_type === 'physical') {
          await assertPhysicalStockAvailable(options.product_id, newQuantity, options.variant_id);
        }
        return updateCartItemQuantity(existingItem.id, newQuantity);
      }

      if (options.product_type === 'physical') {
        await assertPhysicalStockAvailable(
          options.product_id,
          options.quantity || 1,
          options.variant_id
        );
      }

      const newItem: CartItemInsert = {
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
        metadata: (Object.keys(metadataRecord).length > 0 ? metadataRecord : null) as Json,
      };

      return insertCartItem(newItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Ajouté au panier',
        description: 'Le produit a été ajouté avec succès',
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible d'ajouter au panier";
      logger.error('Error adding to cart:', error);
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: async (options: UpdateCartItemOptions) => {
      const updates: CartItemUpdate = {};

      if (options.quantity !== undefined) {
        if (options.quantity <= 0) {
          return removeItem.mutateAsync(options.item_id);
        }

        const cartItem = items.find(item => item.id === options.item_id);
        if (cartItem?.product_type === 'physical') {
          await assertPhysicalStockAvailable(
            cartItem.product_id,
            options.quantity,
            cartItem.variant_id
          );
        }

        updates.quantity = options.quantity;
      }

      if (options.variant_id !== undefined) {
        updates.variant_id = options.variant_id;
      }

      return patchCartItem(options.item_id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
    onError: (error: unknown) => {
      logger.error('Error updating cart item:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier le panier',
        variant: 'destructive',
      });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      await deleteCartItemById(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Retiré du panier',
        description: "L'article a été retiré",
      });
    },
    onError: (error: unknown) => {
      logger.error('Error removing cart item:', error);
      toast({
        title: '❌ Erreur',
        description: "Impossible de retirer l'article",
        variant: 'destructive',
      });
    },
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      await clearCartItems(getCartScope(user, sessionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Panier vidé',
        description: 'Tous les articles ont été retirés',
      });
    },
    onError: (error: unknown) => {
      logger.error('Error clearing cart:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de vider le panier',
        variant: 'destructive',
      });
    },
  });

  const addCrossTypeBundle = useMutation({
    mutationFn: async (cartItem: CartItem) => {
      assertCompatibleCartAddition(items, {
        product_type: cartItem.product_type,
        metadata: cartItem.metadata,
        storeId: getCartItemStoreId(cartItem) ?? undefined,
      });

      const scope = getCartScope(user, sessionId);
      const existingItem = await findExistingCartLine(scope, cartItem.product_id, null);

      if (existingItem) {
        const newQuantity = existingItem.quantity + cartItem.quantity;
        if (cartItem.product_type === 'physical') {
          await assertPhysicalStockAvailable(cartItem.product_id, newQuantity, cartItem.variant_id);
        }
        return updateCartItemQuantity(existingItem.id, newQuantity);
      }

      if (cartItem.product_type === 'physical') {
        await assertPhysicalStockAvailable(
          cartItem.product_id,
          cartItem.quantity,
          cartItem.variant_id
        );
      }

      const metadataRecord =
        cartItem.metadata && typeof cartItem.metadata === 'object'
          ? (cartItem.metadata as Record<string, unknown>)
          : {};

      return insertCartItem({
        user_id: user?.id ?? null,
        session_id: user ? null : sessionId,
        product_id: cartItem.product_id,
        product_type: cartItem.product_type,
        product_name: cartItem.product_name,
        product_image_url: cartItem.product_image_url ?? null,
        variant_id: null,
        variant_name: null,
        quantity: cartItem.quantity,
        unit_price: cartItem.unit_price,
        currency: cartItem.currency,
        metadata: (Object.keys(metadataRecord).length > 0 ? metadataRecord : null) as Json,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast({
        title: '✅ Pack ajouté au panier',
        description: 'Le pack cross-type est prêt pour le checkout.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible d'ajouter le pack au panier";
      toast({ title: '❌ Erreur', description: errorMessage, variant: 'destructive' });
    },
  });

  return {
    items,
    summary,
    isLoading,
    error: error?.message || null,
    addItem: addItem.mutateAsync,
    addCrossTypeBundle: addCrossTypeBundle.mutateAsync,
    updateItem: updateItem.mutateAsync,
    removeItem: removeItem.mutateAsync,
    clearCart: clearCart.mutateAsync,
    itemCount: items.length,
    isEmpty: items.length === 0,
  };
}
