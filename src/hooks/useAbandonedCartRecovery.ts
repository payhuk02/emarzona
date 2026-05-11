import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AbandonedCartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product_name: string;
  product_image?: string;
}

interface AbandonedCart {
  id: string;
  user_id: string;
  items: AbandonedCartItem[];
  total_amount: number;
  currency: string;
  abandoned_at: string;
  recovery_sent: boolean;
  recovered_at?: string;
  store_id: string;
}

interface RecoveryEmailData {
  cartId: string;
  userEmail: string;
  userName?: string;
  items: AbandonedCartItem[];
  totalAmount: number;
  currency: string;
  recoveryUrl: string;
  discountCode?: string;
  discountAmount?: number;
}

export const useAbandonedCartRecovery = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const effectiveUserId = userId || user?.id;

  // Fetch abandoned carts for admin or user
  const { data: abandonedCarts, isLoading } = useQuery<AbandonedCart[]>({
    queryKey: ['abandoned-carts', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];

      const { data, error } = await supabase
        .from('abandoned_carts')
        .select(`
          *,
          abandoned_cart_items (
            id,
            product_id,
            quantity,
            price,
            products (name, images)
          )
        `)
        .eq('user_id', effectiveUserId)
        .eq('recovered_at', null)
        .order('abandoned_at', { ascending: false });

      if (error) {
        logger.error('Error fetching abandoned carts', { error });
        throw error;
      }

      return data.map(cart => ({
        ...cart,
        items: cart.abandoned_cart_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product_name: item.products?.name || 'Produit inconnu',
          product_image: item.products?.images?.[0],
        })) || [],
      }));
    },
    enabled: !!effectiveUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track abandoned cart
  const trackAbandonedCart = useMutation({
    mutationFn: async (cartData: {
      userId: string;
      items: Omit<AbandonedCartItem, 'id'>[];
      totalAmount: number;
      currency: string;
      storeId: string;
    }) => {
      // First, create or update abandoned cart
      const { data: cart, error: cartError } = await supabase
        .from('abandoned_carts')
        .upsert({
          user_id: cartData.userId,
          total_amount: cartData.totalAmount,
          currency: cartData.currency,
          store_id: cartData.storeId,
          abandoned_at: new Date().toISOString(),
          recovery_sent: false,
        })
        .select()
        .single();

      if (cartError) {
        logger.error('Error creating abandoned cart', { error: cartError });
        throw cartError;
      }

      // Then, add/update items
      const itemsToInsert = cartData.items.map(item => ({
        cart_id: cart.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('abandoned_cart_items')
        .upsert(itemsToInsert, {
          onConflict: 'cart_id,product_id',
        });

      if (itemsError) {
        logger.error('Error creating abandoned cart items', { error: itemsError });
        throw itemsError;
      }

      return cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
    },
  });

  // Send recovery email
  const sendRecoveryEmail = useMutation({
    mutationFn: async (emailData: RecoveryEmailData) => {
      const { data, error } = await supabase.functions.invoke('send-recovery-email', {
        body: emailData,
      });

      if (error) {
        logger.error('Error sending recovery email', { error });
        throw error;
      }

      // Mark as recovery sent
      await supabase
        .from('abandoned_carts')
        .update({ recovery_sent: true })
        .eq('id', emailData.cartId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast({
        title: 'Email de récupération envoyé',
        description: 'L\'email de récupération du panier a été envoyé avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'email de récupération.',
        variant: 'destructive',
      });
    },
  });

  // Mark cart as recovered
  const markAsRecovered = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({
          recovered_at: new Date().toISOString(),
        })
        .eq('id', cartId);

      if (error) {
        logger.error('Error marking cart as recovered', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
    },
  });

  // Auto-track cart abandonment (call this when cart is updated)
  const trackCartUpdate = useCallback(async (cartItems: any[], storeId: string) => {
    if (!effectiveUserId || cartItems.length === 0) return;

    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    await trackAbandonedCart.mutateAsync({
      userId: effectiveUserId,
      items: cartItems.map(item => ({
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.name,
        product_image: item.image,
      })),
      totalAmount,
      currency: 'XAF', // Default currency
      storeId,
    });
  }, [effectiveUserId, trackAbandonedCart]);

  // Auto-send recovery emails (call this periodically)
  const processRecoveryEmails = useCallback(async (hoursSinceAbandonment = 1) => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursSinceAbandonment);

    const { data: cartsToRecover, error } = await supabase
      .from('abandoned_carts')
      .select(`
        *,
        profiles (email, full_name),
        abandoned_cart_items (
          id,
          product_id,
          quantity,
          price,
          products (name, images)
        )
      `)
      .eq('recovery_sent', false)
      .eq('recovered_at', null)
      .lt('abandoned_at', cutoffTime.toISOString())
      .limit(10); // Process in batches

    if (error) {
      logger.error('Error fetching carts for recovery', { error });
      return;
    }

    for (const cart of cartsToRecover || []) {
      const items: AbandonedCartItem[] = cart.abandoned_cart_items?.map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product_name: item.products?.name || 'Produit inconnu',
        product_image: item.products?.images?.[0],
      })) || [];

      await sendRecoveryEmail.mutateAsync({
        cartId: cart.id,
        userEmail: cart.profiles?.email,
        userName: cart.profiles?.full_name,
        items,
        totalAmount: cart.total_amount,
        currency: cart.currency,
        recoveryUrl: `${window.location.origin}/cart?recovery=${cart.id}`,
        discountCode: 'RECOVERY10', // Generate dynamic discount codes
        discountAmount: Math.round(cart.total_amount * 0.1), // 10% discount
      });
    }
  }, [sendRecoveryEmail]);

  return {
    abandonedCarts: abandonedCarts || [],
    isLoading,
    trackCartUpdate,
    sendRecoveryEmail,
    markAsRecovered,
    processRecoveryEmails,
    isTracking: trackAbandonedCart.isPending,
    isSendingEmail: sendRecoveryEmail.isPending,
  };
};