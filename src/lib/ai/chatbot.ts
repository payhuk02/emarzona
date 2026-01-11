/**
 * AI Chatbot System
 * Chatbot intelligent pour support client et recommandations
 * Date: Janvier 2026
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    actions?: ChatAction[];
    context?: Record<string, any>;
  };
}

export interface ChatAction {
  type: 'product_recommendation' | 'order_status' | 'support_ticket' | 'navigation' | 'quick_reply';
  payload: any;
  label: string;
  description?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  context: {
    currentIntent?: string;
    userProfile?: any;
    browsingHistory?: any[];
    cartItems?: any[];
    lastOrder?: any;
    preferences?: Record<string, any>;
  };
  metadata: {
    startedAt: Date;
    lastActivity: Date;
    platform: 'web' | 'mobile';
    language: string;
    satisfaction?: number;
  };
}

export interface ChatbotResponse {
  message: string;
  actions?: ChatAction[];
  context?: Record<string, any>;
  suggestions?: string[];
  followUp?: boolean;
}

/**
 * Moteur principal du chatbot IA
 */
export class AIChatbot {
  private sessions: Map<string, ChatSession> = new Map();
  private readonly maxContextLength = 10;
  private readonly contextWindow = 20; // Derniers messages gardés en mémoire

  /**
   * Traite un message utilisateur et génère une réponse
   */
  async processMessage(
    sessionId: string,
    userMessage: string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<ChatbotResponse> {
    try {
      // Récupérer ou créer la session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = this.createNewSession(sessionId, userId);
        this.sessions.set(sessionId, session);
      }

      // Analyser l'intention du message
      const intent = await this.analyzeIntent(userMessage, session.context);

      // Ajouter le message utilisateur à la session
      const userChatMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        content: userMessage,
        role: 'user',
        timestamp: new Date(),
        metadata: {
          intent: intent.intent,
          confidence: intent.confidence
        }
      };

      session.messages.push(userChatMessage);
      session.metadata.lastActivity = new Date();

      // Générer la réponse
      const response = await this.generateResponse(userMessage, session, intent, context);

      // Ajouter la réponse à la session
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
          actions: response.actions,
          context: response.context
        }
      };

      session.messages.push(assistantMessage);

      // Nettoyer l'historique si trop long
      this.trimSessionHistory(session);

      // Sauvegarder la session en base si utilisateur connecté
      if (userId) {
        await this.saveSession(session);
      }

      return response;

    } catch (error) {
      logger.error('Erreur dans le traitement du message chatbot', { error, sessionId, userMessage });
      return {
        message: "Désolé, je rencontre un problème technique. Un conseiller va prendre le relais.",
        actions: [{
          type: 'support_ticket',
          payload: { message: userMessage, error: String(error) },
          label: 'Créer un ticket support'
        }]
      };
    }
  }

  /**
   * Analyse l'intention du message utilisateur
   */
  private async analyzeIntent(
    message: string,
    sessionContext: any
  ): Promise<{ intent: string; confidence: number; entities: Record<string, any> }> {
    // Analyse basique des mots-clés (à remplacer par un vrai NLP plus tard)
    const lowerMessage = message.toLowerCase();

    // Intentions de support
    if (lowerMessage.includes('commande') || lowerMessage.includes('order') || lowerMessage.includes('achat')) {
      return { intent: 'order_inquiry', confidence: 0.9, entities: {} };
    }

    if (lowerMessage.includes('livraison') || lowerMessage.includes('delivery') || lowerMessage.includes('expédition')) {
      return { intent: 'shipping_inquiry', confidence: 0.9, entities: {} };
    }

    if (lowerMessage.includes('retour') || lowerMessage.includes('return') || lowerMessage.includes('remboursement')) {
      return { intent: 'return_inquiry', confidence: 0.9, entities: {} };
    }

    if (lowerMessage.includes('produit') || lowerMessage.includes('product') || lowerMessage.includes('chercher')) {
      return { intent: 'product_search', confidence: 0.8, entities: {} };
    }

    if (lowerMessage.includes('recommandation') || lowerMessage.includes('suggérer') || lowerMessage.includes('conseil')) {
      return { intent: 'recommendation', confidence: 0.8, entities: {} };
    }

    if (lowerMessage.includes('aide') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return { intent: 'help', confidence: 0.7, entities: {} };
    }

    // Intention par défaut
    return { intent: 'general', confidence: 0.5, entities: {} };
  }

  /**
   * Génère une réponse intelligente basée sur l'intention et le contexte
   */
  private async generateResponse(
    userMessage: string,
    session: ChatSession,
    intent: any,
    context?: Record<string, any>
  ): Promise<ChatbotResponse> {

    switch (intent.intent) {
      case 'order_inquiry':
        return await this.handleOrderInquiry(session, context);

      case 'shipping_inquiry':
        return await this.handleShippingInquiry(session, context);

      case 'return_inquiry':
        return await this.handleReturnInquiry(session, context);

      case 'product_search':
        return await this.handleProductSearch(userMessage, session, context);

      case 'recommendation':
        return await this.handleRecommendation(session, context);

      case 'help':
        return this.handleHelp();

      default:
        return this.handleGeneralInquiry(userMessage, session);
    }
  }

  /**
   * Gestion des demandes liées aux commandes
   */
  private async handleOrderInquiry(session: ChatSession, context?: Record<string, any>): Promise<ChatbotResponse> {
    if (!session.userId) {
      return {
        message: "Pour voir vos commandes, vous devez être connecté. Souhaitez-vous vous connecter ?",
        actions: [{
          type: 'navigation',
          payload: { path: '/auth' },
          label: 'Se connecter'
        }]
      };
    }

    try {
      // Récupérer les dernières commandes de l'utilisateur
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, created_at, total_amount, currency')
        .eq('customer_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!orders || orders.length === 0) {
        return {
          message: "Je ne trouve pas de commandes à votre nom. Avez-vous déjà passé commande sur notre plateforme ?",
          actions: [{
            type: 'navigation',
            payload: { path: '/marketplace' },
            label: 'Découvrir nos produits'
          }]
        };
      }

      const lastOrder = orders[0];
      const statusText = this.getOrderStatusText(lastOrder.status);

      return {
        message: `Votre dernière commande (${lastOrder.id.slice(-8)}) est ${statusText}. Souhaitez-vous voir tous vos détails de commande ?`,
        actions: [{
          type: 'navigation',
          payload: { path: `/orders/${lastOrder.id}` },
          label: 'Voir ma commande'
        }, {
          type: 'quick_reply',
          payload: { message: 'Voir toutes mes commandes' },
          label: 'Voir toutes les commandes'
        }]
      };

    } catch (error) {
      logger.error('Erreur lors de la récupération des commandes', { error, userId: session.userId });
      return {
        message: "Je rencontre un problème pour accéder à vos commandes. Puis-je vous aider autrement ?"
      };
    }
  }

  /**
   * Gestion des demandes de livraison
   */
  private async handleShippingInquiry(session: ChatSession, context?: Record<string, any>): Promise<ChatbotResponse> {
    return {
      message: "Pour les informations de livraison, nous travaillons avec plusieurs transporteurs : Chronopost, Colissimo, UPS, FedEx et DHL. Les délais varient selon votre région.",
      actions: [{
        type: 'navigation',
        payload: { path: '/shipping' },
        label: 'Voir les options de livraison'
      }],
      suggestions: [
        "Quels sont les délais pour [votre région] ?",
        "Puis-je changer l'adresse de livraison ?",
        "Comment suivre ma commande ?"
      ]
    };
  }

  /**
   * Gestion des demandes de retour
   */
  private async handleReturnInquiry(session: ChatSession, context?: Record<string, any>): Promise<ChatbotResponse> {
    return {
      message: "Notre politique de retour vous permet de retourner vos produits dans les 30 jours. Les frais de retour sont offerts pour les produits défectueux.",
      actions: [{
        type: 'navigation',
        payload: { path: '/returns' },
        label: 'Voir la politique de retour'
      }, {
        type: 'quick_reply',
        payload: { message: 'Je veux faire un retour' },
        label: 'Initier un retour'
      }]
    };
  }

  /**
   * Gestion de la recherche de produits
   */
  private async handleProductSearch(userMessage: string, session: ChatSession, context?: Record<string, any>): Promise<ChatbotResponse> {
    // Extraction basique de termes de recherche (à améliorer avec NLP)
    const searchTerms = userMessage.toLowerCase()
      .replace(/chercher|trouver|besoin|veut/g, '')
      .trim();

    if (!searchTerms) {
      return {
        message: "Que recherchez-vous exactement ? Je peux vous aider à trouver des produits digitaux, physiques, des cours ou des services.",
        suggestions: [
          "Un logiciel de design",
          "Des cours de programmation",
          "Des produits artisanaux"
        ]
      };
    }

    try {
      // Recherche de produits
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category')
        .ilike('name', `%${searchTerms}%`)
        .limit(3);

      if (!products || products.length === 0) {
        return {
          message: `Je n'ai pas trouvé de produits correspondant à "${searchTerms}". Essayez avec d'autres termes ou parcourez nos catégories.`,
          actions: [{
            type: 'navigation',
            payload: { path: '/marketplace' },
            label: 'Voir toutes les catégories'
          }]
        };
      }

      const productList = products.map(p => p.name).join(', ');

      return {
        message: `J'ai trouvé plusieurs produits correspondant à votre recherche : ${productList}. Voulez-vous que je vous montre plus de détails ?`,
        actions: products.slice(0, 2).map(product => ({
          type: 'navigation' as const,
          payload: { path: `/product/${product.id}` },
          label: `Voir ${product.name}`
        }))
      };

    } catch (error) {
      logger.error('Erreur lors de la recherche de produits', { error, searchTerms });
      return {
        message: "Je rencontre un problème avec la recherche. Essayez de naviguer directement dans notre marketplace."
      };
    }
  }

  /**
   * Gestion des recommandations
   */
  private async handleRecommendation(session: ChatSession, context?: Record<string, any>): Promise<ChatbotResponse> {
    try {
      // Recommandations basées sur l'historique ou populaires
      const { data: popularProducts } = await supabase
        .from('products')
        .select('id, name')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!popularProducts || popularProducts.length === 0) {
        return {
          message: "Découvrez nos produits phares ! Nous avons des articles digitaux, physiques, des cours et des services.",
          actions: [{
            type: 'navigation',
            payload: { path: '/marketplace' },
            label: 'Explorer le marketplace'
          }]
        };
      }

      return {
        message: "Voici quelques-unes de nos meilleures recommendations :",
        actions: popularProducts.map(product => ({
          type: 'product_recommendation' as const,
          payload: { productId: product.id },
          label: `Voir ${product.name}`
        }))
      };

    } catch (error) {
      logger.error('Erreur lors des recommandations', { error });
      return {
        message: "Découvrez nos produits populaires dans notre marketplace !"
      };
    }
  }

  /**
   * Gestion de l'aide générale
   */
  private handleHelp(): ChatbotResponse {
    return {
      message: "Je peux vous aider avec : vos commandes, la livraison, les retours, la recherche de produits, et des recommandations personnalisées. Que souhaitez-vous savoir ?",
      suggestions: [
        "Où en est ma commande ?",
        "Comment retourner un produit ?",
        "Quels produits recommandez-vous ?"
      ]
    };
  }

  /**
   * Gestion des demandes générales
   */
  private handleGeneralInquiry(userMessage: string, session: ChatSession): Promise<ChatbotResponse> {
    // Analyse des mots-clés pour des réponses plus intelligentes
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
      return Promise.resolve({
        message: "Bonjour ! Je suis ravi de vous aider. Comment puis-je vous assister aujourd'hui ?",
        suggestions: [
          "Je cherche un produit",
          "Aide avec ma commande",
          "Informations de livraison"
        ]
      });
    }

    if (lowerMessage.includes('merci') || lowerMessage.includes('thank')) {
      return Promise.resolve({
        message: "De rien ! N'hésitez pas si vous avez d'autres questions. Bonne journée ! 👋"
      });
    }

    return Promise.resolve({
      message: "Je comprends votre demande. Pouvez-vous me donner plus de détails pour que je puisse mieux vous aider ?",
      suggestions: [
        "Expliquez votre problème",
        "Contactez le support",
        "Retournez au menu principal"
      ]
    });
  }

  /**
   * Utilitaires
   */
  private createNewSession(sessionId: string, userId?: string): ChatSession {
    return {
      id: sessionId,
      userId,
      messages: [],
      context: {},
      metadata: {
        startedAt: new Date(),
        lastActivity: new Date(),
        platform: 'web',
        language: 'fr'
      }
    };
  }

  private trimSessionHistory(session: ChatSession) {
    // Garder seulement les derniers messages
    if (session.messages.length > this.contextWindow) {
      session.messages = session.messages.slice(-this.contextWindow);
    }
  }

  private async saveSession(session: ChatSession) {
    try {
      // Sauvegarder la session en base (implémentation simplifiée)
      await supabase.from('chat_sessions').upsert({
        id: session.id,
        user_id: session.userId,
        messages: session.messages,
        context: session.context,
        metadata: session.metadata,
        updated_at: new Date()
      });
    } catch (error) {
      logger.warn('Impossible de sauvegarder la session chat', { error, sessionId: session.id });
    }
  }

  private getOrderStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'en attente',
      'confirmed': 'confirmée',
      'processing': 'en préparation',
      'shipped': 'expédiée',
      'delivered': 'livrée',
      'cancelled': 'annulée',
      'refunded': 'remboursée'
    };
    return statusMap[status] || status;
  }
}

// Instance singleton du chatbot
export const aiChatbot = new AIChatbot();