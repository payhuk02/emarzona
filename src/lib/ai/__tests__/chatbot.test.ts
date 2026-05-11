import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIChatbot, ChatMessage, IntentAnalysisResult, ChatSessionContext } from '../chatbot'; // For explicit type casting
import { supabase } from '@/integrations/supabase/client';
import { recommendationService } from '../recommendationService';
import { logger } from '@/lib/logger';
import { CHATBOT_RESPONSES } from '@/lib/ai/chatbotResponses';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      upsert: vi.fn(),
      ilike: vi.fn().mockReturnThis(),
    })),
  },
}));

vi.mock('../recommendationService', () => ({
  recommendationService: {
    getRecommendations: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/security/securityUtils', () => ({
  sanitizeString: vi.fn(input => input), // Mock pour ne rien changer lors des tests unitaires
}));

const mockSupabaseFrom = vi.mocked(supabase.from);
const mockRecommendationServiceGetRecommendations = vi.mocked(recommendationService.getRecommendations);

describe('AIChatbot', () => {
  let chatbot: AIChatbot;
  let mockSession: { id: string; userId: string | undefined; messages: ChatMessage[]; context: ChatSessionContext; metadata: { startedAt: Date; lastActivity: Date; platform: string; language: string; }; };

  beforeEach(() => {
    vi.clearAllMocks();
    chatbot = new AIChatbot();
    mockSession = {
      id: 'test-session-id',
      userId: 'test-user-id',
      messages: [],
      context: {},
      metadata: {
        startedAt: new Date(),
        lastActivity: new Date(),
        platform: 'web',
        language: 'fr',
      },
    };
      // Mock internal sessions map
      (chatbot as { sessions: Map<string, any> }).sessions.set(mockSession.id, mockSession);
    });
    
  // Test for analyzeIntent
  describe('analyzeIntent', () => {
    it('should detect order_inquiry intent and extract order number', async () => {
      const message = 'où est ma commande #123456';
      const result = await (chatbot as { analyzeIntent: (message: string, context: ChatSessionContext) => Promise<IntentAnalysisResult> }).analyzeIntent(message, mockSession.context);
      expect(result.intent).toBe('order_inquiry');
      expect(result.entities.orderNumber).toBe('123456');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect shipping_inquiry intent and shipping aspect', async () => {
      const message = 'informations sur la livraison adresse';
      const result = await (chatbot as { analyzeIntent: (message: string, context: ChatSessionContext) => Promise<IntentAnalysisResult> }).analyzeIntent(message, mockSession.context);
      expect(result.intent).toBe('shipping_inquiry');
      expect(result.entities.shippingAspect).toBe('address');
    });

    it('should detect product_search intent and product query', async () => {
      const message = 'je cherche un logiciel de design';
      const result = await (chatbot as { analyzeIntent: (message: string, context: ChatSessionContext) => Promise<IntentAnalysisResult> }).analyzeIntent(message, mockSession.context);
      expect(result.intent).toBe('product_search');
      expect(result.entities.productQuery).toBe('un logiciel de design');
    });

    it('should return general intent for unrecognized messages', async () => {
      const message = 'bonjour comment allez-vous';
      const result = await (chatbot as { analyzeIntent: (message: string, context: ChatSessionContext) => Promise<IntentAnalysisResult> }).analyzeIntent(message, mockSession.context);
      expect(result.intent).toBe('general');
      expect(result.confidence).toBe(0.5);
    });

    it('should update session context with detected intent and entities', async () => {
      const message = 'où est ma commande #789012';
      await (chatbot as { analyzeIntent: (message: string, context: ChatSessionContext) => Promise<IntentAnalysisResult> }).analyzeIntent(message, mockSession.context);
      expect(mockSession.context.currentIntent).toBe('order_inquiry');
      expect(mockSession.context.orderNumber).toBe('789012');
    });
  });

  // Test for handleOrderInquiry
  describe('handleOrderInquiry', () => {
    it('should ask user to login if not authenticated', async () => {
      mockSession.userId = undefined;
      const response = await (chatbot as { handleOrderInquiry: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleOrderInquiry(mockSession);
      expect(response.message).toContain('connecté');
      expect(response.actions?.[0].type).toBe('navigation');
    });

    it('should return last order status if user is logged in and has orders', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [{ id: 'order-1', status: 'processing', created_at: new Date(), total_amount: 100, currency: 'EUR' }], error: null }),
      } as { select: () => { eq: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } } } });

      const response = await (chatbot as { handleOrderInquiry: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleOrderInquiry(mockSession);
      expect(response.message).toContain('en préparation');
      expect(response.actions?.[0].label).toContain('Voir ma commande');
    });

    it('should inform if no orders found', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      } as { select: () => { eq: () => { order: () => { limit: () => Promise<{ data: any[]; error: any }> } } } });

      const response = await (chatbot as { handleOrderInquiry: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleOrderInquiry(mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.ORDER_NOT_FOUND);
    });

    it('should handle errors during order fetching', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } }),
      } as { select: () => { eq: () => { order: () => { limit: () => Promise<{ data: any; error: { message: string } }> } } } });

      const response = await (chatbot as { handleOrderInquiry: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleOrderInquiry(mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.ORDER_FETCH_ERROR);
    });
  });

  // Test for handleProductSearch
  describe('handleProductSearch', () => {
    it('should ask for clarification if no search terms provided', async () => {
      const response = await (chatbot as { handleProductSearch: (userMessage: string, session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleProductSearch('', mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.PRODUCT_SEARCH_NO_QUERY);
      expect(response.suggestions).toEqual(CHATBOT_RESPONSES.PRODUCT_SEARCH_NO_QUERY_SUGGESTIONS);
    });

    it('should return products if found', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [{ id: 'p1', name: 'Produit Test 1', category: 'Digital' }], error: null }),
      } as { select: () => { ilike: () => { limit: () => Promise<{ data: any[]; error: any }> } } } );

      const response = await (chatbot as { handleProductSearch: (message: string, session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleProductSearch('test', mockSession);
      expect(response.message).toContain('J\'ai trouvé plusieurs produits');
      expect(response.actions).toHaveLength(1);
      expect(response.actions?.[0].label).toContain('Voir Produit Test 1');
    });

    it('should inform if no products found', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      } as { select: () => { ilike: () => { limit: () => Promise<{ data: any[]; error: any }> } } } );

      const response = await (chatbot as { handleProductSearch: (userMessage: string, session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleProductSearch('nonexistent', mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.PRODUCT_SEARCH_NOT_FOUND('nonexistent'));
    });

    it('should handle errors during product search', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } }),
      } as { select: () => { ilike: () => { limit: () => Promise<{ data: any; error: { message: string } }> } } } );

      const response = await (chatbot as { handleProductSearch: (userMessage: string, session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleProductSearch('error', mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.PRODUCT_SEARCH_ERROR);
    });
  });

  // Test for handleRecommendation
  describe('handleRecommendation', () => {
    it('should return recommendations from service', async () => {
      mockRecommendationServiceGetRecommendations.mockResolvedValueOnce([
        { id: 'rec1', name: 'Reco Produit 1', category: 'cat', type: 'digital', score: 0.9, reason: 'test' },
      ]);

      const response = await (chatbot as { handleRecommendation: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleRecommendation(mockSession);
      expect(response.message).toContain('Voici quelques-unes de nos meilleures recommendations : Reco Produit 1.');
      expect(response.actions).toHaveLength(1);
      expect(response.actions?.[0].label).toContain('Voir Reco Produit 1');
      expect(mockRecommendationServiceGetRecommendations).toHaveBeenCalledWith(mockSession.userId, mockSession.context, undefined);
    });

    it('should handle no recommendations found', async () => {
      mockRecommendationServiceGetRecommendations.mockResolvedValueOnce([]);

      const response = await (chatbot as { handleRecommendation: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleRecommendation(mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.RECOMMENDATION_NO_PRODUCTS);
      expect(response.actions?.[0].label).toBe(CHATBOT_RESPONSES.RECOMMENDATION_EXPLORE_ACTION_LABEL);
    });

    it('should handle errors during recommendation fetching', async () => {
      mockRecommendationServiceGetRecommendations.mockRejectedValueOnce(new Error('Reco Error'));

      const response = await (chatbot as { handleRecommendation: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleRecommendation(mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.RECOMMENDATION_ERROR);
      expect(logger.error).toHaveBeenCalledWith('Erreur lors des recommandations', expect.any(Object));
    });
  });

  // Test for handleShippingInquiry
  describe('handleShippingInquiry', () => {
    it('should return shipping information', async () => {
      const response = await (chatbot as { handleShippingInquiry: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleShippingInquiry(mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.SHIPPING_INFO);
      expect(response.actions).toHaveLength(1);
      expect(response.suggestions).toEqual(CHATBOT_RESPONSES.SHIPPING_SUGGESTIONS);
    });
  });

  // Test for handleReturnInquiry
  describe('handleReturnInquiry', () => {
    it('should return return policy information', async () => {
      const response = await (chatbot as { handleReturnInquiry: (session: typeof mockSession, context?: ChatSessionContext) => Promise<any> }).handleReturnInquiry(mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.RETURN_POLICY);
      expect(response.actions).toHaveLength(2);
      expect(response.actions?.[0].label).toBe(CHATBOT_RESPONSES.RETURN_POLICY_ACTION_LABEL);
    });
  });

  // Test for handleHelp
  describe('handleHelp', () => {
    it('should return general help message and suggestions', () => {
      const response = (chatbot as any).handleHelp(); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(response.message).toContain('Je peux vous aider avec');
      expect(response.suggestions).toHaveLength(3);
    });
  });

  // Test for handleGeneralInquiry
  describe('handleGeneralInquiry', () => {
    it('should return a greeting message for greetings', async () => {
      const response = await (chatbot as { handleGeneralInquiry: (userMessage: string, session: typeof mockSession) => Promise<any> }).handleGeneralInquiry('bonjour', mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.GENERAL_GREETING);
      expect(response.suggestions).toEqual(CHATBOT_RESPONSES.GENERAL_GREETING_SUGGESTIONS);
    });

    it('should return a thank you message for thanks', async () => {
      const response = await (chatbot as { handleGeneralInquiry: (userMessage: string, session: typeof mockSession) => Promise<any> }).handleGeneralInquiry('merci', mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.GENERAL_THANK_YOU);
    });

    it('should return a fallback message for unrecognized general inquiries', async () => {
      const response = await (chatbot as { handleGeneralInquiry: (userMessage: string, session: typeof mockSession) => Promise<any> }).handleGeneralInquiry('question obscure', mockSession);
      expect(response.message).toBe(CHATBOT_RESPONSES.GENERAL_FALLBACK);
      expect(response.suggestions).toEqual(CHATBOT_RESPONSES.GENERAL_FALLBACK_SUGGESTIONS);
    });
  });

  // Test for processMessage
  describe('processMessage', () => {
    it('should create new session if not exists', async () => {
      (chatbot as { sessions: Map<string, any> }).sessions.clear(); // Clear existing sessions // eslint-disable-line @typescript-eslint/no-explicit-any
      mockAiChatbotProcessMessage.mockResolvedValueOnce({ message: 'New session response' }); // eslint-disable-line @typescript-eslint/no-explicit-any

      const response = await chatbot.processMessage('new-session-id', 'Hello', 'user-new');
      expect(response.message).toBe('New session response');
      expect((chatbot as { sessions: Map<string, any> }).sessions.has('new-session-id')).toBe(true); // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('should add user and assistant messages to session history', async () => {
      await chatbot.processMessage(mockSession.id, 'User test message', mockSession.userId);

      expect(mockSession.messages).toHaveLength(2); // User message + assistant message
      expect(mockSession.messages[0].content).toBe('User test message');
      expect(mockSession.messages[1].role).toBe('assistant');
    });

    it('should call saveSession (debounced) if userId is provided', async () => {
      const spy = vi.spyOn(chatbot as { debouncedSaveSession: (session: any) => void }, 'debouncedSaveSession'); // eslint-disable-line @typescript-eslint/no-explicit-any
      await chatbot.processMessage(mockSession.id, 'Test', mockSession.userId);
      expect(spy).toHaveBeenCalledWith(mockSession);
    });

    it('should not call saveSession if userId is not provided', async () => {
      const spy = vi.spyOn(chatbot as any, 'debouncedSaveSession'); // eslint-disable-line @typescript-eslint/no-explicit-any
      await chatbot.processMessage(mockSession.id, 'Test', undefined);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should trim session history if it exceeds context window', async () => {
      (chatbot as { contextWindow: number }).contextWindow = 3; // Set a small context window for testing
      // Fill messages to exceed the context window
      for (let i = 0; i < 5; i++) {
        mockSession.messages.push({ id: `m${i}`, content: `msg${i}`, role: 'user', timestamp: new Date() });
      }

      await chatbot.processMessage(mockSession.id, 'New message', mockSession.userId);

      expect(mockSession.messages.length).toBeLessThanOrEqual((chatbot as { contextWindow: number }).contextWindow);
      expect(mockSession.messages.some(msg => msg.content === 'msg0')).toBe(false); // Oldest message should be trimmed
    });

    it('should handle processMessage errors and return a support ticket action', async () => {
      mockAiChatbotProcessMessage.mockRejectedValueOnce(new Error('Process Error')); // Simulate error in generateResponse // eslint-disable-line @typescript-eslint/no-explicit-any

      // Mock analyzeIntent to succeed so we can test the outer catch block
      vi.spyOn(chatbot as { analyzeIntent: (message: string, context: ChatSessionContext) => Promise<IntentAnalysisResult> }, 'analyzeIntent').mockResolvedValueOnce({
        intent: 'general', confidence: 0.5, entities: {},
      });

      const response = await chatbot.processMessage(mockSession.id, 'Error message', mockSession.userId);
      expect(response.message).toBe(CHATBOT_RESPONSES.TECHNICAL_ERROR);
      expect(response.actions?.[0].type).toBe('support_ticket');
      expect(response.actions?.[0].label).toBe('Créer un ticket support');
      expect(logger.error).toHaveBeenCalledWith('Erreur dans le traitement du message chatbot', expect.any(Object));
    });
  });

  // Test for _saveSession (directly, since debounced version is mocked)
  describe('_saveSession', () => {
    it('should upsert session to supabase', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValueOnce({ data: {}, error: null }),
      } as { upsert: () => Promise<{ data: any; error: any }> });

      await (chatbot as { _saveSession: (session: any) => Promise<void> })._saveSession(mockSession); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(mockSupabaseFrom).toHaveBeenCalledWith('chat_sessions');
      expect(mockSupabaseFrom().upsert).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-session-id',
        user_id: 'test-user-id',
        messages: [],
      }));
    });

    it('should log warning if save fails', async () => {
      mockSupabaseFrom.mockReturnValueOnce({
        upsert: vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Save Error' } }),
      } as { upsert: () => Promise<{ data: any; error: any }> });

      await (chatbot as any)._saveSession(mockSession); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(logger.warn).toHaveBeenCalledWith('Impossible de sauvegarder la session chat', expect.any(Object));
    });
  });
});
