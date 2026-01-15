import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIChatbot } from '../useAIChatbot';
import { supabase } from '@/integrations/supabase/client';
import * as securityUtils from '@/lib/security/securityUtils';
import { CHATBOT_RESPONSES } from '@/lib/ai/chatbotResponses';
import { logger } from '@/lib/logger';
import { AuthContext } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AIChatbot, ChatMessage, ChatSession, ChatbotResponse, IntentAnalysisResult, ChatSessionContext } from '@/lib/ai/chatbot';


// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: vi.fn(),
      maybeSingle: vi.fn(),
    })),
  },
}));

vi.mock('@/lib/ai/chatbot', () => ({
  AIChatbot: vi.fn(() => ({
    processMessage: vi.fn(),
    createNewSession: vi.fn(),
  })),
  // Exportez les types réels pour qu'ils soient disponibles pour les mocks
  ChatMessage: {} as ChatMessage, 
  ChatSession: {} as ChatSession,
  ChatbotResponse: {} as ChatbotResponse,
  IntentAnalysisResult: {} as IntentAnalysisResult,
  ChatSessionContext: {} as ChatSessionContext,
}));

vi.mock('@/lib/security/securityUtils', () => ({
  sanitizeString: vi.fn(input => input),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockSupabaseFrom = vi.mocked(supabase.from);
const mockChatbotProcessMessage = vi.mocked(AIChatbot.prototype.processMessage);
const mockChatbotCreateNewSession = vi.mocked(AIChatbot.prototype.createNewSession);
const mockSanitizeString = vi.mocked(securityUtils.sanitizeString);


const createWrapper = (user = { id: 'test-user' }) => {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, signOut: vi.fn() } as any}> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
};

describe('useAIChatbot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Reset mocks for chatbot instance
    mockChatbotProcessMessage.mockReset();
    mockChatbotCreateNewSession.mockReset();
    mockChatbotCreateNewSession.mockResolvedValue({ id: 'new-session-id', messages: [] } as ChatSession);
    mockChatbotProcessMessage.mockResolvedValue({ message: 'Mock response' } as ChatbotResponse);

    mockSupabaseFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: {}, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.isMinimized).toBe(true); // Should be true by default
    expect(result.current.messages).toEqual([]);
    expect(result.current.isTyping).toBe(false);
    expect(result.current.sessionId).toBeDefined();
  });

  it('should toggle chatbot open/closed state', () => {
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot();
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.isMinimized).toBe(false); // Should open un-minimized

    act(() => {
      result.current.toggleChatbot();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('should minimize/maximize chatbot state', () => {
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot(); // Open first
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.isMinimized).toBe(false);

    act(() => {
      result.current.minimizeChatbot();
    });
    expect(result.current.isMinimized).toBe(true);

    act(() => {
      result.current.minimizeChatbot();
    });
    expect(result.current.isMinimized).toBe(false);
  });

  it('should send a message and get a response', async () => {
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot(); // Open chatbot to enable message sending
    });

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    expect(mockSanitizeString).toHaveBeenCalledWith('Hello');
    expect(mockChatbotProcessMessage).toHaveBeenCalledWith(
      expect.any(String),
      'Hello',
      'test-user'
    );
    expect(result.current.messages).toHaveLength(2); // User message + AI response
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Mock response');
    expect(result.current.isTyping).toBe(false);
  });

  it('should show welcome message on first open', async () => {
    localStorageMock.setItem('emarzona_ai_chat_session_state', JSON.stringify({})); // Empty state
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot(); // Open chatbot
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe(CHATBOT_RESPONSES.WELCOME_MESSAGE);
    });
  });

  it('should not show welcome message on subsequent opens', async () => {
    localStorageMock.setItem('emarzona_ai_chat_session_state', JSON.stringify({
      sessionId: 'existing-session',
      messages: [{
        id: '1',
        content: 'Hi',
        role: 'user',
        timestamp: new Date().toISOString()
      }],
      context: {},
      metadata: {
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        platform: 'web',
        language: 'fr'
      }
    }));
    localStorageMock.setItem('emarzona_ai_chat_welcome_shown', 'true');

    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot();
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1); // Should load existing message, not add welcome
      expect(result.current.messages[0].content).toBe('Hi');
    });
  });

  it('should clear old local storage states', async () => {
    vi.useFakeTimers();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8); // 8 days ago
    localStorageMock.setItem('emarzona_ai_chat_session_state', JSON.stringify({
      sessionId: 'old-session',
      messages: [],
      context: {},
      metadata: {
        startedAt: oldDate.toISOString(),
        lastActivity: oldDate.toISOString(),
        platform: 'web',
        language: 'fr'
      }
    }));
    localStorageMock.setItem('emarzona_ai_chat_welcome_shown', 'true');

    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot(); // Trigger useEffect
    });
    
    vi.runAllTimers(); // Advance timers to trigger cleanup

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('emarzona_ai_chat_session_state');
      expect(result.current.sessionId).not.toBe('old-session'); // A new session should be created
    });
  });

  it('should clear messages', () => {
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot();
    });
    act(() => {
      result.current.sendMessage('Test message');
    });
    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it('should log error if message sending fails', async () => {
    mockChatbotProcessMessage.mockRejectedValueOnce(new Error('API Error'));
    const { result } = renderHook(() => useAIChatbot(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleChatbot();
    });

    await act(async () => {
      await result.current.sendMessage('Error message');
    });

    expect(logger.error).toHaveBeenCalledWith('Erreur lors de l\'envoi du message au chatbot', expect.any(Error));
    expect(result.current.messages[result.current.messages.length - 1].content).toContain(CHATBOT_RESPONSES.TECHNICAL_ERROR);
  });
});