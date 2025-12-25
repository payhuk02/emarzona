/**
 * 🔧 Administration - Conversations Services de Livraison
 * Page pour que l'administrateur puisse contrôler et intervenir dans les échanges
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Store,
  Truck,
  Shield,
  Send,
  Eye,
  Loader2,
  Archive,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

interface ShippingConversation {
  id: string;
  store_id: string;
  shipping_service_id: string;
  store_user_id: string;
  subject?: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
  created_at: string;
  updated_at: string;
  // Relations
  store?: {
    id: string;
    name: string;
    slug: string;
  };
  shipping_service?: {
    id: string;
    name: string;
    contact_email?: string;
  };
  store_user?: {
    user_id: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
  last_message?: {
    id: string;
    content: string;
    sender_type: string;
    created_at: string;
  };
  message_count?: number;
  unread_count?: number;
  is_disputed?: boolean;
}

export default function AdminShippingConversations() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disputedFilter, setDisputedFilter] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<ShippingConversation | null>(
    null
  );
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState('');
  const [viewingMessages, setViewingMessages] = useState(false);

  // Charger toutes les conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['admin-shipping-conversations', statusFilter, disputedFilter],
    queryFn: async () => {
      let query = supabase
        .from('shipping_service_conversations')
        .select(
          `
          *,
          store:stores (
            id,
            name,
            slug
          ),
          shipping_service:global_shipping_services (
            id,
            name,
            contact_email
          )
        `
        )
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST116') {
          return [];
        }
        throw error;
      }

      // Enrichir avec les informations utilisateur et messages
      const enrichedConversations = await Promise.all(
        (data || []).map(async (conv: ShippingConversation) => {
          // Récupérer l'utilisateur du store
          const { data: storeUser } = await supabase
            .from('profiles')
            .select('user_id, display_name, first_name, last_name')
            .eq('user_id', conv.store_user_id)
            .single();

          // Compter les messages
          const { count: messageCount } = await supabase
            .from('shipping_service_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          // Compter les messages non lus
          const { count: unreadCount } = await supabase
            .from('shipping_service_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false);

          // Récupérer le dernier message
          const { data: lastMessage } = await supabase
            .from('shipping_service_messages')
            .select('id, content, sender_type, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Vérifier si c'est un litige (dans metadata)
          const isDisputed =
            conv.metadata?.is_disputed === true || conv.metadata?.disputed === true;

          return {
            ...conv,
            store_user: storeUser,
            message_count: messageCount || 0,
            unread_count: unreadCount || 0,
            last_message: lastMessage,
            is_disputed: isDisputed,
          };
        })
      );

      // Filtrer par litige si nécessaire
      if (disputedFilter === 'disputed') {
        interface EnrichedConversation extends ShippingConversation {
          is_disputed?: boolean;
          [key: string]: unknown;
        }
        return enrichedConversations.filter((c: EnrichedConversation) => c.is_disputed);
      } else if (disputedFilter === 'not_disputed') {
        interface EnrichedConversation extends ShippingConversation {
          is_disputed?: boolean;
          [key: string]: unknown;
        }
        return enrichedConversations.filter((c: EnrichedConversation) => !c.is_disputed);
      }

      return enrichedConversations;
    },
  });

  // Filtrer par recherche
  const filteredConversations =
    conversations?.filter((conv: ShippingConversation) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        conv.subject?.toLowerCase().includes(searchLower) ||
        conv.store?.name?.toLowerCase().includes(searchLower) ||
        conv.shipping_service?.name?.toLowerCase().includes(searchLower) ||
        conv.last_message?.content?.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Marquer comme litige
  const markAsDisputedMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: conversation } = await supabase
        .from('shipping_service_conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      const metadata = conversation?.metadata || {};
      metadata.is_disputed = true;
      metadata.disputed_at = new Date().toISOString();

      const { error } = await supabase
        .from('shipping_service_conversations')
        .update({ metadata })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-conversations'] });
      toast({
        title: '✅ Litige marqué',
        description: 'La conversation a été marquée comme litige.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error marking as disputed', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de marquer comme litige.',
        variant: 'destructive',
      });
    },
  });

  // Résoudre le litige
  const resolveDisputeMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: conversation } = await supabase
        .from('shipping_service_conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();

      const metadata = conversation?.metadata || {};
      metadata.is_disputed = false;
      metadata.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('shipping_service_conversations')
        .update({ metadata })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-conversations'] });
      toast({
        title: '✅ Litige résolu',
        description: 'Le litige a été résolu.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error resolving dispute', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de résoudre le litige.',
        variant: 'destructive',
      });
    },
  });

  // Envoyer un message d'intervention
  const sendInterventionMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !interventionMessage.trim()) {
        throw new Error('Message requis');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase.from('shipping_service_messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        sender_type: 'admin',
        content: interventionMessage.trim(),
        message_type: 'text',
        metadata: {
          is_admin_intervention: true,
          intervention_type: 'general',
        },
      });

      if (error) throw error;

      // Marquer comme litige si ce n'est pas déjà le cas
      if (!selectedConversation.is_disputed) {
        await markAsDisputedMutation.mutateAsync(selectedConversation.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-conversations'] });
      queryClient.invalidateQueries({ queryKey: ['shipping-service-messages'] });
      setInterventionMessage('');
      setShowInterventionDialog(false);
      toast({
        title: '✅ Message envoyé',
        description: 'Votre intervention a été envoyée.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error sending intervention message', error);
      toast({
        title: '❌ Erreur',
        description: error.message || "Impossible d'envoyer le message.",
        variant: 'destructive',
      });
    },
  });

  // Fermer une conversation
  const closeConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('shipping_service_conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-conversations'] });
      toast({
        title: '✅ Conversation fermée',
        description: 'La conversation a été fermée.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error closing conversation', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de fermer la conversation.',
        variant: 'destructive',
      });
    },
  });

  // Statistiques
  const stats = {
    total: conversations?.length || 0,
    active: conversations?.filter((c: ShippingConversation) => c.status === 'active').length || 0,
    disputed: conversations?.filter((c: ShippingConversation) => c.is_disputed).length || 0,
    closed: conversations?.filter((c: ShippingConversation) => c.status === 'closed').length || 0,
  };

  return (
    <SidebarProvider>
      <AdminLayout>
        <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex flex-wrap items-center gap-2">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0" />
              <span className="break-words">Conversations Services de Livraison</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Contrôle et intervention dans les échanges entre vendeurs et services de livraison
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Actives</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">En cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Litiges</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.disputed}</div>
                <p className="text-xs text-muted-foreground">À traiter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium">Fermées</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-gray-600">{stats.closed}</div>
                <p className="text-xs text-muted-foreground">Résolues</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-sm sm:text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Rechercher par sujet, boutique, service..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full min-h-[44px]"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="closed">Fermées</SelectItem>
                    <SelectItem value="archived">Archivées</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={disputedFilter} onValueChange={setDisputedFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                    <SelectValue placeholder="Litiges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="disputed">Avec litige</SelectItem>
                    <SelectItem value="not_disputed">Sans litige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des conversations */}
          <Card>
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>
                {filteredConversations.length} conversation
                {filteredConversations.length > 1 ? 's' : ''} trouvée
                {filteredConversations.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune conversation trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConversations.map((conversation: ShippingConversation) => (
                    <Card
                      key={conversation.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        conversation.is_disputed
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        setViewingMessages(true);
                      }}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm sm:text-base break-words">
                                {conversation.subject || 'Sans sujet'}
                              </h3>
                              {conversation.is_disputed && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Litige
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  conversation.status === 'active'
                                    ? 'default'
                                    : conversation.status === 'closed'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {conversation.status === 'active'
                                  ? 'Active'
                                  : conversation.status === 'closed'
                                    ? 'Fermée'
                                    : 'Archivée'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {conversation.store?.name || 'Boutique inconnue'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {conversation.shipping_service?.name || 'Service inconnu'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span>
                                  {conversation.message_count || 0} message
                                  {conversation.message_count !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>

                            {conversation.last_message && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                                {conversation.last_message.content}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {conversation.last_message_at && (
                                <span className="truncate">
                                  Dernier message:{' '}
                                  {formatDistanceToNow(new Date(conversation.last_message_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none min-h-[44px]"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedConversation(conversation);
                                setViewingMessages(true);
                              }}
                            >
                              <Eye className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Voir</span>
                            </Button>
                            {!conversation.is_disputed && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 sm:flex-none min-h-[44px]"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedConversation(conversation);
                                  setShowInterventionDialog(true);
                                }}
                              >
                                <Shield className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Intervenir</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dialog d'intervention */}
        <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Intervenir dans la conversation</DialogTitle>
              <DialogDescription>
                Envoyez un message en tant qu'administrateur. La conversation sera automatiquement
                marquée comme litige.
              </DialogDescription>
            </DialogHeader>
            {selectedConversation && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Conversation:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.store?.name} ↔{' '}
                    {selectedConversation.shipping_service?.name}
                  </p>
                  {selectedConversation.subject && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Sujet: {selectedConversation.subject}
                    </p>
                  )}
                </div>
                <Textarea
                  placeholder="Votre message d'intervention..."
                  value={interventionMessage}
                  onChange={e => setInterventionMessage(e.target.value)}
                  className="min-h-[150px]"
                />
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto min-h-[44px]"
                    onClick={() => {
                      setShowInterventionDialog(false);
                      setInterventionMessage('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="w-full sm:w-auto min-h-[44px]"
                    onClick={() => sendInterventionMessageMutation.mutate()}
                    disabled={
                      !interventionMessage.trim() || sendInterventionMessageMutation.isPending
                    }
                  >
                    {sendInterventionMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Envoyer l'intervention
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de visualisation des messages */}
        <Dialog open={viewingMessages} onOpenChange={setViewingMessages}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Messages - {selectedConversation?.store?.name} ↔{' '}
                {selectedConversation?.shipping_service?.name}
              </DialogTitle>
              <DialogDescription>{selectedConversation?.subject || 'Sans sujet'}</DialogDescription>
            </DialogHeader>
            {selectedConversation && (
              <ConversationMessagesView
                conversationId={selectedConversation.id}
                conversation={selectedConversation}
                onMarkDisputed={() => markAsDisputedMutation.mutate(selectedConversation.id)}
                onResolveDispute={() => resolveDisputeMutation.mutate(selectedConversation.id)}
                onClose={() => closeConversationMutation.mutate(selectedConversation.id)}
                isDisputed={selectedConversation.is_disputed}
                onIntervene={() => {
                  setViewingMessages(false);
                  setShowInterventionDialog(true);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </SidebarProvider>
  );
}

// Composant pour afficher les messages d'une conversation
function ConversationMessagesView({
  conversationId,
  conversation,
  onMarkDisputed,
  onResolveDispute,
  onClose,
  isDisputed,
  onIntervene,
}: {
  conversationId: string;
  conversation: ShippingConversation;
  onMarkDisputed: () => void;
  onResolveDispute: () => void;
  onClose: () => void;
  isDisputed: boolean;
  onIntervene: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      content?: string;
      sender_type: string;
      created_at: string;
      sender?: { name?: string; avatar_url?: string };
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interventionMessage, setInterventionMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('shipping_service_messages')
        .select(
          `
          *,
          attachments:shipping_service_message_attachments (*)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      interface MessageData {
        sender_id: string;
      }
      const senderIds = [...new Set((messagesData || []).map((m: MessageData) => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, avatar_url')
        .in('user_id', senderIds);

      interface ProfileData {
        user_id: string;
        display_name?: string;
        first_name?: string;
        last_name?: string;
        avatar_url?: string;
      }
      interface MessageWithSender extends MessageData {
        id: string;
        content: string;
        sender_type: string;
        created_at: string;
        sender?: ProfileData;
      }
      const messagesWithSenders = (messagesData || []).map(
        (message: MessageData): MessageWithSender => ({
          ...(message as MessageWithSender),
          sender: profilesData?.find((p: ProfileData) => p.user_id === message.sender_id),
        })
      );

      setMessages(messagesWithSenders);
    } catch (error: unknown) {
      logger.error('Error loading messages', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les messages.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendIntervention = async () => {
    if (!interventionMessage.trim()) return;

    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      const { error } = await supabase.from('shipping_service_messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_type: 'admin',
        content: interventionMessage.trim(),
        message_type: 'text',
        metadata: {
          is_admin_intervention: true,
        },
      });

      if (error) throw error;

      if (!isDisputed) {
        onMarkDisputed();
      }

      setInterventionMessage('');
      await loadMessages();
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-conversations'] });

      toast({
        title: '✅ Message envoyé',
        description: 'Votre intervention a été envoyée.',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error sending intervention', error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || "Impossible d'envoyer le message.",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!isDisputed ? (
          <Button variant="outline" size="sm" onClick={onMarkDisputed}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Marquer comme litige
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={onResolveDispute}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Résoudre le litige
          </Button>
        )}
        {conversation.status === 'active' && (
          <Button variant="outline" size="sm" onClick={onClose}>
            <Archive className="h-4 w-4 mr-2" />
            Fermer la conversation
          </Button>
        )}
      </div>

      <Separator />

      {/* Messages */}
      <ScrollArea className="h-[400px] pr-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: MessageWithSender) => {
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
                      {isStore ? (
                        <Store className="h-4 w-4" />
                      ) : isAdmin ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex-1 ${isStore ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {message.sender?.display_name ||
                          message.sender?.first_name ||
                          (isStore ? 'Vendeur' : isAdmin ? 'Administrateur' : 'Service')}
                      </span>
                      {isAdmin && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        isStore
                          ? 'bg-blue-600 text-white'
                          : isAdmin
                            ? 'bg-purple-600 text-white'
                            : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Intervention rapide */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium">Intervention rapide</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea
            placeholder="Votre message d'intervention..."
            value={interventionMessage}
            onChange={e => setInterventionMessage(e.target.value)}
            className="min-h-[80px] flex-1"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendIntervention();
              }
            }}
          />
          <Button
            onClick={handleSendIntervention}
            disabled={!interventionMessage.trim() || sending}
            className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto flex-shrink-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}
