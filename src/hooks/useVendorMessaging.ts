import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';

export interface VendorConversation {
  id: string;
  store_id: string;
  product_id?: string | null;
  customer_user_id: string;
  store_user_id: string;
  subject?: string | null;
  status: 'active' | 'closed' | 'disputed';
  last_message_at?: string | null;
  admin_intervention: boolean;
  admin_user_id?: string | null;
  created_at: string;
  updated_at: string;
  store?: {
    name: string;
    slug: string;
    logo_url?: string | null;
  };
  product?: {
    name: string;
    slug: string;
    image_url?: string | null;
  };
  last_message?: VendorMessage;
  unread_count?: number;
}

export interface VendorMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'store' | 'admin';
  content?: string | null;
  message_type: 'text' | 'image' | 'video' | 'file' | 'system';
  metadata?: Record<string, string | number | boolean | null | undefined>;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  sender?: {
    name: string;
    avatar_url?: string | null;
  };
  attachments?: VendorMessageAttachment[];
}

export interface VendorMessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  created_at: string;
}

export interface VendorMessageFormData {
  content: string;
  message_type: 'text' | 'image' | 'video' | 'file' | 'system';
  attachments?: Array<{
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
  }>;
}

export interface UseVendorMessagingOptions {
  page?: number;
  pageSize?: number;
}

