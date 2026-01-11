/**
 * Hook pour gérer l'état du chatbot IA
 * Date: Janvier 2026
 */

import { useState, useCallback, useEffect } from 'react';
import { aiChatbot, ChatMessage, ChatSession } from '@/lib/ai/chatbot';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export interface UseAIChatbotReturn {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  sessionId: string;
  toggleChatbot: () => void;
  minimizeChatbot: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  markAsRead: () => void;
}

export function useAIChatbot(): UseAIChatbotReturn {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [unreadCount, setUnreadCount] = useState(0);

  // Restaurer l'état du chatbot depuis le localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('ai-chatbot-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setIsOpen(state.isOpen || false);
        setIsMinimized(state.isMinimized || false);
        setMessages(state.messages || []);
        setUnreadCount(state.unreadCount || 0);
      } catch (error) {
        logger.warn('Impossible de restaurer l\'état du chatbot', { error });
      }
    }
  }, []);

  // Sauvegarder l'état dans le localStorage
  useEffect(() => {
    const state = {
      isOpen,
      isMinimized,
      messages,
      unreadCount,
      lastUpdate: Date.now()
    };

    localStorage.setItem('ai-chatbot-state', JSON.stringify(state));
  }, [isOpen, isMinimized, messages, unreadCount]);

  // Auto-ouverture pour les nouveaux visiteurs
  useEffect(() => {
    const hasVisited = localStorage.getItem('ai-chatbot-visited');
    const timeSinceLastVisit = Date.now() - (parseInt(localStorage.getItem('ai-chatbot-last-visit') || '0'));

    // Ouvrir automatiquement après 30 secondes pour les nouveaux visiteurs
    if (!hasVisited && timeSinceLastVisit > 30000) {
      const timer = setTimeout(() => {
        if (!isOpen) {
          setIsOpen(true);
          localStorage.setItem('ai-chatbot-visited', 'true');
          localStorage.setItem('ai-chatbot-last-visit', Date.now().toString());
        }
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setIsMinimized(false);
      setUnreadCount(0);
    }
  }, [isOpen]);

  const minimizeChatbot = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setIsTyping(true);

    try {
      // Ajouter le message utilisateur
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: message,
        role: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Traiter avec le chatbot IA
      const response = await aiChatbot.processMessage(sessionId, message, user?.id);

      // Ajouter la réponse
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

      // Incrémenter le compteur non lu si minimisé ou fermé
      if (isMinimized || !isOpen) {
        setUnreadCount(prev => prev + 1);
      }

      // Logger l'interaction
      logger.info('Chatbot interaction', {
        sessionId,
        userId: user?.id,
        messageLength: message.length,
        hasActions: !!response.actions?.length
      });

    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message chatbot', { error, sessionId, message });

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        content: "Désolé, je rencontre un problème technique. Veuillez réessayer.",
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, user?.id, isMinimized, isOpen]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
    logger.info('Chatbot messages cleared', { sessionId });
  }, [sessionId]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Envoyer un message de bienvenue lors de la première ouverture
  useEffect(() => {
    if (isOpen && messages.length === 0) {
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

  return {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    sessionId,
    toggleChatbot,
    minimizeChatbot,
    sendMessage,
    clearMessages,
    markAsRead
  };
}