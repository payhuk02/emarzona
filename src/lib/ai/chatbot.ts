/**
 * AI Chatbot Core Logic
 * Gère les sessions de chat, l'analyse d'intention, la génération de réponses et la persistance.
 * Date: Janvier 2026
 */

// Using crypto.randomUUID() instead of uuid package for better compatibility
const uuidv4 = () => crypto.randomUUID();
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sanitizeString } from '@/lib/security/securityUtils';
import { debounce } from '@/lib/utils';
import { CHATBOT_RESPONSES } from './chatbotResponses';
import { recommendationService } from './recommendationService';

// =============================================================================
// Interfaces & Types
// =============================================================================

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: {
    actions?: ChatAction[];
    suggestions?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    intent?: string;
    entities?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    feedback?: boolean; // true for thumbs up, false for thumbs down
  };
}

export interface ChatAction {
  label: string;
  type: 'quick_reply' | 'navigation' | 'product_recommendation' | 'order_status' | 'support_ticket';
  payload: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface IntentAnalysisResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface ChatSessionContext {
  currentIntent?: string;
  orderNumber?: string;
  productQuery?: string;
  shippingAspect?: string;
  returnReason?: string;
  lastOrder?: {
    productId: string;
  };
  browsingHistory?: string[]; // Array of product IDs or categories
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  context: ChatSessionContext;
  metadata: {
    startedAt: Date;
    lastActivity: Date;
    platform: string;
    language: string;
    // Add any other session-level metadata
  };
}

export interface ChatbotResponse {
  message: string;
  actions?: ChatAction[];
  suggestions?: string[];
  metadata?: ChatMessage['metadata'];
}

// =============================================================================
// AI Chatbot Class
// =============================================================================

export class AIChatbot {
  private sessions: Map<string, ChatSession> = new Map();
  private contextWindow = 10; // Number of messages to keep in context for intent analysis

