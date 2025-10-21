import React, { useState, useRef, useEffect } from 'react';
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
  Crown
} from "lucide-react";
import { useMessaging } from "@/hooks/useMessaging";
import { Message, MessageType, SenderType } from "@/types/advanced-features";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ConversationComponentProps {
  orderId: string;
  storeId: string;
  customerId?: string;
  className?: string;
}

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
  const { toast } = useToast();

  // Auto-scroll vers le bas des messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  }, [currentConversation, conversations, openConversation]);

  const handleSendMessage = async () => {
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
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getSenderIcon = (senderType: SenderType) => {
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
  };

  const getSenderColor = (senderType: SenderType) => {
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
  };

  const getMessageIcon = (messageType: MessageType) => {
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
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: fr 
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
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
    <div className={`flex h-[600px] ${className}`}>
      {/* Liste des conversations */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Conversations</h3>
        </div>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="p-2 space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-colors ${
                  currentConversation?.id === conversation.id
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => openConversation(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{conversation.order?.order_number}
                        </Badge>
                        {conversation.admin_intervention && (
                          <Shield className="h-3 w-3 text-purple-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {conversation.store?.name}
                      </p>
                      {conversation.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.last_message.content || 'Fichier envoyé'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conversation.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(conversation.last_message_at)}
                        </span>
                      )}
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* En-tête de conversation */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold">
                    Commande #{currentConversation.order?.order_number}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentConversation.store?.name}
                  </p>
                </div>
                <Badge variant="outline">
                  {currentConversation.status}
                </Badge>
                {currentConversation.admin_intervention && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!currentConversation.admin_intervention && (
                    <DropdownMenuItem onClick={() => enableAdminIntervention(currentConversation.id)}>
                      <Shield className="h-4 w-4 mr-2" />
                      Demander intervention admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => closeConversation(currentConversation.id)}
                    className="text-destructive"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Fermer la conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender_type === 'store' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.sender_type !== 'store' && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getSenderIcon(message.sender_type)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender_type === 'store'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getSenderColor(message.sender_type)}`}
                          >
                            {message.sender_type === 'customer' ? 'Client' :
                             message.sender_type === 'store' ? 'Vendeur' : 'Admin'}
                          </Badge>
                          {getMessageIcon(message.message_type)}
                        </div>
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                                {attachment.file_type.startsWith('image/') ? (
                                  <img
                                    src={attachment.file_url}
                                    alt={attachment.file_name}
                                    className="max-w-32 max-h-32 rounded"
                                  />
                                ) : (
                                  <>
                                    <File className="h-4 w-4" />
                                    <span className="text-xs">{attachment.file_name}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                          <Clock className="h-3 w-3" />
                          <span>{formatMessageTime(message.created_at)}</span>
                          {message.is_read ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      {message.sender_type === 'store' && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getSenderIcon(message.sender_type)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Zone de saisie */}
            <div className="p-4 border-t">
              {selectedFiles.length > 0 && (
                <div className="mb-3 p-2 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Fichiers sélectionnés:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles([])}
                    >
                      Effacer tout
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <File className="h-3 w-3" />
                        <span className="text-xs">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Tapez votre message..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
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
                  >
                    <Send className="h-4 w-4" />
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

export default ConversationComponent;
