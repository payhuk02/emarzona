/**
 * Page dédiée AI Chatbot
 * Accessible depuis la sidebar — remplace l'affichage en flotteur global.
 */

import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAIChatbot } from '@/hooks/useAIChatbot';
import { Sparkles } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardShellLayout } from '@/components/layout/DashboardShellLayout';

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

  React.useEffect(() => {
    if (!isOpen) toggleChatbot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardShellLayout maxWidth="wide" className="max-w-5xl">
      <Helmet>
        <title>Assistant IA — Emarzona</title>
        <meta
          name="description"
          content="Discutez avec l'assistant IA d'Emarzona pour obtenir de l'aide sur vos services, commandes et boutique."
        />
      </Helmet>

      <header className="mb-6 flex items-start gap-3">
        <SidebarTrigger className="mt-1 shrink-0" />
        <div className="app-icon-plain flex shrink-0 items-center justify-center">
          <Sparkles className="h-7 w-7 text-black" aria-hidden />
        </div>
        <div>
          <h1 className="app-premium-page-title">Assistant IA</h1>
          <p className="app-text-caption mt-1 text-muted-foreground">
            Posez vos questions sur vos services, commandes ou la plateforme.
          </p>
        </div>
      </header>

      <div className="rounded-xl border bg-card shadow-sm min-h-[600px] relative">
        <Suspense
          fallback={
            <div className="flex h-[600px] items-center justify-center text-muted-foreground app-text-body">
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
    </DashboardShellLayout>
  );
};

export default AIChatbotPage;