export const useVendorMessaging = (
  storeId?: string,
  productId?: string,
  options: UseVendorMessagingOptions = {}
) => {
  const { page = 1, pageSize = 20 } = options;
  const [conversations, setConversations] = useState<VendorConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<VendorConversation | null>(null);
  const [messages, setMessages] = useState<VendorMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Récupérer les conversations avec pagination
  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Calculer l'offset pour la pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("vendor_conversations")
        .select(`
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `, { count: 'exact' })
        .order("last_message_at", { ascending: false });

      // Filtrer par store_id si fourni
      if (storeId) {
        query = query.eq("store_id", storeId);
      }

      // Filtrer par utilisateur (client ou vendeur)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        // Les admins voient tout
      } else {
        // Récupérer d'abord les stores de l'utilisateur
        const { data: userStores } = await supabase
          .from("stores")
          .select("id")
          .eq("user_id", user.id);

        const storeIds = userStores?.map(s => s.id) || [];

        // Construire le filtre : client OU vendeur direct OU propriétaire de la boutique
        if (storeIds.length > 0) {
          // Si l'utilisateur a des boutiques, inclure les conversations de ces boutiques
          query = query.or(
            `customer_user_id.eq.${user.id},store_user_id.eq.${user.id},store_id.in.(${storeIds.join(',')})`
          );
        } else {
          // Sinon, seulement client ou vendeur direct
          query = query.or(`customer_user_id.eq.${user.id},store_user_id.eq.${user.id}`);
        }
      }

      // Appliquer la pagination
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setTotalCount(count || 0);

      // Récupérer le dernier message pour chaque conversation
      const conversationIds = (data || []).map((c: any) => c.id);
      const { data: lastMessagesData } = await supabase
        .from("vendor_messages")
        .select("conversation_id, id, content, message_type, created_at, sender_id, sender_type")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      // Grouper les messages par conversation et prendre le premier (le plus récent)
      const lastMessagesMap = new Map();
      (lastMessagesData || []).forEach((msg: any) => {
        if (!lastMessagesMap.has(msg.conversation_id)) {
          lastMessagesMap.set(msg.conversation_id, msg);
        }
      });

      // Combiner les conversations avec leur dernier message
      const conversationsWithLastMessage = (data || []).map((conv: any) => ({
        ...conv,
        last_message: lastMessagesMap.get(conv.id) || null,
      }));

      setConversations(conversationsWithLastMessage as VendorConversation[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error fetching vendor conversations:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, page, pageSize, toast]);

  // Récupérer les messages d'une conversation avec pagination
  const fetchMessages = useCallback(async (conversationId: string, messagePage: number = 1, messagePageSize: number = 50) => {
    setMessagesLoading(true);
    try {
      // Calculer l'offset pour la pagination des messages
      const from = (messagePage - 1) * messagePageSize;
      const to = from + messagePageSize - 1;

      // Récupérer les messages avec les informations de l'expéditeur
      const { data: messagesData, error: messagesError } = await supabase
        .from("vendor_messages")
        .select(`
          *,
          attachments:vendor_message_attachments (*)
        `, { count: 'exact' })
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .range(from, to);

      if (messagesError) throw messagesError;

      // Récupérer les profils des expéditeurs séparément
      const senderIds = [...new Set((messagesData || []).map((m: any) => m.sender_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", senderIds);

      // Combiner les messages avec les profils
      const messagesWithSenders = (messagesData || []).map((message: any) => {
        const profile = profilesData?.find((p: any) => p.user_id === message.sender_id);
        return {
          ...message,
          sender: profile ? {
            name: profile.name,
            avatar_url: profile.avatar_url
          } : null
        };
      });

      setMessages(messagesWithSenders as VendorMessage[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error fetching vendor messages:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  }, [toast]);

  // Créer une conversation
  const createConversation = async (
    storeId: string,
    productId?: string,
    subject?: string
  ): Promise<VendorConversation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentification requise",
          description: "Veuillez vous connecter pour contacter le vendeur",
          variant: "destructive",
        });
        return null;
      }

      const { data: store } = await supabase
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .maybeSingle();

      if (!store) {
        toast({
          title: "Erreur",
          description: "Boutique non trouvée",
          variant: "destructive",
        });
        return null;
      }

      // Vérifier si une conversation existe déjà
      const { data: existing } = await supabase
        .from("vendor_conversations")
        .select("id")
        .eq("store_id", storeId)
        .eq("customer_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (existing) {
        // Retourner la conversation existante
        const { data: convData, error: convError } = await supabase
          .from("vendor_conversations")
          .select(`
            *,
            store:stores (name, slug, logo_url),
            product:products (name, slug, image_url)
          `)
          .eq("id", existing.id)
          .maybeSingle();
        
        if (convError) throw convError;
        
        const conv = convData as VendorConversation | null;
        if (conv) {
          setCurrentConversation(conv);
          await fetchMessages(conv.id);
          await fetchConversations(); // Rafraîchir la liste
        }
        return conv;
      }

      const { data, error } = await supabase
        .from("vendor_conversations")
        .insert([{
          store_id: storeId,
          product_id: productId || null,
          customer_user_id: user.id,
          store_user_id: store.user_id,
          subject: subject || null,
        }])
        .select(`
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `)
        .limit(1);

      if (error) throw error;
      
      await fetchConversations();
      
      const newConv = data && data.length > 0 ? data[0] : null;
      if (newConv) {
        setCurrentConversation(newConv as VendorConversation);
      }
      
      return newConv as VendorConversation | null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error creating vendor conversation:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  // Récupérer une conversation par ID
  const fetchConversationById = async (conversationId: string): Promise<VendorConversation | null> => {
    try {
      const { data, error } = await supabase
        .from("vendor_conversations")
        .select(`
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `)
        .eq("id", conversationId)
        .maybeSingle();

      if (error) throw error;
      return data as VendorConversation | null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error fetching vendor conversation:", error);
      return null;
    }
  };

  // Envoyer un message
  const sendMessage = async (conversationId: string, formData: VendorMessageFormData): Promise<VendorMessage | null> => {
    setSendingMessage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      // Déterminer le type d'expéditeur
      const { data: conversation } = await supabase
        .from("vendor_conversations")
        .select("store_user_id, customer_user_id")
        .eq("id", conversationId)
        .maybeSingle();

      let senderType: 'customer' | 'store' | 'admin' = 'customer';
      if (conversation) {
        if (user.id === conversation.store_user_id) {
          senderType = 'store';
        } else if (user.id === conversation.customer_user_id) {
          senderType = 'customer';
        } else {
          // Vérifier si c'est un admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (profile?.role === 'admin') {
            senderType = 'admin';
          }
        }
      }

      // Créer le message
      const { data, error } = await supabase
        .from("vendor_messages")
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
      if (formData.attachments && formData.attachments.length > 0 && message) {
        await uploadAttachments(message.id, formData.attachments);
      }

      // Marquer les messages comme lus pour l'expéditeur
      await markMessagesAsRead(conversationId, user.id);

      await fetchMessages(conversationId);
      await fetchConversations();
      
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
      
      return message as VendorMessage | null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error sending vendor message:", error);
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
  const uploadAttachments = async (messageId: string, attachments: Array<{ file_name: string; file_type: string; file_size: number; file_url: string }>): Promise<void> => {
    for (const attachment of attachments) {
      try {
        // Extraire le chemin de stockage depuis l'URL
        // Format attendu: https://xxx.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/xxx.png
        let storagePath = attachment.file_url;
        const urlMatch = attachment.file_url.match(/\/storage\/v1\/object\/public\/attachments\/(.+)$/);
        if (urlMatch) {
          storagePath = urlMatch[1];
        } else {
          // Si l'URL ne correspond pas au format attendu, essayer d'extraire le chemin autrement
          const pathMatch = attachment.file_url.match(/attachments\/(.+)$/);
          if (pathMatch) {
            storagePath = pathMatch[1];
          }
        }

        const { error } = await supabase
          .from("vendor_message_attachments")
          .insert([{
            message_id: messageId,
            file_name: attachment.file_name,
            file_type: attachment.file_type,
            file_size: attachment.file_size,
            file_url: attachment.file_url,
            storage_path: storagePath, // Chemin relatif dans le bucket
          }]);

        if (error) throw error;
      } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error("Error uploading vendor attachment:", error);
      }
    }
  };

  // Marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
    try {
      await supabase
        .from("vendor_messages")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error("Error marking vendor messages as read:", error);
    }
  };

  // Ouvrir une conversation
  const openConversation = useCallback(async (conversationId: string) => {
    let conv = conversations.find(c => c.id === conversationId);
    if (!conv) {
      // Récupérer la conversation depuis la base de données
      const { data: convData, error: convError } = await supabase
        .from("vendor_conversations")
        .select(`
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `)
        .eq("id", conversationId)
        .maybeSingle();
      
      if (!convError && convData) {
        conv = convData as VendorConversation;
      }
    }
    
    if (conv) {
      setCurrentConversation(conv);
      await fetchMessages(conversationId);
      
      // Marquer comme lu
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await markMessagesAsRead(conversationId, user.id);
      }
    }
  }, [conversations, fetchMessages]);

  // Fermer une conversation
  const closeConversation = useCallback(() => {
    setCurrentConversation(null);
    setMessages([]);
  }, []);

  // Initialiser les conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription pour les nouveaux messages
  useEffect(() => {
    if (!currentConversation) return;

    const channel = supabase
      .channel(`vendor_conversation_${currentConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_messages',
          filter: `conversation_id=eq.${currentConversation.id}`,
        },
        () => {
          fetchMessages(currentConversation.id);
          fetchConversations();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation, fetchMessages, fetchConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    loading,
    messagesLoading,
    sendingMessage,
    createConversation,
    sendMessage,
    fetchMessages,
    markMessagesAsRead,
    openConversation,
    closeConversation,
    fetchConversations,
  };
};

