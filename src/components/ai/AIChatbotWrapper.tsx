/**
 * AI Chatbot Wrapper Component
 * Wrapper pour intégrer le chatbot IA dans l'application
 * Date: Janvier 2026
 */

import React, { Suspense } from 'react';
import { useAIChatbot } from '@/hooks/useAIChatbot';

// Lazy import du composant AIChatbot
const AIChatbot = React.lazy(() => import('./AIChatbot'));

export const AIChatbotWrapper: React.FC = () => {
  const {
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
  } = useAIChatbot();

  return (
    <Suspense fallback={null}>
      <AIChatbot
        isOpen={isOpen}
        onToggle={toggleChatbot}
        messages={messages}
        isTyping={isTyping}
        sessionId={sessionId}
        sendMessage={sendMessage}
        isMinimized={isMinimized}
        minimizeChatbot={minimizeChatbot}
      />
    </Suspense>
  );
};