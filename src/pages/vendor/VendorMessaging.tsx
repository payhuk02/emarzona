/**
 * Vendor Messaging Page - Contact Vendeur
 * Date: 2025-01-31
 * 
 * Page de messagerie pour contacter les vendeurs directement depuis les cartes produits
 */

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Paperclip,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Store,
  User,
  Crown,
  CheckCheck,
  Check,
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useVendorMessaging } from '@/hooks/useVendorMessaging';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';
import { MediaAttachment } from '@/components/media';

export default function VendorMessaging() {
  const { storeId, productId } = useParams<{ storeId?: string; productId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Récupérer storeId et productId depuis les params ou searchParams
  const finalStoreId = storeId || searchParams.get('storeId') || undefined;
  const finalProductId = productId || searchParams.get('productId') || undefined;

  const {
    conversations,
    currentConversation,
    messages,
    loading,
    messagesLoading,
    sendingMessage,
    createConversation,
    sendMessage,
    openConversation,
    closeConversation,
    fetchConversations,
  } = useVendorMessaging(finalStoreId, finalProductId);

  const [messageContent, setMessageContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Créer une conversation si nécessaire
  useEffect(() => {
    if (!loading && !currentConversation && finalStoreId && user) {
      // Vérifier si une conversation existe déjà
      const existingConv = conversations.find(
        c => c.store_id === finalStoreId && 
        (finalProductId ? c.product_id === finalProductId : true)
      );
      
      if (existingConv) {
        openConversation(existingConv.id);
      } else {
        // Créer une nouvelle conversation
        createConversation(
          finalStoreId,
          finalProductId,
          `Question sur ${finalProductId ? 'le produit' : 'la boutique'}`
        );
      }
    }
  }, [loading, currentConversation, finalStoreId, finalProductId, user, conversations, createConversation, openConversation]);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Fichier trop volumineux',
          description: `${file.name} dépasse 10MB`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  /**
   * Handle send message
   */
  const handleSendMessage = async () => {
    if (!messageContent.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Message vide',
        description: 'Veuillez écrire un message ou joindre un fichier',
        variant: 'destructive',
      });
      return;
    }

    if (!currentConversation) {
      toast({
        title: 'Erreur',
        description: 'Aucune conversation active',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingFiles(true);

      // Upload files if any
      const fileUrls: string[] = [];
      const storagePaths: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `vendor-message-attachments/${fileName}`;

          // Déterminer le Content-Type correct selon l'extension si file.type est vide
          let contentType = file.type;
          if (!contentType || contentType === 'application/octet-stream' || contentType === '') {
            const ext = fileExt.toLowerCase();
            const mimeTypes: Record<string, string> = {
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'webp': 'image/webp',
              'pdf': 'application/pdf',
              'mp4': 'video/mp4',
              'webm': 'video/webm',
            };
            contentType = mimeTypes[ext] || 'application/octet-stream';
          }

          // Uploader avec Content-Type explicite pour garantir le bon type MIME
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: contentType, // Utiliser le Content-Type déterminé
              metadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
              }
            });

          if (uploadError) {
            logger.error('File upload error', {
              fileName: file.name,
              filePath,
              error: uploadError.message,
              fileType: file.type,
              fileSize: file.size
            });
            throw uploadError;
          }

          // Vérifier que l'upload a réussi
          if (!uploadData?.path) {
            logger.error('Upload returned no path', { fileName, filePath, uploadData });
            throw new Error(`L'upload du fichier ${file.name} a échoué : aucune donnée retournée`);
          }

          storagePaths.push(uploadData.path);

          // Générer l'URL publique avec vérification
          const { data: urlData, error: urlError } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath);

          if (urlError || !urlData?.publicUrl) {
            // Fallback : construire l'URL manuellement avec encodage correct
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            if (supabaseUrl) {
              const baseUrl = supabaseUrl.replace(/\/$/, '');
              // Encoder chaque segment du chemin séparément
              const encodedPath = filePath
                .split('/')
                .map(segment => encodeURIComponent(segment))
                .join('/');
              const fallbackUrl = `${baseUrl}/storage/v1/object/public/attachments/${encodedPath}`;
              fileUrls.push(fallbackUrl);
              logger.warn('Using fallback URL for attachment', { filePath, fallbackUrl });
            } else {
              throw new Error('Impossible de générer l\'URL publique du fichier');
            }
          } else {
            // Vérifier que l'URL générée est valide
            const publicUrl = urlData.publicUrl;
            if (publicUrl && publicUrl.includes('/storage/v1/object/public/')) {
              fileUrls.push(publicUrl);
            } else {
              // Si l'URL n'est pas valide, utiliser le fallback
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              if (supabaseUrl) {
                const baseUrl = supabaseUrl.replace(/\/$/, '');
                const encodedPath = filePath
                  .split('/')
                  .map(segment => encodeURIComponent(segment))
                  .join('/');
                const fallbackUrl = `${baseUrl}/storage/v1/object/public/attachments/${encodedPath}`;
                fileUrls.push(fallbackUrl);
                logger.warn('Invalid URL from getPublicUrl, using fallback', { originalUrl: publicUrl, fallbackUrl });
              } else {
                fileUrls.push(publicUrl); // Dernier recours
              }
            }
          }
        }
      }

      // Determine message type
      let messageType: 'text' | 'image' | 'video' | 'file' = 'text';
      if (selectedFiles.length > 0) {
        const firstFile = selectedFiles[0];
        if (firstFile.type.startsWith('image/')) {
          messageType = 'image';
        } else if (firstFile.type.startsWith('video/')) {
          messageType = 'video';
        } else {
          messageType = 'file';
        }
      }

      // Prepare message data
      const formData = {
        content: messageContent,
        message_type: messageType,
        attachments: selectedFiles.map((file, index) => ({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: fileUrls[index] || '',
          storage_path: storagePaths[index] || `vendor-message-attachments/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`,
        })),
      };

      await sendMessage(currentConversation.id, formData);

      // Reset form
      setMessageContent('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      logger.error('Send vendor message error', { error, storeId, productId });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  /**
   * Get sender icon
   */
  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'store':
        return <Store className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Chargement de la messagerie...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Si pas de storeId spécifique, afficher la liste des conversations
  if (!finalStoreId && conversations.length > 0 && !currentConversation) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6 max-w-7xl">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Messages Clients
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez toutes vos conversations avec vos clients
                </p>
              </div>

              <div className="grid lg:grid-cols-[350px_1fr] gap-6">
                {/* Liste des conversations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Conversations ({conversations.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-1">
                        {conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            className="w-full text-left p-3 hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conv.store?.logo_url || undefined} />
                                <AvatarFallback>
                                  <Store className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm truncate">
                                    {conv.store?.name || 'Boutique'}
                                  </p>
                                  {conv.unread_count && conv.unread_count > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conv.unread_count}
                                    </Badge>
                                  )}
                                </div>
                                {conv.product && (
                                  <p className="text-xs text-muted-foreground truncate mb-1">
                                    {conv.product.name}
                                  </p>
                                )}
                                {conv.last_message && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {conv.last_message.content || 'Pièce jointe'}
                                  </p>
                                )}
                                {conv.last_message_at && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(conv.last_message_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Zone de message vide */}
                <Card>
                  <CardContent className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h3>
                      <p className="text-muted-foreground">
                        Choisissez une conversation dans la liste pour commencer à échanger
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!currentConversation && conversations.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              
              <Card>
                <CardContent className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune conversation</h3>
                    <p className="text-muted-foreground mb-4">
                      {finalStoreId 
                        ? "Vous n'avez pas encore de conversation avec ce vendeur"
                        : "Vous n'avez pas encore de conversation avec vos clients"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    {finalStoreId ? 'Contacter le vendeur' : 'Messages Clients'}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {currentConversation?.store?.name ? (
                      <>Communication avec <span className="font-medium">{currentConversation.store.name}</span></>
                    ) : finalStoreId ? (
                      'Communication sécurisée avec le vendeur'
                    ) : (
                      'Gérez toutes vos conversations avec vos clients'
                    )}
                  </p>
                </div>

                {/* Conversation Status */}
                {currentConversation && (
                  <div className="flex items-center gap-2">
                    <Badge variant={currentConversation.status === 'active' ? 'default' : 'secondary'}>
                      {currentConversation.status === 'active' ? 'Active' : 
                       currentConversation.status === 'closed' ? 'Fermée' : 'Litige'}
                    </Badge>
                    
                    {currentConversation.admin_intervention && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Crown className="h-3 w-3" />
                        Intervention Admin
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Interface */}
            <div className="grid lg:grid-cols-[350px_1fr_300px] gap-6">
              {/* Liste des conversations (si pas de storeId spécifique) */}
              {!finalStoreId && conversations.length > 1 && (
                <Card className="hidden lg:block">
                  <CardHeader>
                    <CardTitle className="text-lg">Conversations</CardTitle>
                    <CardDescription>{conversations.length} conversation(s)</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      <div className="space-y-1">
                        {conversations.map((conv) => (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id)}
                            className={`w-full text-left p-3 hover:bg-accent transition-colors border-b last:border-b-0 ${
                              currentConversation?.id === conv.id ? 'bg-accent' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conv.store?.logo_url || undefined} />
                                <AvatarFallback>
                                  <Store className="h-4 w-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-sm truncate">
                                    {conv.store?.name || 'Boutique'}
                                  </p>
                                  {conv.unread_count && conv.unread_count > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conv.unread_count}
                                    </Badge>
                                  )}
                                </div>
                                {conv.product && (
                                  <p className="text-xs text-muted-foreground truncate mb-1">
                                    {conv.product.name}
                                  </p>
                                )}
                                {conv.last_message && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {conv.last_message.content || 'Pièce jointe'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
              {/* Messages Thread */}
              <Card className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <CardDescription>
                        {messages.length} message{messages.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages List */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">Aucun message pour le moment</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Commencez la conversation ci-dessous
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.sender_id === user?.id;
                        const isAdmin = message.sender_type === 'admin';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                              {/* Sender Info */}
                              <div className="flex items-center gap-2 px-2">
                                {!isOwn && (
                                  <div className="flex items-center gap-1">
                                    {getSenderIcon(message.sender_type)}
                                    <span className="text-xs font-medium">
                                      {isAdmin ? 'Admin' : message.sender_type === 'store' ? 'Vendeur' : 'Vous'}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                                </span>
                                {isOwn && message.is_read && (
                                  <CheckCheck className="h-3 w-3 text-primary" />
                                )}
                                {isOwn && !message.is_read && (
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>

                              {/* Message Bubble */}
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : isAdmin
                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
                                    : 'bg-muted'
                                }`}
                              >
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                )}
                                
                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map((attachment) => (
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
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4">
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="min-h-[80px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFiles}
                        aria-label="Joindre un fichier"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || uploadingFiles || (!messageContent.trim() && selectedFiles.length === 0)}
                        size="icon"
                        aria-label="Envoyer le message"
                      >
                        {sendingMessage || uploadingFiles ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Sidebar - Store/Product Info */}
              <div className="space-y-4">
                {currentConversation?.store && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Boutique</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        {currentConversation.store.logo_url && (
                          <Avatar>
                            <AvatarImage src={currentConversation.store.logo_url} />
                            <AvatarFallback>
                              <Store className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="font-medium">{currentConversation.store.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {currentConversation.store.slug}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentConversation?.product && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Produit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        {currentConversation.product.image_url && (
                          <img
                            src={currentConversation.product.image_url}
                            alt={currentConversation.product.name}
                            className="w-12 h-12 rounded object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{currentConversation.product.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

