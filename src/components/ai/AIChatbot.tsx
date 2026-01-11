/**
 * AI Chatbot Component
 * Interface utilisateur pour le chatbot IA intelligent
 * Date: Janvier 2026
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import { aiChatbot, ChatMessage, ChatAction } from '@/lib/ai/chatbot';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface AIChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  isOpen,
  onToggle,
  className
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Messages d'accueil
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: "👋 Bonjour ! Je suis votre assistant IA. Je peux vous aider avec vos commandes, recommandations de produits, informations de livraison, et bien plus encore. Que puis-je faire pour vous ?",
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          suggestions: [
            "Où en est ma commande ?",
            "Quels produits recommandez-vous ?",
            "Informations de livraison"
          ]
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus sur l'input quand ouvert
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = useCallback(async (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || isTyping) return;

    setInputValue('');
    setIsTyping(true);

    try {
      // Ajouter le message utilisateur à l'interface
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: messageToSend,
        role: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Traiter avec le chatbot IA
      const response = await aiChatbot.processMessage(
        sessionId,
        messageToSend,
        user?.id
      );

      // Ajouter la réponse du chatbot
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          actions: response.actions,
          suggestions: response.suggestions
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message', { error, message: messageToSend });

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: "Désolé, je rencontre un problème technique. Veuillez réessayer ou contacter notre support.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, sessionId, user?.id]);

  const handleActionClick = useCallback(async (action: ChatAction) => {
    switch (action.type) {
      case 'quick_reply':
        await handleSendMessage(action.payload.message);
        break;
      case 'navigation':
        window.location.href = action.payload.path;
        break;
      case 'product_recommendation':
        window.location.href = `/product/${action.payload.productId}`;
        break;
      case 'order_status':
        window.location.href = '/orders';
        break;
      case 'support_ticket':
        // Implémentation future du système de tickets
        logger.info('Support ticket requested', { payload: action.payload });
        break;
      default:
        logger.warn('Unknown action type', { action });
    }
  }, [handleSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFeedback = useCallback((messageId: string, isPositive: boolean) => {
    logger.info('Chatbot feedback received', { messageId, isPositive, sessionId });
    // Ici on pourrait envoyer le feedback à une API pour améliorer le modèle
  }, [sessionId]);

  if (!isOpen) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={onToggle}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          aria-label="Ouvrir le chatbot IA"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card className={cn(
        "w-96 max-w-[calc(100vw-2rem)] shadow-2xl border-2 transition-all duration-200",
        isMinimized ? "h-14" : "h-[600px] max-h-[calc(100vh-2rem)]"
      )}>
        {/* Header */}
        <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/ai-avatar.png" alt="Assistant IA" />
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm font-medium">Assistant IA</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isTyping ? 'Tape en cours...' : 'En ligne'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                aria-label={isMinimized ? "Agrandir le chat" : "Réduire le chat"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                aria-label="Fermer le chatbot"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-96 px-4">
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "justify-end" : "justify-start"
                    )}>
                      {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-primary/10">
                            <Bot className="w-4 h-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2",
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {/* Actions du message */}
                        {message.metadata?.actions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.metadata.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleActionClick(action)}
                                className="text-xs h-6"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Suggestions */}
                        {message.metadata?.suggestions && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.metadata.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendMessage(suggestion)}
                                className="text-xs h-6 text-muted-foreground hover:text-foreground"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Feedback pour les messages assistant */}
                        {message.role === 'assistant' && (
                          <div className="flex gap-1 mt-2 opacity-60">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(message.id, true)}
                              className="h-5 w-5 p-0"
                              aria-label="Bonne réponse"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFeedback(message.id, false)}
                              className="h-5 w-5 p-0"
                              aria-label="Mauvaise réponse"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-secondary">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="w-4 h-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  aria-label="Envoyer le message"
                >
                  {isTyping ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Essayez "Où en est ma commande ?" ou "Recommandez-moi un produit"
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};