  constructor() {
    this.debouncedSaveSession = debounce(this._saveSession.bind(this), 3000);
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Crée une nouvelle session de chat pour un utilisateur donné.
   * @param userId L'ID de l'utilisateur (peut être undefined pour les utilisateurs non connectés).
   * @returns La nouvelle session de chat.
   */
  public createNewSession(userId?: string): ChatSession {
    const sessionId = uuidv4();
    const newSession: ChatSession = {
      id: sessionId,
      userId,
      messages: [],
      context: {},
      metadata: {
        startedAt: new Date(),
        lastActivity: new Date(),
        platform: 'web', // Peut être dynamique
        language: 'fr', // Peut être dynamique
      },
    };
    this.sessions.set(sessionId, newSession);
    logger.info(`Nouvelle session créée: ${sessionId}`, { userId });
    return newSession;
  }

  /**
   * Traite un message utilisateur, génère une réponse et met à jour la session.
   * @param sessionId L'ID de la session.
   * @param userMessage Le message de l'utilisateur.
   * @param userId L'ID de l'utilisateur.
   * @returns La réponse du chatbot.
   */
  public async processMessage(
    sessionId: string,
    userMessage: string,
    userId?: string,
  ): Promise<ChatbotResponse> {
      let session = this.sessions.get(sessionId);

      if (!session) {
      logger.warn(`Session ${sessionId} non trouvée, création d'une nouvelle.`, { userId });
      session = this.createNewSession(userId);
    }

    // Mettre à jour le userId si la session existait sans et que l'utilisateur se connecte
    if (userId && !session.userId) {
      session.userId = userId;
    }

    const sanitizedMessage = sanitizeString(userMessage);

    const newUserMessage: ChatMessage = {
      id: uuidv4(),
      content: sanitizedMessage,
        role: 'user',
        timestamp: new Date(),
    };
    session.messages.push(newUserMessage);

    let assistantResponse: ChatbotResponse;

    try {
      const intentAnalysis = await this.analyzeIntent(sanitizedMessage, session.context);
      session.context.currentIntent = intentAnalysis.intent;
      session.context = { ...session.context, ...intentAnalysis.entities }; // Fusionner les entités dans le contexte
      newUserMessage.metadata = { ...newUserMessage.metadata, intent: intentAnalysis.intent, entities: intentAnalysis.entities };

      assistantResponse = await this.generateResponse(sanitizedMessage, session, intentAnalysis);
    } catch (error) {
      logger.error('Erreur dans le traitement du message chatbot', { sessionId, userId, error });
      assistantResponse = {
        message: CHATBOT_RESPONSES.TECHNICAL_ERROR,
        actions: [
          {
            label: CHATBOT_RESPONSES.CREATE_SUPPORT_TICKET_ACTION_LABEL,
            type: 'support_ticket',
            payload: { error: (error as Error).message, userMessage: sanitizedMessage },
          },
        ],
      };
    }

    const newAssistantMessage: ChatMessage = {
      id: uuidv4(),
      content: assistantResponse.message,
        role: 'assistant',
        timestamp: new Date(),
        metadata: {
        actions: assistantResponse.actions,
        suggestions: assistantResponse.suggestions,
        ...assistantResponse.metadata,
      },
    };
    session.messages.push(newAssistantMessage);

      this.trimSessionHistory(session);

    session.metadata.lastActivity = new Date();
    if (session.userId) {
      this.debouncedSaveSession(session);
    }

    return assistantResponse;
  }

  // ===========================================================================
  // Private Core Logic Methods
  // ===========================================================================

  /**
   * Analyse l'intention du message utilisateur.
   * @param message Le message utilisateur.
   * @param context Le contexte actuel de la session.
   * @returns Un objet IntentAnalysisResult.
   */
  private async analyzeIntent(message: string, context: ChatSessionContext): Promise<IntentAnalysisResult> {
    const lowerMessage = message.toLowerCase();
    let intent = 'general';
    let confidence = 0.5;
    const entities: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Détection d'intention pour les commandes
    const orderMatch = lowerMessage.match(/(commande|suivi|où est).*?#?(\d{6,})/);
    if (orderMatch) {
      intent = 'order_inquiry';
      entities.orderNumber = orderMatch[2];
      confidence = 0.9;
    } else if (lowerMessage.includes('commande') || lowerMessage.includes('mes commandes')) {
      intent = 'order_inquiry';
      confidence = 0.7;
    }

    // Détection d'intention pour la livraison
    if (lowerMessage.includes('livraison') || lowerMessage.includes('expedition')) {
      intent = 'shipping_inquiry';
      if (lowerMessage.includes('adresse')) entities.shippingAspect = 'address';
      if (lowerMessage.includes('délais')) entities.shippingAspect = 'time';
      confidence = Math.max(confidence, 0.8);
    }

    // Détection d'intention pour les retours
    if (lowerMessage.includes('retour') || lowerMessage.includes('remboursement')) {
      intent = 'return_inquiry';
      confidence = Math.max(confidence, 0.8);
    }

    // Détection d'intention pour la recherche de produits
    if (lowerMessage.includes('produit') || lowerMessage.includes('cherche') || lowerMessage.includes('trouver')) {
      intent = 'product_search';
      const productQueryMatch = lowerMessage.match(/(produit|cherche|trouver)\s+(un|une|des|le|la|les)?\s*(.*)/);
      if (productQueryMatch?.[3]) {
        entities.productQuery = productQueryMatch[3].trim();
      } else {
        entities.productQuery = message; // Utiliser le message entier si pas de match spécifique
      }
      confidence = Math.max(confidence, 0.85);
    }

    // Détection d'intention pour les recommandations
    if (lowerMessage.includes('recommande') || lowerMessage.includes('suggere')) {
      intent = 'recommendation_inquiry';
      confidence = Math.max(confidence, 0.9);
    }

    // Détection d'intention d'aide
    if (lowerMessage.includes('aide') || lowerMessage.includes('help') || lowerMessage.includes('comment faire')) {
      intent = 'help';
      confidence = Math.max(confidence, 0.7);
    }

    // Si aucune intention forte, utiliser l'intention du contexte précédent si pertinent
    if (confidence < 0.7 && context.currentIntent) {
      // Potentiellement ajuster la confiance ou changer d'intention si le nouveau message est très différent
    }

    logger.debug('Intent Analysis Result', { message, intent, confidence, entities });
    return { intent, confidence, entities };
  }

  /**
   * Génère une réponse du chatbot basée sur l'intention analysée.
   * @param userMessage Le message original de l'utilisateur.
   * @param session La session de chat actuelle.
   * @param intentAnalysis Le résultat de l'analyse d'intention.
   * @returns La réponse générée.
   */
  private async generateResponse(
    userMessage: string,
    session: ChatSession,
    intentAnalysis: IntentAnalysisResult,
  ): Promise<ChatbotResponse> {
    const { intent, entities } = intentAnalysis;

    // Dispatch vers les handlers spécifiques
    switch (intent) {
      case 'order_inquiry':
        return this.handleOrderInquiry(session, session.context);
      case 'shipping_inquiry':
        return this.handleShippingInquiry(session, session.context);
      case 'return_inquiry':
        return this.handleReturnInquiry(session, session.context);
      case 'product_search':
        return this.handleProductSearch(userMessage, session, session.context);
      case 'recommendation_inquiry':
        return this.handleRecommendation(session, session.context);
      case 'help':
        return this.handleHelp();
      case 'general':
      default:
        return this.handleGeneralInquiry(userMessage, session);
    }
  }

  /**
   * Gère les demandes d'informations sur les commandes.
   * @param session La session de chat.
   * @param _context Le contexte de la session.
   * @returns Une réponse du chatbot.
   */
  private async handleOrderInquiry(session: ChatSession, _context?: ChatSessionContext): Promise<ChatbotResponse> {
    if (!session.userId) {
      return {
        message: CHATBOT_RESPONSES.ORDER_NOT_LOGGED_IN,
        actions: [{
          label: CHATBOT_RESPONSES.ORDER_NOT_LOGGED_IN_ACTION_LABEL,
          type: 'navigation',
          payload: {
            path: '/login'
          }
        }],
      };
    }

    const { data: orders, error } = await supabase
        .from('orders')
      .select('*')
      .eq('user_id', session.userId)
      .order('created_at', {
        ascending: false
      })
      .limit(1);

    if (error) {
      logger.error('Erreur lors de la récupération des commandes', {
        userId: session.userId,
        error
      });
        return {
        message: CHATBOT_RESPONSES.ORDER_FETCH_ERROR
      };
    }

    if (!orders || orders.length === 0) {
      return {
        message: CHATBOT_RESPONSES.ORDER_NOT_FOUND,
        actions: [{
          label: CHATBOT_RESPONSES.ORDER_NOT_FOUND_ACTION_LABEL,
          type: 'navigation',
          payload: {
            path: '/marketplace'
          }
        }],
      };
    }

    const lastOrder = orders[0];
    const orderStatusMessage = CHATBOT_RESPONSES.ORDER_LAST_STATUS(lastOrder.id, lastOrder.status);

    return {
      message: orderStatusMessage,
      actions: [{
        label: CHATBOT_RESPONSES.ORDER_VIEW_ACTION_LABEL,
        type: 'navigation',
        payload: {
          path: `/orders/${lastOrder.id}`
        }
      }, {
        label: CHATBOT_RESPONSES.ORDER_ALL_ACTION_LABEL,
        type: 'navigation',
        payload: {
          path: '/orders'
        }
      }],
      metadata: {
        lastOrder: {
          productId: lastOrder.id
        }
      }, // Supposons que nous voulons recommander basé sur la dernière commande
    };
  }

  /**
   * Gère les demandes d'informations sur la livraison.
   * @param _session La session de chat.
   * @param _context Le contexte de la session.
   * @returns Une réponse du chatbot.
   */
  private async handleShippingInquiry(_session: ChatSession, _context?: ChatSessionContext): Promise<ChatbotResponse> {
    return {
      message: CHATBOT_RESPONSES.SHIPPING_INFO,
      actions: [{
        label: CHATBOT_RESPONSES.SHIPPING_ACTION_LABEL,
        type: 'navigation',
        payload: {
          path: '/shipping-policy'
        }
      }],
      suggestions: CHATBOT_RESPONSES.SHIPPING_SUGGESTIONS,
    };
  }

  /**
   * Gère les demandes d'informations sur les retours.
   * @param _session La session de chat.
   * @param _context Le contexte de la session.
   * @returns Une réponse du chatbot.
   */
  private async handleReturnInquiry(_session: ChatSession, _context?: ChatSessionContext): Promise<ChatbotResponse> {
    return {
      message: CHATBOT_RESPONSES.RETURN_POLICY,
      actions: [{
        label: CHATBOT_RESPONSES.RETURN_POLICY_ACTION_LABEL,
        type: 'navigation',
        payload: {
          path: '/return-policy'
        }
      }, {
        label: CHATBOT_RESPONSES.RETURN_INITIATE_ACTION_LABEL,
        type: 'navigation',
        payload: {
          path: '/returns/initiate'
        }
      }],
    };
  }

  /**
   * Gère les demandes de recherche de produits.
   * @param userMessage Le message de l'utilisateur.
   * @param session La session de chat.
   * @param _context Le contexte de la session.
   * @returns Une réponse du chatbot.
   */
  private async handleProductSearch(userMessage: string, session: ChatSession, _context?: ChatSessionContext): Promise<ChatbotResponse> {
    const productQuery = session.context.productQuery || userMessage;

    if (!productQuery) {
      return {
        message: CHATBOT_RESPONSES.PRODUCT_SEARCH_NO_QUERY,
        suggestions: CHATBOT_RESPONSES.PRODUCT_SEARCH_NO_QUERY_SUGGESTIONS,
      };
    }

    const { data: products, error } = await supabase
        .from('products')
        .select('id, name, category')
      .ilike('name', `%${productQuery}%`)
        .limit(3);

    if (error) {
      logger.error('Erreur lors de la recherche de produits', {
        productQuery,
        error
      });
      return {
        message: CHATBOT_RESPONSES.PRODUCT_SEARCH_ERROR
      };
    }

    if (!products || products.length === 0) {
      return {
        message: CHATBOT_RESPONSES.PRODUCT_SEARCH_NOT_FOUND(productQuery),
        actions: [{
          label: CHATBOT_RESPONSES.PRODUCT_SEARCH_ALL_CATEGORIES_ACTION_LABEL,
          type: 'navigation',
          payload: {
            path: '/marketplace'
          }
        }],
      };
    }

    const productList = products.map(p => p.name).join(', ');
    return {
      message: CHATBOT_RESPONSES.PRODUCT_SEARCH_FOUND(productList),
      actions: products.map(p => ({
        label: CHATBOT_RESPONSES.PRODUCT_SEARCH_VIEW_ACTION_LABEL(p.name),
        type: 'product_recommendation',
        payload: {
          productId: p.id
        },
      })),
    };
  }

  /**
   * Gère les demandes de recommandations de produits.
   * @param session La session de chat.
   * @param _context Le contexte de la session.
   * @returns Une réponse du chatbot.
   */
  private async handleRecommendation(session: ChatSession, _context?: ChatSessionContext): Promise<ChatbotResponse> {
    try {
      const recommendations = await recommendationService.getRecommendations(
        session.userId,
        session.context,
        5 // Limite de 5 recommandations
      );

      if (!recommendations || recommendations.length === 0) {
        return {
          message: CHATBOT_RESPONSES.RECOMMENDATION_NO_PRODUCTS,
          actions: [{
            label: CHATBOT_RESPONSES.RECOMMENDATION_EXPLORE_ACTION_LABEL,
            type: 'navigation',
            payload: {
              path: '/marketplace'
            }
          }],
        };
      }

      const recommendationList = recommendations.map(r => r.name).join(', ');
      return {
        message: `${CHATBOT_RESPONSES.RECOMMENDATION_FOUND} ${recommendationList}.`,
        actions: recommendations.map(r => ({
          label: CHATBOT_RESPONSES.RECOMMENDATION_VIEW_ACTION_LABEL(r.name),
          type: 'product_recommendation',
          payload: {
            productId: r.id
          },
        })),
      };
    } catch (error) {
      logger.error('Erreur lors des recommandations', {
        userId: session.userId,
        error
      });
      return {
        message: CHATBOT_RESPONSES.RECOMMENDATION_ERROR,
        actions: [{
          label: CHATBOT_RESPONSES.RECOMMENDATION_EXPLORE_ACTION_LABEL,
          type: 'navigation',
          payload: {
            path: '/marketplace'
          }
        }],
      };
    }
  }

  /**
   * Gère les demandes d'aide générale.
   * @returns Une réponse du chatbot.
   */
  private handleHelp(): ChatbotResponse {
    return {
      message: CHATBOT_RESPONSES.HELP_MESSAGE,
      suggestions: CHATBOT_RESPONSES.HELP_SUGGESTIONS,
    };
  }

  /**
   * Gère les demandes générales ou non reconnues.
   * @param userMessage Le message de l'utilisateur.
   * @param _session La session de chat.
   * @returns Une réponse du chatbot.
   */
  private async handleGeneralInquiry(userMessage: string, _session: ChatSession): Promise<ChatbotResponse> {
    const lowerMessage = userMessage.toLowerCase();

    if (['bonjour', 'salut', 'hello'].some(greeting => lowerMessage.includes(greeting))) {
      return {
        message: CHATBOT_RESPONSES.GENERAL_GREETING,
        suggestions: CHATBOT_RESPONSES.GENERAL_GREETING_SUGGESTIONS,
      };
    }

    if (['merci', 'thank you'].some(thanks => lowerMessage.includes(thanks))) {
      return {
        message: CHATBOT_RESPONSES.GENERAL_THANK_YOU,
      };
    }

    return {
      message: CHATBOT_RESPONSES.GENERAL_FALLBACK,
      suggestions: CHATBOT_RESPONSES.GENERAL_FALLBACK_SUGGESTIONS,
    };
  }

  /**
   * Réduit l'historique des messages de la session pour ne conserver que les plus récents.
   * Priorise les messages importants (ex: avec entités, actions).
   * @param session La session de chat.
   */
  private trimSessionHistory(session: ChatSession): void {
    if (session.messages.length <= this.contextWindow) {
      return;
    }

    // Garder les N derniers messages
      session.messages = session.messages.slice(-this.contextWindow);

    logger.debug('Session history trimmed', {
      sessionId: session.id,
      newLength: session.messages.length
    });
  }

  /**
   * Sauvegarde la session de chat dans Supabase.
   * @param session La session de chat à sauvegarder.
   */
  private async _saveSession(session: ChatSession): Promise<void> {
    try {
      const { error } = await supabase.from('chat_sessions').upsert({
        id: session.id,
        user_id: session.userId,
        messages: session.messages,
        context: session.context,
        metadata: session.metadata,
      },
      {
        onConflict: 'id'
      });

      if (error) {
        logger.warn('Impossible de sauvegarder la session chat', {
          sessionId: session.id,
          error
        });
      } else {
        logger.debug('Session chat sauvegardée', {
          sessionId: session.id
        });
      }
    } catch (error) {
      logger.error('Erreur inattendue lors de la sauvegarde de la session', {
        sessionId: session.id,
        error
      });
    }
  }

  private debouncedSaveSession: (session: ChatSession) => void;
}