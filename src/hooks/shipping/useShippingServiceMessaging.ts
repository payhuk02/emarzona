/**
 * Hook pour la messagerie avec les services de livraison
 * Permet aux vendeurs de communiquer avec les services de livraison
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export interface ShippingServiceConversation {
  id: string;
  store_id: string;
  shipping_service_id: string;
  store_user_id: string;
  subject?: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  shipping_service?: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
  };
  last_message?: ShippingServiceMessage;
  unread_count?: number;
}

export interface ShippingServiceMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'store' | 'shipping_service' | 'admin';
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file' | 'system';
  metadata?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  // Relations
  sender?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  attachments?: ShippingServiceMessageAttachment[];
}

export interface ShippingServiceMessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  created_at: string;
}

export interface ShippingServiceMessageFormData {
  content: string;
  message_type?: 'text' | 'image' | 'video' | 'file';
  attachments?: File[];
}

export const useShippingServiceMessaging = (storeId?: string, shippingServiceId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Récupérer les conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['shipping-service-conversations', storeId, shippingServiceId],
    queryFn: async () => {
      if (!storeId) return [];

      let query = supabase
        .from('shipping_service_conversations')
        .select(`
          *,
          shipping_service:global_shipping_services (
            id,
            name,
            contact_email,
            contact_phone
          ),
          last_message:shipping_service_messages!shipping_service_conversations_last_message_at_fkey (
            id,
            content,
            message_type,
            created_at,
            sender_id,
            sender_type
          )
        `)
        .eq('store_id', storeId)
        .order('last_message_at', { ascending: false });

      if (shippingServiceId) {
        query = query.eq('shipping_service_id', shippingServiceId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          logger.warn('Table shipping_service_conversations does not exist yet');
          return [];
        }
        throw error;
      }

      return (data || []) as ShippingServiceConversation[];
    },
    enabled: !!storeId,
  });

  // Récupérer les messages d'une conversation
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['shipping-service-messages'],
    queryFn: async () => [],
    enabled: false,
  });

  // Créer une conversation
  const createConversationMutation = useMutation({
    mutationFn: async ({
      storeId,
      shippingServiceId,
      subject,
    }: {
      storeId: string;
      shippingServiceId: string;
      subject?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { data: store } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', storeId)
        .single();

      if (!store) throw new Error('Boutique non trouvée');

      const { data, error } = await supabase
        .from('shipping_service_conversations')
        .insert({
          store_id: storeId,
          shipping_service_id: shippingServiceId,
          store_user_id: store.user_id,
          subject,
        })
        .select(`
          *,
          shipping_service:global_shipping_services (
            id,
            name,
            contact_email,
            contact_phone
          )
        `)
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['shipping-service-conversations'] });

      return data as ShippingServiceConversation;
    },
    onSuccess: () => {
      toast({
        title: '✅ Conversation créée',
        description: 'Vous pouvez maintenant communiquer avec ce service de livraison.',
      });
    },
    onError: (error: any) => {
      logger.error('Error creating shipping service conversation', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la conversation.',
        variant: 'destructive',
      });
    },
  });

  // Envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      formData,
    }: {
      conversationId: string;
      formData: ShippingServiceMessageFormData;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Déterminer le type d'expéditeur
      const { data: conversation } = await supabase
        .from('shipping_service_conversations')
        .select('store_user_id')
        .eq('id', conversationId)
        .single();

      let senderType: 'store' | 'shipping_service' | 'admin' = 'store';
      if (user.id === conversation?.store_user_id) {
        senderType = 'store';
      } else {
        // Vérifier si c'est un admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (profile?.role === 'admin') {
          senderType = 'admin';
        }
      }

      // Créer le message
      const { data, error } = await supabase
        .from('shipping_service_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: senderType,
          content: formData.content,
          message_type: formData.message_type || 'text',
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['shipping-service-messages'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-service-conversations'] });

      return data as ShippingServiceMessage;
    },
    onSuccess: () => {
      toast({
        title: '✅ Message envoyé',
        description: 'Votre message a été envoyé avec succès.',
      });
    },
    onError: (error: any) => {
      logger.error('Error sending message', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'envoyer le message.',
        variant: 'destructive',
      });
    },
  });

  // Récupérer les messages d'une conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('shipping_service_messages')
      .select(`
        *,
        sender:profiles!shipping_service_messages_sender_id_fkey (
          user_id,
          display_name,
          first_name,
          last_name,
          avatar_url
        ),
        attachments:shipping_service_message_attachments (*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST116') {
        return [];
      }
      throw error;
    }

    return (data || []) as ShippingServiceMessage[];
  }, []);

  // Marquer les messages comme lus
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase
        .from('shipping_service_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['shipping-service-messages'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-service-conversations'] });
    },
  });

  return {
    conversations: conversations || [],
    isLoading,
    createConversation: createConversationMutation.mutateAsync,
    sendMessage: sendMessageMutation.mutateAsync,
    fetchMessages,
    markAsRead: markAsReadMutation.mutateAsync,
    isCreating: createConversationMutation.isPending,
    isSending: sendMessageMutation.isPending,
  };
};

