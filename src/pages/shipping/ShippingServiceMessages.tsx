/**
 * 💬 Messagerie avec Service de Livraison
 * Page de communication entre vendeur et service de livraison
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Loader2,
  Truck,
  User,
  Store,
  Check,
  CheckCheck,
  Paperclip,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useShippingServiceMessaging } from '@/hooks/shipping/useShippingServiceMessaging';
import { useStore } from '@/hooks/useStore';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ShippingServiceMessage } from '@/hooks/shipping/useShippingServiceMessaging';
import { MediaAttachment } from '@/components/media';

export default function ShippingServiceMessages() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store } = useStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState<ShippingServiceMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Charger la conversation
  const { data: conversation, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['shipping-service-conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('shipping_service_conversations')
        .select(`
          *,
          shipping_service:global_shipping_services (
            id,
            name,
            contact_email,
            contact_phone,
            description
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!conversationId,
  });

  // Charger les messages
  const loadMessages = async () => {
    if (!conversationId) return;

    setIsLoadingMessages(true);
    try {
      // Récupérer les messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('shipping_service_messages')
        .select(`
          *,
          attachments:shipping_service_message_attachments (*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        if (messagesError.code === '42P01' || messagesError.code === 'PGRST116') {
          setMessages([]);
          return;
        }
        throw messagesError;
      }

      // Récupérer les profils des expéditeurs
      interface MessageData {
        sender_id: string;
      }
      const senderIds = [...new Set((messagesData || []).map((m: MessageData) => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, avatar_url')
        .in('user_id', senderIds);

      // Combiner les données
      interface ProfileData {
        user_id: string;
        display_name?: string;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
      }
      interface MessageWithSender extends ShippingServiceMessage {
        sender?: ProfileData;
      }
      const messagesWithSenders = (messagesData || []).map((message: MessageData): MessageWithSender => ({
        ...message as MessageWithSender,
        sender: profilesData?.find((p: ProfileData) => p.user_id === message.sender_id),
      }));

      setMessages(messagesWithSenders as ShippingServiceMessage[]);
    } catch ( _error: unknown) {
      logger.error('Error loading messages', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscription pour les nouveaux messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`shipping-service-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipping_service_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const { sendMessage, markAsRead, isSending } = useShippingServiceMessaging(store?.id);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !conversationId) return;

    try {
      await sendMessage({
        conversationId,
        formData: {
          content: messageContent.trim(),
          message_type: 'text',
        },
      });

      setMessageContent('');
      await loadMessages();
    } catch ( _error: unknown) {
      logger.error('Error sending message', error);
    }
  };

  // Marquer les messages comme lus
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, messages.length, markAsRead]);

  if (isLoadingConversation) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement de la conversation...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!conversation) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <Alert variant="destructive">
              <AlertDescription>
                Conversation introuvable. Veuillez retourner à la liste des services.
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link to="/dashboard/contact-shipping-service">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux services
              </Link>
            </Button>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const shippingService = conversation.shipping_service as any;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-4 min-w-0 flex-1">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Link to="/dashboard/contact-shipping-service">
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Retour</span>
                  </Link>
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold flex flex-wrap items-center gap-2">
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 text-blue-500 flex-shrink-0" />
                    <span className="break-words">
                      Conversation avec {shippingService?.name || 'Service de Livraison'}
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                    {conversation.subject || 'Communication avec le service de livraison'}
                  </p>
                </div>
              </div>
              <Badge 
                variant={conversation.status === 'active' ? 'default' : 'secondary'}
                className="flex-shrink-0 w-fit"
              >
                {conversation.status === 'active' ? 'Active' : conversation.status}
              </Badge>
            </div>

            {/* Service Info Card */}
            {shippingService && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Informations du Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Nom</p>
                      <p className="text-sm text-muted-foreground">{shippingService.name}</p>
                    </div>
                    {shippingService.contact_email && (
                      <div>
                        <p className="text-sm font-medium mb-1">Email</p>
                        <a
                          href={`mailto:${shippingService.contact_email}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {shippingService.contact_email}
                        </a>
                      </div>
                    )}
                    {shippingService.contact_phone && (
                      <div>
                        <p className="text-sm font-medium mb-1">Téléphone</p>
                        <a
                          href={`tel:${shippingService.contact_phone}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {shippingService.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages */}
            <Card className="flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '400px', maxHeight: 'calc(100vh - 200px)' }}>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Aucun message pour le moment. Commencez la conversation !
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isStore = message.sender_type === 'store';
                        const isAdmin = message.sender_type === 'admin';

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isStore ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.sender?.avatar_url} />
                              <AvatarFallback>
                                {message.sender?.display_name || message.sender?.first_name
                                  ? `${message.sender?.first_name?.[0] || ''}${message.sender?.last_name?.[0] || ''}`.toUpperCase()
                                  : isStore ? (
                                    <Store className="h-4 w-4" />
                                  ) : isAdmin ? (
                                    <User className="h-4 w-4" />
                                  ) : (
                                    <Truck className="h-4 w-4" />
                                  )}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex-1 ${isStore ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              <div
                                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                  isStore
                                    ? 'bg-blue-600 text-white'
                                    : isAdmin
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-muted'
                                }`}
                              >
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                )}
                                
                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments?.map((attachment: ShippingServiceMessageAttachment) => (
                                      <MediaAttachment
                                        key={attachment.id}
                                        attachment={{
                                          id: attachment.id,
                                          file_name: attachment.file_name,
                                          file_type: attachment.file_type,
                                          file_url: attachment.file_url,
                                          storage_path: attachment.storage_path,
                                          file_size: attachment.file_size,
                                        }}
                                        size="medium"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isStore ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span>
                                  {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                </span>
                                {message.is_read && (
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="min-h-[80px] resize-none flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={!messageContent.trim() || isSending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto flex-shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







