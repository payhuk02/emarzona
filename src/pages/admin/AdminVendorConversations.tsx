/**
 * 🔧 Administration - Conversations Clients-Vendeurs
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
  Shield,
  Send,
  Eye,
  Loader2,
  Archive,
  XCircle,
  Crown,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

interface VendorConversation {
  id: string;
  store_id: string;
  product_id?: string;
  customer_user_id: string;
  store_user_id: string;
  subject?: string;
  status: 'active' | 'closed' | 'disputed';
  last_message_at?: string;
  admin_intervention: boolean;
  admin_user_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  store?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
    image_url?: string;
  };
  customer_user?: {
    user_id: string;
    name?: string;
    avatar_url?: string;
  };
  store_user?: {
    user_id: string;
    name?: string;
    avatar_url?: string;
  };
  last_message?: {
    id: string;
    content: string;
    sender_type: string;
    created_at: string;
  };
  message_count?: number;
  unread_count?: number;
}

interface VendorMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'store' | 'admin';
  content?: string;
  message_type: string;
  created_at: string;
  sender?: {
    name?: string;
    avatar_url?: string;
  };
}

export default function AdminVendorConversations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedConversation, setSelectedConversation] = useState<VendorConversation | null>(null);
  const [showInterventionDialog, setShowInterventionDialog] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Récupérer les conversations
  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin-vendor-conversations', statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('vendor_conversations')
        .select(
          `
          *,
          store:stores (id, name, slug, logo_url),
          product:products (id, name, slug, image_url)
        `
        )
        .order('last_message_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching vendor conversations:', error);
        throw error;
      }

      // Récupérer les profils des utilisateurs
      type ConversationData = {
        customer_user_id: string;
        store_user_id: string;
        id: string;
      };
      const userIds = [
        ...new Set([
          ...(data || []).map((c: ConversationData) => c.customer_user_id),
          ...(data || []).map((c: ConversationData) => c.store_user_id),
        ]),
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      // Récupérer les compteurs de messages
      const conversationIds = (data || []).map((c: ConversationData) => c.id);
      const { data: messageCounts } = await supabase
        .from('vendor_messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds);

      // Combiner les données
      type Profile = {
        user_id: string;
        name: string | null;
        avatar_url: string | null;
      };
      type MessageCount = {
        conversation_id: string;
      };
      return (data || []).map((conv: ConversationData) => {
        const customerProfile = profiles?.find((p: Profile) => p.user_id === conv.customer_user_id);
        const storeProfile = profiles?.find((p: Profile) => p.user_id === conv.store_user_id);
        const messageCount =
          messageCounts?.filter((m: MessageCount) => m.conversation_id === conv.id).length || 0;

        return {
          ...conv,
          customer_user: customerProfile,
          store_user: storeProfile,
          message_count: messageCount,
        };
      }) as VendorConversation[];
    },
  });

  // Récupérer les messages d'une conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-vendor-messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];

      const { data: messagesData, error } = await supabase
        .from('vendor_messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Récupérer les profils des expéditeurs
      type MessageData = {
        sender_id: string;
        [key: string]: unknown;
      };
      type Profile = {
        user_id: string;
        name: string | null;
        avatar_url: string | null;
      };
      const senderIds = [...new Set((messagesData || []).map((m: MessageData) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', senderIds);

      return (messagesData || []).map((message: MessageData) => {
        const profile = profiles?.find((p: Profile) => p.user_id === message.sender_id);
        return {
          ...message,
          sender: profile
            ? {
                name: profile.name,
                avatar_url: profile.avatar_url,
              }
            : null,
        };
      }) as VendorMessage[];
    },
    enabled: !!selectedConversation,
  });

  // Statistiques
  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    closed: conversations.filter(c => c.status === 'closed').length,
    disputed: conversations.filter(c => c.status === 'disputed').length,
    withIntervention: conversations.filter(c => c.admin_intervention).length,
  };

  // Filtrer les conversations
  const filteredConversations = conversations.filter(conv => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        conv.store?.name?.toLowerCase().includes(query) ||
        conv.product?.name?.toLowerCase().includes(query) ||
        conv.customer_user?.name?.toLowerCase().includes(query) ||
        conv.store_user?.name?.toLowerCase().includes(query) ||
        conv.subject?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Mutation pour envoyer un message d'intervention
  const sendInterventionMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error('Aucune conversation sélectionnée');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Envoyer le message
      const { data: message, error: messageError } = await supabase
        .from('vendor_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          sender_type: 'admin',
          content,
          message_type: 'text',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Marquer l'intervention admin
      const { error: updateError } = await supabase
        .from('vendor_conversations')
        .update({
          admin_intervention: true,
          admin_user_id: user.id,
        })
        .eq('id', selectedConversation.id);

      if (updateError) throw updateError;

      return message;
    },
    onSuccess: () => {
      toast({
        title: 'Message envoyé',
        description: 'Votre intervention a été enregistrée',
      });
      setInterventionMessage('');
      setShowInterventionDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-conversations'] });
      refetch();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error sending intervention message:', error);
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible d'envoyer le message",
        variant: 'destructive',
      });
    },
  });

  // Mutation pour marquer comme litige
  const markAsDisputed = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('vendor_conversations')
        .update({ status: 'disputed' })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Conversation marquée comme litige',
        description: 'La conversation a été marquée comme litige',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-conversations'] });
      refetch();
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error marking as disputed:', error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de marquer comme litige',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fermée</Badge>;
      case 'disputed':
        return <Badge variant="destructive">Litige</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <AdminLayout>
        <div className="flex-1 space-y-6 p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                Conversations Clients-Vendeurs
              </h1>
              <p className="text-muted-foreground mt-1">
                Contrôle et intervention dans les échanges entre clients et vendeurs
              </p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Actives</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                <p className="text-xs text-muted-foreground">Fermées</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.disputed}</div>
                <p className="text-xs text-muted-foreground">Litiges</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.withIntervention}</div>
                <p className="text-xs text-muted-foreground">Interventions</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par boutique, produit, utilisateur..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 min-h-[44px]"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="closed">Fermées</SelectItem>
                    <SelectItem value="disputed">Litiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des conversations */}
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>
                  {filteredConversations.length} conversation
                  {filteredConversations.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune conversation trouvée
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-2">
                      {filteredConversations.map(conv => (
                        <div
                          key={conv.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedConversation?.id === conv.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedConversation(conv)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(conv.status)}
                                {conv.admin_intervention && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Crown className="h-3 w-3" />
                                    Intervention
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <Store className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium truncate">
                                  {conv.store?.name || 'Boutique'}
                                </span>
                              </div>
                              {conv.product && (
                                <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
                                  <span className="truncate">{conv.product.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span>
                                  {conv.message_count || 0} message
                                  {conv.message_count !== 1 ? 's' : ''}
                                </span>
                                {conv.last_message_at && (
                                  <span>
                                    {formatDistanceToNow(new Date(conv.last_message_at), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Détails de la conversation sélectionnée */}
            {selectedConversation && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Détails</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInterventionDialog(true)}
                        className="min-h-[44px]"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Intervenir
                      </Button>
                      {selectedConversation.status !== 'disputed' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => markAsDisputed.mutate(selectedConversation.id)}
                          className="min-h-[44px]"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Litige
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] mb-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Aucun message</div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(message => {
                          const isAdmin = message.sender_type === 'admin';
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  isAdmin
                                    ? 'bg-yellow-100 dark:bg-yellow-900'
                                    : message.sender_type === 'store'
                                      ? 'bg-blue-100 dark:bg-blue-900'
                                      : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {isAdmin && <Crown className="h-3 w-3 text-yellow-600" />}
                                  <span className="text-xs font-medium">
                                    {isAdmin
                                      ? 'Admin'
                                      : message.sender_type === 'store'
                                        ? 'Vendeur'
                                        : 'Client'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                                  </span>
                                </div>
                                {message.content && <p className="text-sm">{message.content}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog d'intervention */}
        <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Intervention administrative</DialogTitle>
              <DialogDescription>
                Envoyez un message en tant qu'administrateur pour intervenir dans cette conversation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Votre message d'intervention..."
                value={interventionMessage}
                onChange={e => setInterventionMessage(e.target.value)}
                rows={5}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInterventionDialog(false)}
                  className="min-h-[44px]"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => sendInterventionMessage.mutate(interventionMessage)}
                  disabled={!interventionMessage.trim() || sendInterventionMessage.isPending}
                  className="min-h-[44px]"
                >
                  {sendInterventionMessage.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </SidebarProvider>
  );
}
