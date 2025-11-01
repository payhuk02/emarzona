import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  Image,
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
  Loader2,
  X
} from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { Message, MessageType, SenderType, Conversation } from "@/types/advanced-features";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface ConversationComponentProps {
  orderId: string;
  storeId: string;
  customerId?: string;
  className?: string;
}

// Cache pour les fonctions de formatage
const formatMessageTime = (timestamp: string) => {
  return formatDistanceToNow(new Date(timestamp), { 
    addSuffix: true, 
    locale: fr 
  });
};

// Composant pour un message individuel (optimisé avec memo)
interface MessageItemProps {
  message: Message;
}

const MessageItem = memo<MessageItemProps>(({ message }) => {
  const getSenderIcon = useCallback((senderType: SenderType) => {
    switch (senderType) {
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'store':
        return <Store className="h-4 w-4" />;
      case 'admin':
        return <Crown className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  }, []);

  const getSenderColor = useCallback((senderType: SenderType) => {
    switch (senderType) {
      case 'customer':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case 'store':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case 'admin':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    }
  }, []);

  const getMessageIcon = useCallback((messageType: MessageType) => {
    switch (messageType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'file':
        return <File className="h-4 w-4" />;
      default:
        return null;
    }
  }, []);

  const senderLabel = useMemo(() => {
    switch (message.sender_type) {
      case 'customer':
        return 'Client';
      case 'store':
        return 'Vendeur';
      case 'admin':
        return 'Admin';
      default:
        return 'Utilisateur';
    }
  }, [message.sender_type]);

  const isStoreMessage = message.sender_type === 'store';

  return (
    <div
      className={`flex gap-3 ${
        isStoreMessage ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isStoreMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar_url} loading="lazy" />
          <AvatarFallback className="text-xs">
            {getSenderIcon(message.sender_type)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] sm:max-w-[80%] rounded-lg p-3 ${
          isStoreMessage
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-xs ${getSenderColor(message.sender_type)}`}
          >
            {senderLabel}
          </Badge>
          {getMessageIcon(message.message_type)}
        </div>
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className="flex items-center gap-2 p-2 bg-background/50 rounded"
              >
                {attachment.file_type.startsWith('image/') ? (
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="max-w-32 max-h-32 rounded object-contain"
                    loading="lazy"
                  />
                ) : (
                  <>
                    <File className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs truncate">{attachment.file_name}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{formatMessageTime(message.created_at)}</span>
          {message.is_read ? (
            <CheckCheck className="h-3 w-3 flex-shrink-0" />
          ) : (
            <Check className="h-3 w-3 flex-shrink-0" />
          )}
        </div>
      </div>
      {isStoreMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar_url} loading="lazy" />
          <AvatarFallback className="text-xs">
            {getSenderIcon(message.sender_type)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

// Composant pour un élément de conversation (optimisé avec memo)
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const ConversationItem = memo<ConversationItemProps>(({ 
  conversation, 
  isActive, 
  onSelect 
}) => {
  const handleClick = useCallback(() => {
    onSelect(conversation.id);
  }, [conversation.id, onSelect]);

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isActive
          ? 'bg-primary/10 border-primary'
          : 'hover:bg-muted/50'
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                #{conversation.order?.order_number}
              </Badge>
              {conversation.admin_intervention && (
                <Shield className="h-3 w-3 text-purple-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm font-medium truncate">
              {conversation.store?.name || 'Boutique'}
            </p>
            {conversation.last_message && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {conversation.last_message.content || 'Fichier envoyé'}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            {conversation.last_message_at && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatMessageTime(conversation.last_message_at)}
              </span>
            )}
            {conversation.unread_count && conversation.unread_count > 0 && (
              <Badge 
                variant="destructive" 
                className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs min-w-[1.25rem]"
              >
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ConversationItem.displayName = 'ConversationItem';

// Composant principal optimisé
const ConversationComponent: React.FC<ConversationComponentProps> = ({
  orderId,
  storeId,
  customerId,
  className = ""
}) => {
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

  const [messageContent, setMessageContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Throttle pour le scroll automatique (optimisation)
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Auto-scroll vers le bas des messages (optimisé avec throttling)
  useEffect(() => {
    if (messages.length > 0) {
      // Délai minimal pour éviter trop de scrolls
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  // Créer une conversation si elle n'existe pas
  useEffect(() => {
    if (!loading && conversations.length === 0 && orderId && storeId) {
      createConversation(orderId, storeId, customerId);
    }
  }, [loading, conversations.length, orderId, storeId, customerId, createConversation]);

  // Ouvrir la première conversation par défaut
  useEffect(() => {
    if (!currentConversation && conversations.length > 0) {
      openConversation(conversations[0].id);
    }
  }, [currentConversation, conversations.length, openConversation]);

  // Marquer les messages comme lus quand on ouvre une conversation
  useEffect(() => {
    if (currentConversation?.id) {
      const markAsRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          markMessagesAsRead(currentConversation.id, user.id);
        }
      };
      markAsRead();
    }
  }, [currentConversation?.id, markMessagesAsRead]);

  const handleSendMessage = useCallback(async () => {
    if (!messageContent.trim() && selectedFiles.length === 0) return;
    if (!currentConversation) return;

    const messageType: MessageType = selectedFiles.length > 0 ? 'file' : 'text';
    
    const formData = {
      content: messageContent,
      message_type: messageType,
      attachments: selectedFiles,
    };

    await sendMessage(currentConversation.id, formData);
    
    setMessageContent("");
    setSelectedFiles([]);
    setShowFileDialog(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [messageContent, selectedFiles, currentConversation, sendMessage]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la taille maximale de 10MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [toast]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleOpenConversation = useCallback((id: string) => {
    openConversation(id);
  }, [openConversation]);

  const handleEnableAdminIntervention = useCallback(() => {
    if (currentConversation) {
      enableAdminIntervention(currentConversation.id);
    }
  }, [currentConversation, enableAdminIntervention]);

  const handleCloseConversation = useCallback(() => {
    if (currentConversation) {
      closeConversation(currentConversation.id);
    }
  }, [currentConversation, closeConversation]);

  // Mémoriser les conversations rendues pour éviter les re-renders
  const conversationItems = useMemo(() => {
    return conversations.map((conversation) => (
      <ConversationItem
        key={conversation.id}
        conversation={conversation}
        isActive={currentConversation?.id === conversation.id}
        onSelect={handleOpenConversation}
      />
    ));
  }, [conversations, currentConversation?.id, handleOpenConversation]);

  // Mémoriser les messages rendus
  const messageItems = useMemo(() => {
    return messages.map((message) => (
      <MessageItem key={message.id} message={message} />
    ));
  }, [messages]);

  // États de chargement
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Chargement des conversations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune conversation</h3>
            <p className="text-muted-foreground">
              Les conversations apparaîtront ici une fois qu'une commande sera créée
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row h-[600px] ${className}`}>
      {/* Liste des conversations - Responsive */}
      <div className="w-full md:w-1/3 border-r border-b md:border-b-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Conversations</h3>
        </div>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="p-2 space-y-2">
            {conversationItems}
          </div>
        </ScrollArea>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentConversation ? (
          <>
            {/* En-tête de conversation */}
            <div className="p-4 border-b flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">
                    Commande #{currentConversation.order?.order_number}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {currentConversation.store?.name}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {currentConversation.status}
                </Badge>
                {currentConversation.admin_intervention && (
                  <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!currentConversation.admin_intervention && (
                    <DropdownMenuItem onClick={handleEnableAdminIntervention}>
                      <Shield className="h-4 w-4 mr-2" />
                      Demander intervention admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleCloseConversation}
                    className="text-destructive"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Fermer la conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Aucun message pour le moment</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messageItems}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Zone de saisie */}
            <div className="p-4 border-t space-y-3">
              {selectedFiles.length > 0 && (
                <div className="p-2 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Fichiers sélectionnés:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles([])}
                      className="h-auto py-1"
                    >
                      Effacer tout
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <Badge 
                        key={`${file.name}-${index}`} 
                        variant="secondary" 
                        className="flex items-center gap-1 max-w-full"
                      >
                        <File className="h-3 w-3 flex-shrink-0" />
                        <span className="text-xs truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 flex-shrink-0"
                          onClick={() => removeFile(index)}
                          aria-label={`Retirer ${file.name}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={handleKeyDown}
                    disabled={sendingMessage}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={sendingMessage}
                        className="shrink-0"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter des fichiers</DialogTitle>
                        <DialogDescription>
                          Sélectionnez des images, vidéos ou documents à envoyer
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*,.pdf,.txt,.doc,.docx"
                          onChange={handleFileSelect}
                          className="cursor-pointer"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>Types autorisés: Images, vidéos, PDF, documents texte</p>
                          <p>Taille maximale: 10MB par fichier</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!messageContent.trim() && selectedFiles.length === 0)}
                    size="sm"
                    className="shrink-0"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sélectionnez une conversation</h3>
              <p className="text-muted-foreground">
                Choisissez une conversation dans la liste pour commencer à échanger
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ConversationComponent);
