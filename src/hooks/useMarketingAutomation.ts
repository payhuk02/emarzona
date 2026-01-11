import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  target_audience: string;
  content: {
    subject?: string;
    body: string;
    cta_text?: string;
    cta_url?: string;
  };
  schedule_date?: string;
  created_at: string;
  updated_at: string;
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export interface BehavioralTrigger {
  id: string;
  name: string;
  event_type: 'product_view' | 'cart_abandonment' | 'purchase' | 'signup' | 'inactive_user';
  conditions: Record<string, unknown>;
  actions: Array<{
    type: 'email' | 'push' | 'sms';
    delay_minutes: number;
    template_id: string;
  }>;
  is_active: boolean;
}

export interface AbandonedCart {
  id: string;
  user_id: string;
  session_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  currency: string;
  last_activity: string;
  recovery_status: 'pending' | 'sent' | 'recovered' | 'expired';
  recovery_attempts: number;
}

export const useMarketingAutomation = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch marketing campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useQuery<MarketingCampaign[]>({
    queryKey: ['marketing-campaigns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('store_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching marketing campaigns', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch behavioral triggers
  const { data: triggers, isLoading: triggersLoading } = useQuery<BehavioralTrigger[]>({
    queryKey: ['behavioral-triggers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('behavioral_triggers')
        .select('*')
        .eq('store_owner_id', user.id)
        .eq('is_active', true);

      if (error) {
        logger.error('Error fetching behavioral triggers', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch abandoned carts
  const { data: abandonedCarts, isLoading: cartsLoading } = useQuery<AbandonedCart[]>({
    queryKey: ['abandoned-carts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('store_owner_id', user.id)
        .eq('recovery_status', 'pending')
        .order('last_activity', { ascending: false })
        .limit(50);

      if (error) {
        logger.error('Error fetching abandoned carts', { error });
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<MarketingCampaign, 'id' | 'created_at' | 'updated_at' | 'metrics'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          ...campaign,
          store_owner_id: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating campaign', { error });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Campagne créée',
        description: 'Votre campagne marketing a été créée avec succès.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la campagne.',
        variant: 'destructive',
      });
    },
  });

  // Send abandoned cart recovery
  const sendAbandonedCartRecovery = useMutation({
    mutationFn: async ({ cartId, template }: { cartId: string; template: string }) => {
      const { data, error } = await supabase.rpc('send_abandoned_cart_recovery', {
        cart_id: cartId,
        email_template: template,
      });

      if (error) {
        logger.error('Error sending abandoned cart recovery', { error });
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Récupération envoyée',
        description: 'Email de récupération envoyé avec succès.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer l\'email de récupération.',
        variant: 'destructive',
      });
    },
  });

  // Track user behavior for triggers
  const trackBehavior = useCallback(async (
    eventType: BehavioralTrigger['event_type'],
    eventData: Record<string, unknown>
  ) => {
    if (!user?.id) return;

    try {
      await supabase.rpc('track_user_behavior', {
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
      });
    } catch (error) {
      logger.error('Error tracking user behavior', { error });
    }
  }, [user?.id]);

  // Process behavioral triggers
  const processTriggers = useCallback(async () => {
    if (!triggers || triggers.length === 0) return;

    for (const trigger of triggers) {
      try {
        // This would typically be handled by a background job
        // For now, we'll simulate processing
        const { data, error } = await supabase.rpc('process_behavioral_trigger', {
          trigger_id: trigger.id,
        });

        if (error) {
          logger.error('Error processing behavioral trigger', { error, triggerId: trigger.id });
        }
      } catch (error) {
        logger.error('Exception processing trigger', { error, triggerId: trigger.id });
      }
    }
  }, [triggers]);

  // Auto-send abandoned cart recoveries
  useEffect(() => {
    if (!abandonedCarts || abandonedCarts.length === 0) return;

    // Process carts that haven't been contacted recently
    const processableCarts = abandonedCarts.filter(cart =>
      cart.recovery_attempts < 3 &&
      new Date(cart.last_activity).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Within 24 hours
    );

    processableCarts.forEach(cart => {
      // This would typically be handled by a scheduled job
      // For demo purposes, we'll auto-send after a delay
      setTimeout(() => {
        sendAbandonedCartRecovery.mutate({
          cartId: cart.id,
          template: 'abandoned_cart_recovery',
        });
      }, Math.random() * 5000); // Random delay to avoid spam
    });
  }, [abandonedCarts, sendAbandonedCartRecovery]);

  return {
    campaigns,
    triggers,
    abandonedCarts,
    isLoading: campaignsLoading || triggersLoading || cartsLoading,
    createCampaign,
    sendAbandonedCartRecovery,
    trackBehavior,
    processTriggers,
  };
};