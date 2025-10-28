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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Video,
  File,
  MoreVertical,
  Shield,
  Lock,
  Unlock,
  MessageSquare,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  User,
  Store,
  Crown,
  ArrowLeft,
  Camera,
  X,
  Loader2,
  AlertTriangle,
  Package
} from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useMessaging } from '@/hooks/useMessaging';
import { Message, MessageType, SenderType, Conversation } from '@/types/advanced-features';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  } = useMessaging(orderId);

  const [messageContent, setMessageContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
   * Handle file selection
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file sizes (max 10MB per file)
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
   * Remove selected file
   */
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Upload files to Supabase Storage
   */
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `messages/${orderId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
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
      let fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        fileUrls = await uploadFiles(selectedFiles);
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
        attachments: selectedFiles.map((file, index) => ({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: fileUrls[index] || '',
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
      console.error('Send message error:', error);
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
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
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
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="mb-4"
              >
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
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              {/* Messages Thread */}
              <Card className="flex flex-col h-[calc(100vh-280px)]">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <CardDescription>
                        {messages.length} message{messages.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowAdminPanel(true)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Demander intervention admin
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => navigate(`/disputes/create?orderId=${orderId}`)}
                          className="text-destructive"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Ouvrir un litige
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                                      {isAdmin ? 'Admin' : message.sender_type === 'store' ? 'Vendeur' : 'Client'}
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
                              <div className={`rounded-2xl px-4 py-3 ${getMessageBubbleClass(message)}`}>
                                {/* Text Content */}
                                {message.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                )}

                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map((attachment, idx) => (
                                      <div key={idx}>
                                        {attachment.file_type.startsWith('image/') ? (
                                          <img
                                            src={attachment.file_url}
                                            alt={attachment.file_name}
                                            className="rounded-lg max-w-full cursor-pointer hover:opacity-90"
                                            onClick={() => window.open(attachment.file_url, '_blank')}
                                          />
                                        ) : attachment.file_type.startsWith('video/') ? (
                                          <video
                                            src={attachment.file_url}
                                            controls
                                            className="rounded-lg max-w-full"
                                          />
                                        ) : (
                                          <a
                                            href={attachment.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded bg-background/10 hover:bg-background/20"
                                          >
                                            <File className="h-4 w-4" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium truncate">
                                                {attachment.file_name}
                                              </p>
                                              <p className="text-xs opacity-75">
                                                {formatFileSize(attachment.file_size)}
                                              </p>
                                            </div>
                                          </a>
                                        )}
                                      </div>
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
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
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
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendingMessage || uploadingFiles}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>

                      <Button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || uploadingFiles || (!messageContent.trim() && selectedFiles.length === 0)}
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
                            {currentConversation.order.total_amount.toLocaleString()} {currentConversation.order.currency}
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
                    Un administrateur sera notifié et pourra intervenir dans la conversation
                    pour vous aider à résoudre tout problème.
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

