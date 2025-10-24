import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
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
  ConversationEvent
} from "@/types/advanced-features";

export const useMessaging = (
  orderId?: string,
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
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  // Récupérer les conversations
  const fetchConversations = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("conversations")
        .select(`
          *,
          order:orders (order_number, total_amount, currency),
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
        `)
        .eq("order_id", orderId)
        .order("last_message_at", { ascending: false });

      // Appliquer les filtres
      if (conversationFilters?.status) {
        query = query.eq("status", conversationFilters.status);
      }
      if (conversationFilters?.admin_intervention !== undefined) {
        query = query.eq("admin_intervention", conversationFilters.admin_intervention);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      logger.error("Error fetching conversations:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, conversationFilters]);

  // Récupérer les messages d'une conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      let query = supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (name, avatar_url),
          attachments:message_attachments (*)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      // Appliquer les filtres de messages
      if (messageFilters?.sender_type) {
        query = query.eq("sender_type", messageFilters.sender_type);
      }
      if (messageFilters?.message_type) {
        query = query.eq("message_type", messageFilters.message_type);
      }
      if (messageFilters?.is_read !== undefined) {
        query = query.eq("is_read", messageFilters.is_read);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      logger.error("Error fetching messages:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageFilters]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    if (!orderId) return;

    try {
      const [totalResult, activeResult, closedResult, disputedResult, messagesResult, unreadResult, adminResult] = await Promise.allSettled([
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("order_id", orderId),
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("order_id", orderId).eq("status", "active"),
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("order_id", orderId).eq("status", "closed"),
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("order_id", orderId).eq("status", "disputed"),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", currentConversation?.id || ""),
        supabase.from("messages").select("*", { count: "exact", head: true }).eq("conversation_id", currentConversation?.id || "").eq("is_read", false),
        supabase.from("conversations").select("*", { count: "exact", head: true }).eq("order_id", orderId).eq("admin_intervention", true),
      ]);

      const totalConversations = totalResult.status === 'fulfilled' && totalResult.value.count !== null ? totalResult.value.count : 0;
      const activeConversations = activeResult.status === 'fulfilled' && activeResult.value.count !== null ? activeResult.value.count : 0;
      const closedConversations = closedResult.status === 'fulfilled' && closedResult.value.count !== null ? closedResult.value.count : 0;
      const disputedConversations = disputedResult.status === 'fulfilled' && disputedResult.value.count !== null ? disputedResult.value.count : 0;
      const totalMessages = messagesResult.status === 'fulfilled' && messagesResult.value.count !== null ? messagesResult.value.count : 0;
      const unreadMessages = unreadResult.status === 'fulfilled' && unreadResult.value.count !== null ? unreadResult.value.count : 0;
      const adminInterventions = adminResult.status === 'fulfilled' && adminResult.value.count !== null ? adminResult.value.count : 0;

      setStats({
        total_conversations: totalConversations,
        active_conversations: activeConversations,
        closed_conversations: closedConversations,
        disputed_conversations: disputedConversations,
        total_messages: totalMessages,
        unread_messages: unreadMessages,
        admin_interventions: adminInterventions,
      });
    } catch (error: any) {
      logger.error("Error fetching conversation stats:", error);
    }
  }, [orderId, currentConversation?.id]);

  // Créer une conversation
  const createConversation = async (orderId: string, storeId: string, customerId?: string): Promise<Conversation | null> => {
    try {
      const { data: order } = await supabase
        .from("orders")
        .select("customer_id, store_id")
        .eq("id", orderId)
        .single();

      if (!order) throw new Error("Commande non trouvée");

      const { data: store } = await supabase
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .single();

      if (!store) throw new Error("Boutique non trouvée");

      const { data: customer } = await supabase
        .from("customers")
        .select("user_id")
        .eq("id", order.customer_id)
        .single();

      const { data, error } = await supabase
        .from("conversations")
        .insert([{
          order_id: orderId,
          store_id: storeId,
          customer_id: order.customer_id,
          customer_user_id: customer?.user_id,
          store_user_id: store.user_id,
        }])
        .select()
        .limit(1);

      if (error) throw error;
      
      await fetchConversations();
      await fetchStats();
      
      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      logger.error("Error creating conversation:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Envoyer un message
  const sendMessage = async (conversationId: string, formData: MessageFormData): Promise<Message | null> => {
    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      // Déterminer le type d'expéditeur
      const { data: conversation } = await supabase
        .from("conversations")
        .select("store_user_id, customer_user_id")
        .eq("id", conversationId)
        .single();

      let senderType: 'customer' | 'store' | 'admin' = 'customer';
      if (user.id === conversation?.store_user_id) {
        senderType = 'store';
      } else if (user.id === conversation?.customer_user_id) {
        senderType = 'customer';
      } else {
        // Vérifier si c'est un admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        
        if (profile?.role === 'admin') {
          senderType = 'admin';
        }
      }

      // Créer le message
      const { data, error } = await supabase
        .from("messages")
        .insert([{
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: senderType,
          content: formData.content,
          message_type: formData.message_type,
          metadata: {},
        }])
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

      await fetchMessages(conversationId);
      await fetchStats();
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
      
      return message;
    } catch (error: any) {
      logger.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setSendingMessage(false);
    }
  };

  // Uploader des fichiers attachés
  const uploadAttachments = async (messageId: string, files: File[]): Promise<MessageAttachment[]> => {
    const attachments: MessageAttachment[] = [];

    for (const file of files) {
      try {
        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Le fichier ${file.name} est trop volumineux (max 10MB)`);
        }

        // Vérifier le type de fichier
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Type de fichier non autorisé: ${file.type}`);
        }

        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `message-attachments/${fileName}`;

        // Uploader le fichier vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        // Enregistrer l'attachement en base
        const { data, error } = await supabase
          .from("message_attachments")
          .insert([{
            message_id: messageId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: urlData.publicUrl,
            storage_path: filePath,
          }])
          .select()
          .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          attachments.push(data[0]);
        }
      } catch (error: any) {
        logger.error("Error uploading attachment:", error);
        toast({
          title: "Erreur d'upload",
          description: `Impossible d'uploader ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }

    return attachments;
  };

  // Marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
    try {
      await supabase
        .from("messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);
    } catch (error: any) {
      logger.error("Error marking messages as read:", error);
    }
  };

  // Fermer une conversation
  const closeConversation = async (conversationId: string): Promise<void> => {
    try {
      await supabase
        .from("conversations")
        .update({ status: 'closed' })
        .eq("id", conversationId);

      await fetchConversations();
      await fetchStats();
      
      toast({
        title: "Conversation fermée",
        description: "La conversation a été fermée",
      });
    } catch (error: any) {
      logger.error("Error closing conversation:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Ouvrir une conversation
  const openConversation = async (conversationId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          order:orders (order_number, total_amount, currency),
          store:stores (name, slug),
          customer:customers (name, email)
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      
      setCurrentConversation(data);
      await fetchMessages(conversationId);
    } catch (error: any) {
      logger.error("Error opening conversation:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Activer l'intervention admin
  const enableAdminIntervention = async (conversationId: string): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      await supabase
        .from("conversations")
        .update({
          admin_intervention: true,
          admin_user_id: user.id,
        })
        .eq("id", conversationId);

      await fetchConversations();
      await fetchStats();
      
      toast({
        title: "Intervention admin activée",
        description: "Un administrateur peut maintenant intervenir dans cette conversation",
      });
    } catch (error: any) {
      logger.error("Error enabling admin intervention:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Configuration du temps réel
  useEffect(() => {
    if (!orderId) return;

    // Nettoyer le channel précédent
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un nouveau channel pour les conversations
    channelRef.current = supabase
      .channel(`conversations-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
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
        (payload) => {
          logger.log('Message updated:', payload);
          if (currentConversation) {
            fetchMessages(currentConversation.id);
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
  }, [orderId, currentConversation?.id]);

  useEffect(() => {
    fetchConversations();
  }, [orderId, conversationFilters]);

  useEffect(() => {
    fetchStats();
  }, [orderId, currentConversation?.id]);

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
  };
};
