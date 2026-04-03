import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { AIChatbot } from '../AIChatbot';

// Mocks
vi.mock('@/hooks/useAIChatbot', () => ({
  useAIChatbot: vi.fn()
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1'
    }
  })
}));

const mockUseAIChatbot = vi.mocked(useAIChatbot);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      },
      mutations: {
        retry: false
      }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AIChatbot', () => {
  const defaultMock = {
    isOpen: true,
    isMinimized: false,
    messages: [{
      id: 'welcome',
      content: 'Bonjour ! Comment puis-je vous aider ?',
      role: 'assistant',
      timestamp: new Date(),
      metadata: {
        suggestions: ['Aide commande', 'Support']
      }
    }],
    isTyping: false,
    sessionId: 'test-session',
    toggleChatbot: vi.fn(),
    minimizeChatbot: vi.fn(),
    sendMessage: vi.fn(),
    clearMessages: vi.fn(),
    markAsRead: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAIChatbot.mockReturnValue(defaultMock);
  });

  describe('Rendering', () => {
    it('renders chatbot button when closed', () => {
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        isOpen: false
      });

      const mockToggle = vi.fn(); // Define mockToggle here
      render(<AIChatbot isOpen={false} onToggle={mockToggle} messages={defaultMock.messages} isTyping={defaultMock.isTyping} sessionId={defaultMock.sessionId} sendMessage={defaultMock.sendMessage} isMinimized={defaultMock.isMinimized} minimizeChatbot={defaultMock.minimizeChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByRole('button', {
        name: /ouvrir le chatbot/i
      })).toBeInTheDocument();
    });

    it('renders full chatbot interface when open', () => {
      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByText('Assistant IA')).toBeInTheDocument();
      expect(screen.getByText('Bonjour ! Comment puis-je vous aider ?')).toBeInTheDocument();
    });

    it('shows welcome message with suggestions', () => {
      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByText('Aide commande')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls toggleChatbot when button is clicked', async () => {
      const user = userEvent.setup();
      const mockToggle = vi.fn();
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        toggleChatbot: mockToggle,
        isOpen: false
      });
      render(<AIChatbot {...defaultMock
      } isOpen={false} onToggle={mockToggle} />,
      {
        wrapper: createWrapper()
      });

      const button = screen.getByRole('button', {
        name: /ouvrir le chatbot/i
      });
      await user.click(button);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('closes chatbot when X button is clicked', async () => {
      const user = userEvent.setup();
      const mockToggle = vi.fn();

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      const closeButton = screen.getByRole('button', {
        name: /fermer le chatbot/i
      });
      await user.click(closeButton);

      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it('minimizes/maximizes chatbot when header is clicked', async () => {
      const user = userEvent.setup();
      const mockMinimize = vi.fn();
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        minimizeChatbot: mockMinimize
      });

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      const header = screen.getByText('Assistant IA').closest('div');
      await user.click(header!);

      expect(mockMinimize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        sendMessage: mockSend
      });

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Bonjour');

      const sendButton = screen.getByRole('button', {
        name: /envoyer/i
      });
      await user.click(sendButton);

      expect(mockSend).toHaveBeenCalledWith('Bonjour');
    });

    it('sends message when Enter is pressed', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        sendMessage: mockSend
      });

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      const input = screen.getByPlaceholderText(/tapez votre message/i);
      await user.type(input, 'Test message{enter}');

      expect(mockSend).toHaveBeenCalledWith('Test message');
    });

    it('shows typing indicator when sending message', async () => {
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        isTyping: true
      });

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByText('Tape en cours...')).toBeInTheDocument();
    });
  });

  describe('Suggestions', () => {
    it('clicks on suggestion sends message', async () => {
      const user = userEvent.setup();
      const mockSend = vi.fn();
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        sendMessage: mockSend
      });

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      const suggestion = screen.getByText('Aide commande');
      await user.click(suggestion);

      expect(mockSend).toHaveBeenCalledWith('Aide commande');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByRole('button', {
        name: /fermer le chatbot/i
      })).toBeInTheDocument();
      expect(screen.getByRole('button', {
        name: /envoyer/i
      })).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByRole('heading', {
        name: 'Assistant IA'
      })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const _user = userEvent.setup(); // Renamed to _user
      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      const input = screen.getByPlaceholderText(/tapez votre message/i);

      // Focus should go to input when opened
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Minimization', () => {
    it('shows minimized view when isMinimized is true', () => {
      mockUseAIChatbot.mockReturnValue({
        ...defaultMock,
        isMinimized: true
      });

      render(<AIChatbot {...defaultMock
      } onToggle={defaultMock.toggleChatbot} />,
      {
        wrapper: createWrapper()
      });

      expect(screen.getByText('Assistant IA')).toBeInTheDocument();
      // Messages should not be visible in minimized state
      expect(screen.queryByText('Bonjour ! Comment puis-je vous aider ?')).not.toBeInTheDocument();
    });
  });
});