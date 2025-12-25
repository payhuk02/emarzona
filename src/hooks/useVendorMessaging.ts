import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
    storage_path?: string;
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
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesPage, setMessagesPage] = useState(1);
  const [totalMessagesCount, setTotalMessagesCount] = useState(0);
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Récupérer les conversations avec pagination
  const fetchConversations = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Calculer l'offset pour la pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('vendor_conversations')
        .select(
          `
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `,
          { count: 'exact' }
        )
        .order('last_message_at', { ascending: false });

      // Filtrer par store_id si fourni
      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      // Filtrer par utilisateur (client ou vendeur)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin') {
        // Les admins voient tout
      } else {
        // Récupérer d'abord les stores de l'utilisateur
        const { data: userStores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id);

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
      const conversationIds = (data || []).map((c: { id: string }) => c.id);
      const { data: lastMessagesData } = await supabase
        .from('vendor_messages')
        .select('conversation_id, id, content, message_type, created_at, sender_id, sender_type')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Grouper les messages par conversation et prendre le premier (le plus récent)
      const lastMessagesMap = new Map();
      (lastMessagesData || []).forEach((msg: { conversation_id: string; created_at: string }) => {
        if (!lastMessagesMap.has(msg.conversation_id)) {
          lastMessagesMap.set(msg.conversation_id, msg);
        }
      });

      // Combiner les conversations avec leur dernier message
      const conversationsWithLastMessage = (data || []).map((conv: VendorConversation) => ({
        ...conv,
        last_message: lastMessagesMap.get(conv.id) || null,
      }));

      setConversations(conversationsWithLastMessage as VendorConversation[]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error fetching vendor conversations:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, page, pageSize, toast]);

  // Récupérer les messages d'une conversation avec pagination
  const fetchMessages = useCallback(
    async (conversationId: string, messagePage: number = 1, messagePageSize: number = 50) => {
      setMessagesLoading(true);
      try {
        // Calculer l'offset pour la pagination des messages
        const from = (messagePage - 1) * messagePageSize;
        const to = from + messagePageSize - 1;

        // Récupérer les messages avec les informations de l'expéditeur
        const {
          data: messagesData,
          error: messagesError,
          count,
        } = await supabase
          .from('vendor_messages')
          .select(
            `
          *,
          attachments:vendor_message_attachments (*)
        `,
            { count: 'exact' }
          )
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .range(from, to);

        if (messagesError) throw messagesError;

        // Récupérer le count total depuis la réponse Supabase
        const actualTotal = count || 0;

        // Récupérer les profils des expéditeurs séparément
        // Filtrer les IDs null/invalides et valider le format UUID
        const senderIds = [
          ...new Set(
            (messagesData || []).map((m: { sender_id: string }) => m.sender_id).filter(Boolean)
          ),
        ];

        // Valider que les IDs sont des UUIDs valides
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validSenderIds = senderIds.filter((id: string) => {
          if (!id || typeof id !== 'string') return false;
          return uuidRegex.test(id);
        });

        interface ProfileData {
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
        }
        let profilesData: ProfileData[] = [];
        if (validSenderIds.length > 0) {
          try {
            // Utiliser une requête correcte avec .in() pour les UUIDs
            // Limiter à 50 IDs pour éviter les requêtes trop longues (Supabase limite)
            const idsToFetch = validSenderIds.slice(0, 50);

            // Vérifier que tous les IDs sont des UUIDs valides avant la requête
            const allValid = idsToFetch.every((id: string) => uuidRegex.test(id));

            if (!allValid) {
              logger.warn('Some sender IDs are not valid UUIDs, skipping profile fetch', {
                idsToFetch: idsToFetch.length,
              });
              profilesData = [];
            } else {
              const { data, error: profilesError } = await supabase
                .from('profiles')
                .select('user_id, display_name, avatar_url')
                .in('user_id', idsToFetch);

              if (profilesError) {
                logger.error('Error fetching profiles for vendor messages', {
                  error: profilesError,
                  senderIds: validSenderIds.length,
                  idsToFetch: idsToFetch.length,
                  message: profilesError.message,
                  code: profilesError.code,
                  details: profilesError.details,
                });
                // Ne pas bloquer l'affichage des messages si les profils échouent
                profilesData = [];
              } else {
                profilesData = data || [];
              }
            }
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error('Exception fetching profiles', {
              error: err,
              senderIds: validSenderIds.length,
              message: errorMessage,
            });
            profilesData = [];
          }
        }

        // Combiner les messages avec les profils
        const messagesWithSenders = (messagesData || []).map(
          (message: { sender_id: string; [key: string]: unknown }) => {
            const profile = profilesData?.find(
              (p: { user_id: string }) => p.user_id === message.sender_id
            );
            return {
              ...message,
              sender: profile
                ? {
                    name: profile.display_name || profile.first_name || 'Utilisateur',
                    avatar_url: profile.avatar_url,
                  }
                : null,
            };
          }
        );

        // Mettre à jour le total et hasMoreMessages
        if (messagePage === 1) {
          setMessages(messagesWithSenders as VendorMessage[]);
          setTotalMessagesCount(actualTotal);
        } else {
          // Ajouter les nouveaux messages au début (messages plus anciens)
          setMessages(prev => [...messagesWithSenders, ...prev] as VendorMessage[]);
        }

        // Vérifier s'il y a plus de messages à charger
        // Calculer le nombre total de messages chargés
        const loadedCount =
          messagePage === 1
            ? messagesWithSenders.length
            : (messagePage - 1) * 50 + messagesWithSenders.length; // 50 est la pageSize utilisée dans fetchMessages
        setHasMoreMessages(loadedCount < actualTotal);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error('Error fetching vendor messages:', error);
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setMessagesLoading(false);
      }
    },
    [toast]
  );

  // Créer une conversation
  const createConversation = async (
    storeId: string,
    productId?: string,
    subject?: string
  ): Promise<VendorConversation | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour contacter le vendeur',
          variant: 'destructive',
        });
        return null;
      }

      const { data: store } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', storeId)
        .maybeSingle();

      if (!store) {
        toast({
          title: 'Erreur',
          description: 'Boutique non trouvée',
          variant: 'destructive',
        });
        return null;
      }

      // Vérifier si une conversation existe déjà
      const { data: existing } = await supabase
        .from('vendor_conversations')
        .select('id')
        .eq('store_id', storeId)
        .eq('customer_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        // Retourner la conversation existante
        const { data: convData, error: convError } = await supabase
          .from('vendor_conversations')
          .select(
            `
            *,
            store:stores (name, slug, logo_url),
            product:products (name, slug, image_url)
          `
          )
          .eq('id', existing.id)
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
        .from('vendor_conversations')
        .insert([
          {
            store_id: storeId,
            product_id: productId || null,
            customer_user_id: user.id,
            store_user_id: store.user_id,
            subject: subject || null,
          },
        ])
        .select(
          `
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `
        )
        .limit(1);

      if (error) throw error;

      await fetchConversations();

      const newConv = data && data.length > 0 ? data[0] : null;
      if (newConv) {
        setCurrentConversation(newConv as VendorConversation);

        // Envoyer une notification au vendeur pour la nouvelle conversation
        // Le trigger SQL enverra aussi une notification, mais on peut aussi le faire ici
        // pour s'assurer que ça fonctionne même si le trigger échoue
        try {
          const { sendVendorConversationStartedNotification } =
            await import('@/lib/notifications/vendor-message-notifications');
          await sendVendorConversationStartedNotification(
            newConv.id,
            user.id,
            storeId,
            productId
          ).catch(err => {
            logger.warn('Failed to send conversation started notification', err);
          });
        } catch (err) {
          // Ne pas bloquer la création de conversation si la notification échoue
          logger.warn('Error importing notification service', err);
        }
      }

      return newConv as VendorConversation | null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error creating vendor conversation:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Récupérer une conversation par ID
  const fetchConversationById = async (
    conversationId: string
  ): Promise<VendorConversation | null> => {
    try {
      const { data, error } = await supabase
        .from('vendor_conversations')
        .select(
          `
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `
        )
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;
      return data as VendorConversation | null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error fetching vendor conversation:', error);
      return null;
    }
  };

  // Envoyer un message
  const sendMessage = async (
    conversationId: string,
    formData: VendorMessageFormData
  ): Promise<VendorMessage | null> => {
    setSendingMessage(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Déterminer le type d'expéditeur
      const { data: conversation } = await supabase
        .from('vendor_conversations')
        .select('store_user_id, customer_user_id')
        .eq('id', conversationId)
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
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profile?.role === 'admin') {
            senderType = 'admin';
          }
        }
      }

      // Créer le message
      const { data, error } = await supabase
        .from('vendor_messages')
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
      if (formData.attachments && formData.attachments.length > 0 && message) {
        await uploadAttachments(message.id, formData.attachments);
      }

      // Marquer les messages comme lus pour l'expéditeur
      await markMessagesAsRead(conversationId, user.id);

      // Envoyer une notification au destinataire
      if (message && conversation) {
        const recipientId =
          senderType === 'customer' ? conversation.store_user_id : conversation.customer_user_id;

        if (recipientId) {
          // Importer et utiliser le service de notifications
          const { sendVendorMessageNotification } =
            await import('@/lib/notifications/vendor-message-notifications');

          await sendVendorMessageNotification({
            conversationId,
            messageId: message.id,
            senderId: user.id,
            senderType,
            recipientId,
            recipientType: senderType === 'customer' ? 'store' : 'customer',
            storeId: conversation.store_id,
            productId: conversation.product_id,
            messagePreview: formData.content,
          }).catch(err => {
            // Ne pas bloquer l'envoi du message si la notification échoue
            logger.warn('Failed to send vendor message notification', err);
          });
        }
      }

      await fetchMessages(conversationId);
      await fetchConversations();

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès',
      });

      return message as VendorMessage | null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error sending vendor message:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setSendingMessage(false);
    }
  };

  // Uploader des fichiers attachés
  const uploadAttachments = async (
    messageId: string,
    attachments: Array<{
      file_name: string;
      file_type: string;
      file_size: number;
      file_url: string;
      storage_path?: string;
    }>
  ): Promise<void> => {
    for (const attachment of attachments) {
      try {
        // Utiliser storage_path si fourni, sinon extraire depuis l'URL
        let storagePath = attachment.storage_path;

        if (!storagePath) {
          // Extraire le chemin de stockage depuis l'URL
          // Format attendu: https://xxx.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/xxx.png
          const urlMatch = attachment.file_url.match(
            /\/storage\/v1\/object\/public\/attachments\/(.+)$/
          );
          if (urlMatch) {
            storagePath = decodeURIComponent(urlMatch[1]);
          } else {
            // Si l'URL ne correspond pas au format attendu, essayer d'extraire le chemin autrement
            const pathMatch = attachment.file_url.match(/attachments\/(.+)$/);
            if (pathMatch) {
              storagePath = decodeURIComponent(pathMatch[1]);
            } else {
              // Fallback : utiliser l'URL complète comme chemin (ne devrait pas arriver)
              logger.warn('Could not extract storage_path from URL', {
                fileUrl: attachment.file_url,
              });
              storagePath = attachment.file_url;
            }
          }
        }

        // S'assurer que storage_path est valide et nettoyé
        let cleanStoragePath = storagePath;

        if (storagePath) {
          // Nettoyer le chemin pour s'assurer qu'il est relatif au bucket
          cleanStoragePath = storagePath
            .replace(/^attachments\//, '')
            .replace(/^\/attachments\//, '')
            .replace(/^storage\/v1\/object\/public\/attachments\//, '')
            .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/attachments\//, '')
            .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/sign\/attachments\//, '');
        }

        // Si pas de storage_path, essayer de l'extraire depuis l'URL
        if (!cleanStoragePath && attachment.file_url) {
          const urlMatch = attachment.file_url.match(
            /\/storage\/v1\/object\/public\/attachments\/(.+)$/
          );
          if (urlMatch) {
            cleanStoragePath = decodeURIComponent(urlMatch[1]);
          }
        }

        if (!cleanStoragePath) {
          logger.error('Invalid storage_path after cleaning', {
            originalStoragePath: storagePath,
            fileUrl: attachment.file_url,
            fileName: attachment.file_name,
          });
          throw new Error(`Chemin de stockage invalide pour ${attachment.file_name}`);
        }

        // Log pour debug (en dev seulement)
        if (import.meta.env.DEV) {
          logger.info('Saving vendor message attachment', {
            messageId,
            fileName: attachment.file_name,
            storagePath: cleanStoragePath,
            fileUrl: attachment.file_url,
          });
        }

        const { error, data } = await supabase
          .from('vendor_message_attachments')
          .insert([
            {
              message_id: messageId,
              file_name: attachment.file_name,
              file_type: attachment.file_type,
              file_size: attachment.file_size,
              file_url: attachment.file_url,
              storage_path: cleanStoragePath, // Chemin relatif nettoyé dans le bucket
            },
          ])
          .select();

        // Vérifier que l'insertion a réussi et log le résultat
        if (import.meta.env.DEV && data && data.length > 0) {
          logger.info('Vendor message attachment saved successfully', {
            attachmentId: data[0].id,
            storagePath: data[0].storage_path,
            fileUrl: data[0].file_url,
          });
        }

        if (error) throw error;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error('Error uploading vendor attachment:', error);
      }
    }
  };

  // Marquer les messages comme lus
  const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
    try {
      await supabase
        .from('vendor_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error marking vendor messages as read:', error);
    }
  };

  // Charger plus de messages (infinite scroll)
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || !hasMoreMessages || messagesLoading) return;

    const nextPage = messagesPage + 1;
    setMessagesPage(nextPage);
    await fetchMessages(currentConversation.id, nextPage, 50);
  }, [currentConversation, hasMoreMessages, messagesLoading, messagesPage, fetchMessages]);

  // Ouvrir une conversation
  const openConversation = useCallback(
    async (conversationId: string) => {
      let conv = conversations.find(c => c.id === conversationId);
      if (!conv) {
        // Récupérer la conversation depuis la base de données
        const { data: convData, error: convError } = await supabase
          .from('vendor_conversations')
          .select(
            `
          *,
          store:stores (name, slug, logo_url),
          product:products (name, slug, image_url)
        `
          )
          .eq('id', conversationId)
          .maybeSingle();

        if (!convError && convData) {
          conv = convData as VendorConversation;
        }
      }

      if (conv) {
        setCurrentConversation(conv);
        // Réinitialiser la pagination
        setMessagesPage(1);
        setHasMoreMessages(true);
        setTotalMessagesCount(0); // Réinitialiser le total
        await fetchMessages(conversationId, 1, 50);

        // Marquer comme lu
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await markMessagesAsRead(conversationId, user.id);
        }
      }
    },
    [conversations, fetchMessages]
  );

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
    loadMoreMessages,
    hasMoreMessages,
    totalMessagesCount,
  };
};
