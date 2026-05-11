/**
 * Page dédiée AI Chatbot
 * Accessible depuis la sidebar — remplace l'affichage en flotteur global.
 */

import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAIChatbot } from '@/hooks/useAIChatbot';
import { Sparkles } from 'lucide-react';

const AIChatbot = React.lazy(() => import('@/components/ai/AIChatbot'));

const AIChatbotPage: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    sessionId,
    toggleChatbot,
    minimizeChatbot,
    sendMessage,
  } = useAIChatbot();

  // Forcer l'ouverture sur la page dédiée
  React.useEffect(() => {
    if (!isOpen) toggleChatbot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Helmet>
        <title>Assistant IA — Emarzona</title>
        <meta
          name="description"
          content="Discutez avec l'assistant IA d'Emarzona pour obtenir de l'aide sur vos services, commandes et boutique."
        />
      </Helmet>

      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Assistant IA</h1>
          <p className="text-sm text-muted-foreground">
            Posez vos questions sur vos services, commandes ou la plateforme.
          </p>
        </div>
      </header>

      <div className="rounded-xl border bg-card shadow-sm min-h-[600px] relative">
        <Suspense
          fallback={
            <div className="flex h-[600px] items-center justify-center text-muted-foreground">
              Chargement de l'assistant…
            </div>
          }
        >
          <AIChatbot
            isOpen={true}
            onToggle={toggleChatbot}
            messages={messages}
            isTyping={isTyping}
            sessionId={sessionId}
            sendMessage={sendMessage}
            isMinimized={isMinimized}
            minimizeChatbot={minimizeChatbot}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default AIChatbotPage;
