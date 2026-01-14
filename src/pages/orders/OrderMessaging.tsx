/**
 * Order Messaging Page - Universal Chat System
 * Date: 28 octobre 2025
 *
 * Page de messagerie professionnelle entre vendeur et client
 * Support: Digital, Physical, Service products
 * Features: Text, Images, Videos, Files, Admin intervention
 */

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Send,
  Paperclip,
  MoreVertical,
  Shield,
  MessageSquare,
  CheckCheck,
  AlertCircle,
  User,
  Store,
  Crown,
  ArrowLeft,
  X,
  Loader2,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useMessaging } from '@/hooks/useMessaging';
import { Message, MessageType, SenderType } from '@/types/advanced-features';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { MediaAttachment } from '@/components/media';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Progress } from '@/components/ui/progress';
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { Search, ChevronUp } from 'lucide-react';
import { highlightText } from '@/utils/highlightText.tsx';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { StableDropdownMenu, DropdownMenuSeparator } from '@/components/ui/stable-dropdown-menu';

export default function OrderMessaging() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    currentConversation,
    messages,
    loading,
    messagesLoading,
    sendingMessage,
    createConversation,
    sendMessage,
    markMessagesAsRead,
    closeConversation,
    openConversation,
    enableAdminIntervention,
    loadMoreMessages,
    hasMoreMessages,
    totalMessagesCount,
  } = useMessaging(orderId);

  const [messageContent, setMessageContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const messagesTopRef = useRef<HTMLDivElement>(null);

  // Hook pour la recherche de messages
  const {
    searchMessages,
    results: searchResults,
    isSearching: isSearchingMessages,
    clearSearch,
  } = useMessageSearch();

  // Hook pour l'upload de fichiers avec progress tracking
  const { uploadFiles: uploadFilesWithProgress, state: uploadState } = useFileUpload();

  // Auto-scroll to bottom when new messages arrive (seulement pour nouveaux messages, pas lors du chargement de plus)
  useEffect(() => {
    // Ne scroll que si on n'est pas en train de charger plus de messages
    if (!messagesLoading && !hasMoreMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, messagesLoading, hasMoreMessages]);

  // Scroll vers le haut lors du chargement de plus de messages
  useEffect(() => {
    if (messagesLoading && messagesTopRef.current) {
      // Sauvegarder la position actuelle
      const scrollContainer = messagesTopRef.current.closest(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement;
      if (scrollContainer) {
        const previousScrollHeight = scrollContainer.scrollHeight;
        // Après le chargement, ajuster la position pour rester au même endroit visuel
        setTimeout(() => {
          const newScrollHeight = scrollContainer.scrollHeight;
          const scrollDifference = newScrollHeight - previousScrollHeight;
          scrollContainer.scrollTop = scrollDifference;
        }, 100);
      }
    }
  }, [messagesLoading]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      const unreadMessages = messages.filter(m => !m.is_read && m.sender_id !== user?.id);
      if (unreadMessages.length > 0) {
        markMessagesAsRead(currentConversation.id);
      }
    }
  }, [currentConversation, messages, user?.id, markMessagesAsRead]);

  // Open first conversation by default
  useEffect(() => {
    if (!currentConversation && conversations.length > 0) {
      openConversation(conversations[0].id);
    }
  }, [currentConversation, conversations, openConversation]);

  /**
   * Handle file selection (utilise la validation centralisée)
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Utiliser la validation centralisée (déjà importé en haut)

    const validFiles = filterValidFiles(files, {
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    // Afficher les erreurs pour les fichiers invalides
    files.forEach(file => {
      if (!validFiles.includes(file)) {
        const validation = validateFile(file, { maxSize: 10 * 1024 * 1024 });
        if (!validation.valid) {
          toast({
            title: 'Fichier invalide',
            description: `${file.name}: ${validation.error}`,
            variant: 'destructive',
          });
        }
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  /**
   * Remove selected file
   */
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCameraCapture = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
    setShowCameraDialog(false);
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
      setUploadProgress(0);

      // Upload files if any (utilise le hook avec progress tracking)
      let fileUrls: string[] = [];
      let storagePaths: string[] = [];
      if (selectedFiles.length > 0 && currentConversation) {
        const uploadResults = await uploadFilesWithProgress(selectedFiles, {
          folder: `message-attachments/${currentConversation.id}`,
          maxSize: 10 * 1024 * 1024, // 10MB
          compressImages: true, // Activer la compression d'images
          onProgress: progress => {
            setUploadProgress(progress);
          },
        });

        fileUrls = uploadResults.map(r => r.publicUrl);
        storagePaths = uploadResults.map(r => r.path);
      }

      // Determine message type
      let messageType: MessageType = 'text';
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
        attachments: selectedFiles.map((file, index) => {
          // Utiliser le storage_path retourné par l'upload (qui contient le chemin complet)
          const storagePath = storagePaths[index] || '';

          return {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: fileUrls[index] || '',
            storage_path: storagePath, // Utiliser le chemin complet retourné par l'upload
          };
        }),
      };

      await sendMessage(currentConversation.id, formData);

      // Reset form
      setMessageContent('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (_error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Impossible d'envoyer le message";
      logger.error('Send order message error', { error, orderId, conversationId });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  /**
   * Handle admin intervention
   */
  const handleAdminIntervention = async () => {
    if (!currentConversation) return;

    try {
      await enableAdminIntervention(currentConversation.id);
      toast({
        title: 'Intervention activée',
        description: 'Un administrateur a été notifié',
      });
      setShowAdminPanel(false);
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  /**
   * Get sender icon
   */
  const getSenderIcon = (senderType: SenderType) => {
    switch (senderType) {
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'store':
        return <Store className="h-4 w-4" />;
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  /**
   * Get message bubble color
   */
  const getMessageBubbleClass = (message: Message) => {
    const isOwn = message.sender_id === user?.id;

    if (message.sender_type === 'admin') {
      return 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-300';
    }

    if (isOwn) {
      return 'bg-primary text-primary-foreground';
    }

    return 'bg-muted';
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  if (!currentConversation && conversations.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="container mx-auto p-6">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <Card>
                <CardContent className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Aucune conversation</h3>
                    <p className="text-muted-foreground mb-4">
                      Cette commande n'a pas encore de conversation
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
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    Messagerie Commande
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Communication sécurisée avec le {currentConversation?.store?.name || 'vendeur'}
                  </p>
                </div>

                {/* Conversation Status */}
                {currentConversation && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={currentConversation.status === 'active' ? 'default' : 'secondary'}
                    >
                      {currentConversation.status === 'active'
                        ? 'Active'
                        : currentConversation.status === 'closed'
                          ? 'Fermée'
                          : 'Litige'}
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
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              {/* Messages Thread */}
              <Card className="flex flex-col h-[calc(100vh-280px)]">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <CardDescription>
                        {searchResults
                          ? `${searchResults.total} résultat(s)`
                          : `${messages.length} message${messages.length > 1 ? 's' : ''}`}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {showSearch ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="Rechercher dans les messages..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && searchQuery.trim()) {
                                await searchMessages({
                                  conversationId: currentConversation?.id,
                                  query: searchQuery.trim(),
                                });
                              }
                            }}
                            className="w-64"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              if (searchQuery.trim()) {
                                await searchMessages({
                                  conversationId: currentConversation?.id,
                                  query: searchQuery.trim(),
                                });
                              }
                            }}
                            disabled={isSearchingMessages || !searchQuery.trim()}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSearchQuery('');
                              setShowSearch(false);
                              clearSearch();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                          <Search className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Actions Menu */}
                      <StableDropdownMenu
                        triggerContent={<MoreVertical className="h-4 w-4" />}
                        triggerProps={{
                          variant: 'ghost' as const,
                          size: 'icon' as const,
                          'aria-label': "Menu d'actions",
                        }}
                      >
                        <SelectItem value="edit" onSelect={() => setShowAdminPanel(true)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Demander intervention admin
                        </SelectItem>
                        <DropdownMenuSeparator />
                        <SelectItem
                          value="delete"
                          onSelect={() => navigate(`/disputes/create?orderId=${orderId}`)}
                          className="text-destructive"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Ouvrir un litige
                        </SelectItem>
                      </StableDropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages List */}
                <ScrollArea
                  className="flex-1 p-4"
                  ref={node => {
                    if (node) {
                      const scrollContainer = node.querySelector(
                        '[data-radix-scroll-area-viewport]'
                      ) as HTMLElement;
                      if (scrollContainer) {
                        scrollContainer.addEventListener('scroll', () => {
                          // Infinite scroll: charger plus de messages quand on scroll en haut
                          if (
                            scrollContainer.scrollTop === 0 &&
                            !messagesLoading &&
                            hasMoreMessages &&
                            currentConversation
                          ) {
                            loadMoreMessages();
                          }
                        });
                      }
                    }
                  }}
                >
                  {messagesLoading || isSearchingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (searchResults ? searchResults.messages : messages).length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          {searchResults ? 'Aucun résultat trouvé' : 'Aucun message pour le moment'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {searchResults
                            ? "Essayez avec d'autres mots-clés"
                            : 'Commencez la conversation ci-dessous'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Référence pour le scroll automatique */}
                      <div ref={messagesTopRef} />

                      {/* Bouton "Charger plus" en haut si disponible */}
                      {!searchResults && hasMoreMessages && (
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadMoreMessages}
                            disabled={messagesLoading}
                            className="text-xs"
                          >
                            <ChevronUp className="h-3 w-3 mr-1" />
                            {messagesLoading
                              ? 'Chargement...'
                              : `Charger plus (${totalMessagesCount - messages.length} restants)`}
                          </Button>
                        </div>
                      )}

                      {(searchResults ? searchResults.messages : messages).map(message => {
                        const isOwn = message.sender_id === user?.id;
                        const isAdmin = message.sender_type === 'admin';

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
                            >
                              {/* Sender Info */}
                              <div className="flex items-center gap-2 px-2">
                                {!isOwn && (
                                  <div className="flex items-center gap-1">
                                    {getSenderIcon(message.sender_type)}
                                    <span className="text-xs font-medium">
                                      {isAdmin
                                        ? 'Admin'
                                        : message.sender_type === 'store'
                                          ? 'Vendeur'
                                          : 'Client'}
                                    </span>
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
                                </span>
                                {isOwn && message.is_read && (
                                  <CheckCheck className="h-3 w-3 text-primary" />
                                )}
                              </div>

                              {/* Message Bubble */}
                              <div
                                className={`rounded-2xl px-4 py-3 ${getMessageBubbleClass(message)}`}
                              >
                                {/* Text Content */}
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {searchResults && searchQuery ? (
                                      <span>{highlightText(message.content, searchQuery)}</span>
                                    ) : (
                                      message.content
                                    )}
                                  </p>
                                )}

                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map((attachment, idx) => (
                                      <MediaAttachment
                                        key={attachment.id || idx}
                                        attachment={{
                                          id: attachment.id || `attachment-${idx}`,
                                          file_name: attachment.file_name,
                                          file_type: attachment.file_type,
                                          file_url: attachment.file_url,
                                          storage_path: attachment.storage_path,
                                          file_size: attachment.file_size,
                                        }}
                                        size="large"
                                        showSize={true}
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
                <div className="border-t p-4 space-y-3">
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted"
                        >
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-primary" />
                          ) : file.type.startsWith('video/') ? (
                            <Video className="h-4 w-4 text-primary" />
                          ) : (
                            <File className="h-4 w-4 text-primary" />
                          )}
                          <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => removeFile(index)}
                            aria-label={`Supprimer le fichier ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex items-end gap-2">
                    <Textarea
                      placeholder="Écrivez votre message..."
                      value={messageContent}
                      onChange={e => setMessageContent(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px] max-h-[120px] resize-none"
                      disabled={sendingMessage || uploadingFiles}
                    />

                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowCameraDialog(true)}
                        disabled={sendingMessage || uploadingFiles}
                        aria-label="Prendre une photo"
                        title="Prendre une photo"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendingMessage || uploadingFiles}
                        aria-label="Joindre un fichier"
                        title="Joindre un fichier"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          sendingMessage ||
                          uploadingFiles ||
                          (!messageContent.trim() && selectedFiles.length === 0)
                        }
                        className="min-w-[80px]"
                      >
                        {sendingMessage || uploadingFiles ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Progress indicator pour l'upload */}
                    {uploadingFiles && uploadProgress > 0 && (
                      <div className="px-4 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">
                            Upload en cours... {uploadProgress}%
                          </span>
                        </div>
                        <Progress value={uploadProgress} className="h-1" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Appuyez sur Entrée pour envoyer, Shift+Entrée pour une nouvelle ligne
                  </p>
                </div>
              </Card>

              {/* Sidebar Info */}
              <div className="space-y-4">
                {/* Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Commande
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {currentConversation?.order && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Numéro</p>
                          <p className="font-medium">{currentConversation.order.order_number}</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground">Montant</p>
                          <p className="font-medium">
                            {currentConversation.order.total_amount.toLocaleString()}{' '}
                            {currentConversation.order.currency}
                          </p>
                        </div>
                        <Separator />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/orders/${orderId}`)}
                        >
                          Voir détails commande
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Help Card */}
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Besoin d'aide ?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      En cas de problème, vous pouvez :
                    </p>
                    <ul className="text-sm space-y-2 text-blue-800 dark:text-blue-200">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>Demander une intervention admin</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                        <span>Ouvrir un litige officiel</span>
                      </li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAdminPanel(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Demander aide admin
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Admin Intervention Dialog */}
          <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Intervention Administrateur
                </DialogTitle>
                <DialogDescription>
                  Demander l'intervention d'un administrateur dans cette conversation
                </DialogDescription>
              </DialogHeader>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Un administrateur sera notifié et pourra intervenir dans la conversation pour vous
                  aider à résoudre tout problème.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAdminPanel(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAdminIntervention}>
                  <Crown className="h-4 w-4 mr-2" />
                  Confirmer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Camera Capture Dialog */}
          <CameraCapture
            open={showCameraDialog}
            onClose={() => setShowCameraDialog(false)}
            onCapture={handleCameraCapture}
            captureLabel="Prendre la photo"
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
