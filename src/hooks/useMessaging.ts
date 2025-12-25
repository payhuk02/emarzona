import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from '@/lib/notifications/unified-notifications';
import {
  Conversation,
  Message,
  MessageAttachment,
  ConversationFilters,
  MessageFilters,
  ConversationStats,
  MessageFormData,
  RealtimeEvent,
  MessageEvent,
  ConversationEvent,
} from '@/types/advanced-features';

export const useMessaging = (
  orderId?: string,
  storeId?: string,
  conversationFilters?: ConversationFilters,
  messageFilters?: MessageFilters
) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesPageSize] = useState(50);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Récupérer les conversations
  // 🔧 AMÉLIORATION: Permettre de récupérer toutes les conversations d'un store sans orderId
  const fetchConversations = useCallback(async () => {
    // Si ni orderId ni storeId, on ne peut pas récupérer les conversations
    if (!orderId && !storeId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('conversations').select(`
          *,
          order:orders (order_number, total_amount, currency, store_id),
          store:stores (name, slug),
          customer:customers (name, email),
          last_message:messages!conversations_last_message_at_fkey (
            id,
            content,
            message_type,
            created_at,
            sender_id,
            sender_type
          )
        `);

      // Filtrer par orderId si fourni, sinon par storeId
      if (orderId) {
        query = query.eq('order_id', orderId);
      } else if (storeId) {
        // Récupérer toutes les conversations du store
        // D'abord récupérer les order_ids du store
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', storeId);

        // 🔧 AMÉLIORATION: Gestion complète des erreurs Supabase
        if (ordersError) {
          const errorCode = ordersError.code;
          const errorMessage = ordersError.message || '';

          // Erreurs non-critiques (table absente, RLS, etc.)
          if (
            errorCode === '42P01' ||
            errorCode === 'PGRST116' ||
            errorCode === '400' ||
            errorCode === '42501' ||
            errorCode === '403' ||
            errorMessage.includes('does not exist') ||
            errorMessage.includes('Bad Request') ||
            errorMessage.includes('permission denied') ||
            errorMessage.includes('RLS')
          ) {
            logger.debug('Orders non accessibles pour store (non-critique)', {
              storeId,
              code: errorCode,
            });
            // Aucune commande accessible, donc aucune conversation
            setConversations([]);
            setLoading(false);
            return;
          } else {
            // Autre erreur - logger et propager
            logger.error('Error fetching orders for conversations', {
              storeId,
              error: ordersError,
            });
            throw ordersError;
          }
        }

        if (orders && orders.length > 0) {
          const orderIds = orders.map(o => o.id);
          query = query.in('order_id', orderIds);
        } else {
          // Aucune commande, donc aucune conversation
          setConversations([]);
          setLoading(false);
          return;
        }
      }

      query = query.order('last_message_at', { ascending: false });

      // Appliquer les filtres
      if (conversationFilters?.status) {
        query = query.eq('status', conversationFilters.status);
      }
      if (conversationFilters?.admin_intervention !== undefined) {
        query = query.eq('admin_intervention', conversationFilters.admin_intervention);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching conversations:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeId, conversationFilters]);

  // Récupérer les messages d'une conversation avec pagination
  const fetchMessages = useCallback(
    async (conversationId: string, page: number = 1, reset: boolean = false) => {
      setMessagesLoading(true);
      try {
        // Calculer l'offset pour la pagination
        const from = (page - 1) * messagesPageSize;
        const to = from + messagesPageSize - 1;

        let query = supabase
          .from('messages')
          .select(
            `
          *,
          sender:profiles!messages_sender_id_fkey (name, avatar_url),
          attachments:message_attachments (*)
        `,
            { count: 'exact' }
          )
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .range(from, to);

        // Appliquer les filtres de messages
        if (messageFilters?.sender_type) {
          query = query.eq('sender_type', messageFilters.sender_type);
        }
        if (messageFilters?.message_type) {
          query = query.eq('message_type', messageFilters.message_type);
        }
        if (messageFilters?.is_read !== undefined) {
          query = query.eq('is_read', messageFilters.is_read);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // Mettre à jour le total de messages
        if (count !== null) {
          setTotalMessagesCount(count);
          setHasMoreMessages(count > (reset ? 0 : messages.length) + (data?.length || 0));
        }

        // Ajouter ou remplacer les messages selon si on reset ou charge plus
        if (reset) {
          setMessages(data || []);
          setMessagesPage(1);
        } else {
          setMessages(prev => [...(data || []), ...prev]);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching messages:', error);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setMessagesLoading(false);
      }
    },
    [messageFilters, messagesPageSize]
  );

  // Charger plus de messages (infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || messagesLoading) return;

    const nextPage = messagesPage + 1;
    setMessagesPage(nextPage);
    await fetchMessages(currentConversation.id, nextPage, false);
  }, [currentConversation, hasMoreMessages, messagesLoading, messagesPage, fetchMessages]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    if (!orderId) return;

    try {
      const [
        totalResult,
        activeResult,
        closedResult,
        disputedResult,
        messagesResult,
        unreadResult,
        adminResult,
      ] = await Promise.allSettled([
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', orderId),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', orderId)
          .eq('status', 'active'),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', orderId)
          .eq('status', 'closed'),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', orderId)
          .eq('status', 'disputed'),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', currentConversation?.id || ''),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', currentConversation?.id || '')
          .eq('is_read', false),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('order_id', orderId)
          .eq('admin_intervention', true),
      ]);

      const totalConversations =
        totalResult.status === 'fulfilled' && totalResult.value.count !== null
          ? totalResult.value.count
          : 0;
      const activeConversations =
        activeResult.status === 'fulfilled' && activeResult.value.count !== null
          ? activeResult.value.count
          : 0;
      const closedConversations =
        closedResult.status === 'fulfilled' && closedResult.value.count !== null
          ? closedResult.value.count
          : 0;
      const disputedConversations =
        disputedResult.status === 'fulfilled' && disputedResult.value.count !== null
          ? disputedResult.value.count
          : 0;
      const totalMessages =
        messagesResult.status === 'fulfilled' && messagesResult.value.count !== null
          ? messagesResult.value.count
          : 0;
      const unreadMessages =
        unreadResult.status === 'fulfilled' && unreadResult.value.count !== null
          ? unreadResult.value.count
          : 0;
      const adminInterventions =
        adminResult.status === 'fulfilled' && adminResult.value.count !== null
          ? adminResult.value.count
          : 0;

      setStats({
        total_conversations: totalConversations,
        active_conversations: activeConversations,
        closed_conversations: closedConversations,
        disputed_conversations: disputedConversations,
        total_messages: totalMessages,
        unread_messages: unreadMessages,
        admin_interventions: adminInterventions,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching conversation stats:', error);
    }
  }, [orderId, currentConversation?.id]);

  // Créer une conversation
  const createConversation = async (
    orderId: string,
    storeId: string,
    customerId?: string
  ): Promise<Conversation | null> => {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('customer_id, store_id')
        .eq('id', orderId)
        .single();

      if (!order) throw new Error('Commande non trouvée');

      const { data: store } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', storeId)
        .single();

      if (!store) throw new Error('Boutique non trouvée');

      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', order.customer_id)
        .single();

      const { data, error } = await supabase
        .from('conversations')
        .insert([
          {
            order_id: orderId,
            store_id: storeId,
            customer_id: order.customer_id,
            customer_user_id: customer?.user_id,
            store_user_id: store.user_id,
          },
        ])
        .select()
        .limit(1);

      if (error) throw error;

      await fetchConversations();
      await fetchStats();

      return data && data.length > 0 ? data[0] : null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error creating conversation:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Envoyer un message
  const sendMessage = async (
    conversationId: string,
    formData: MessageFormData
  ): Promise<Message | null> => {
    setSendingMessage(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Déterminer le type d'expéditeur
      const { data: conversation } = await supabase
        .from('conversations')
        .select('store_user_id, customer_user_id')
        .eq('id', conversationId)
        .single();

      let senderType: 'customer' | 'store' | 'admin' = 'customer';
      if (user.id === conversation?.store_user_id) {
        senderType = 'store';
      } else if (user.id === conversation?.customer_user_id) {
        senderType = 'customer';
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
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: user.id,
            sender_type: senderType,
            content: formData.content,
            message_type: formData.message_type,
            metadata: {},
          },
        ])
        .select()
        .limit(1);

      if (error) throw error;

      const message = data && data.length > 0 ? data[0] : null;

      // Traiter les fichiers attachés
      if (formData.attachments && formData.attachments.length > 0) {
        await uploadAttachments(message!.id, formData.attachments);
      }

      // Marquer les messages comme lus pour l'expéditeur
      await markMessagesAsRead(conversationId, user.id);

      // Envoyer une notification au destinataire
      if (message && conversation) {
        const recipientId =
          senderType === 'customer' ? conversation.store_user_id : conversation.customer_user_id;

        if (recipientId) {
          // Récupérer l'order_id depuis la conversation
          const { data: convData } = await supabase
            .from('conversations')
            .select('order_id, store_id')
            .eq('id', conversationId)
            .single();

          if (convData?.order_id) {
            // Importer et utiliser le service de notifications
            const { sendOrderMessageNotification } =
              await import('@/lib/notifications/order-message-notifications');

            await sendOrderMessageNotification({
              conversationId,
              messageId: message.id,
              senderId: user.id,
              senderType,
              recipientId,
              recipientType: senderType === 'customer' ? 'store' : 'customer',
              orderId: convData.order_id,
              storeId: convData.store_id,
              messagePreview: formData.content,
            }).catch(err => {
              // Ne pas bloquer l'envoi du message si la notification échoue
              logger.warn('Failed to send order message notification', err);
            });
          }
        }
      }

      await fetchMessages(conversationId, 1, true);
      await fetchStats();

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès',
      });

      return message;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error sending message:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setSendingMessage(false);
    }
  };

  // Uploader des fichiers attachés (utilise la fonction centralisée)
  const uploadAttachments = async (
    messageId: string,
    files: File[]
  ): Promise<MessageAttachment[]> => {
    const attachments: MessageAttachment[] = [];

    if (files.length === 0) return attachments;

    // Importer la fonction d'upload
    const { uploadFileToStorage } = await import('@/hooks/useFileUpload');

    // Uploader chaque fichier
    for (const file of files) {
      try {
        // Uploader le fichier
        const uploadResult = await uploadFileToStorage(file, {
          folder: `message-attachments/${orderId || 'general'}`,
          maxSize: 10 * 1024 * 1024, // 10MB
        });

        // Enregistrer l'attachment en base de données
        const { data, error } = await supabase
          .from('message_attachments')
          .insert([
            {
              message_id: messageId,
              file_name: uploadResult.fileName,
              file_type: uploadResult.mimeType,
              file_size: uploadResult.size,
              file_url: uploadResult.publicUrl,
              storage_path: uploadResult.path,
            },
          ])
          .select()
          .limit(1);

        if (error) {
          logger.error('Error saving attachment to database:', error);
          toast({
            title: 'Erreur',
            description: `Impossible d'enregistrer ${file.name}`,
            variant: 'destructive',
          });
          continue;
        }

        if (data && data.length > 0) {
          attachments.push(data[0]);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error uploading attachment:', error);
        toast({
          title: "Erreur d'upload",
          description: `Impossible d'uploader ${file.name}: ${errorMessage}`,
          variant: 'destructive',
        });
      }
    }

    return attachments;
  };

  // Marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
    try {
      await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error marking messages as read:', error);
    }
  };

  // Fermer une conversation
  const closeConversation = async (conversationId: string): Promise<void> => {
    try {
      await supabase.from('conversations').update({ status: 'closed' }).eq('id', conversationId);

      await fetchConversations();
      await fetchStats();

      toast({
        title: 'Conversation fermée',
        description: 'La conversation a été fermée',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error closing conversation:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Ouvrir une conversation
  const openConversation = async (conversationId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          order:orders (order_number, total_amount, currency),
          store:stores (name, slug),
          customer:customers (name, email)
        `
        )
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      setCurrentConversation(data);
      // Réinitialiser la pagination et charger les messages
      setMessagesPage(1);
      setHasMoreMessages(true);
      await fetchMessages(conversationId, 1, true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error opening conversation:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Activer l'intervention admin
  const enableAdminIntervention = async (conversationId: string): Promise<void> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      await supabase
        .from('conversations')
        .update({
          admin_intervention: true,
          admin_user_id: user.id,
        })
        .eq('id', conversationId);

      await fetchConversations();
      await fetchStats();

      toast({
        title: 'Intervention admin activée',
        description: 'Un administrateur peut maintenant intervenir dans cette conversation',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error enabling admin intervention:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Configuration du temps réel
  useEffect(() => {
    if (!orderId && !storeId) return;

    // Nettoyer le channel précédent
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un nouveau channel pour les conversations
    const channelName = orderId ? `conversations-${orderId}` : `conversations-store-${storeId}`;
    const filter = orderId ? `order_id=eq.${orderId}` : undefined; // Pour storeId, on écoute toutes les conversations

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter,
        },
        payload => {
          logger.log('Conversation updated:', payload);
          fetchConversations();
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: currentConversation ? `conversation_id=eq.${currentConversation.id}` : undefined,
        },
        payload => {
          logger.log('Message updated:', payload);
          if (currentConversation) {
            // Recharger seulement les nouveaux messages (pas toute la pagination)
            fetchMessages(currentConversation.id, 1, false);
          }
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeId, currentConversation?.id]);

  useEffect(() => {
    if (orderId || storeId) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeId, conversationFilters]);

  useEffect(() => {
    if (orderId || storeId) {
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeId, currentConversation?.id]);

  return {
    conversations,
    currentConversation,
    messages,
    loading,
    messagesLoading,
    stats,
    sendingMessage,
    createConversation,
    sendMessage,
    markMessagesAsRead,
    closeConversation,
    openConversation,
    enableAdminIntervention,
    refetchConversations: fetchConversations,
    refetchMessages: fetchMessages,
    loadMoreMessages,
    hasMoreMessages,
    totalMessagesCount,
  };
};
