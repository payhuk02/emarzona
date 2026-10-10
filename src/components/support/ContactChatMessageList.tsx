/**
 * Memoized thread list — avoids re-render on every keystroke in the composer.
 */
import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ContactChatMedia } from '@/components/support/ContactChatMedia';
import type { PlatformContactMessage } from '@/lib/support/platform-contact';

type ContactChatMessageListProps = {
  loading: boolean;
  messages: PlatformContactMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
};

export const ContactChatMessageList = memo(function ContactChatMessageList({
  loading,
  messages,
  bottomRef,
}: ContactChatMessageListProps) {
  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center py-6 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed px-0.5 py-1">
        Décrivez votre besoin. Joignez une image, une photo ou un vocal — la réponse apparaîtra ici.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map(msg => {
        const isUser = msg.sender_type === 'user';
        const hasText = Boolean(msg.content?.trim());
        return (
          <div
            key={msg.id}
            className={cn('flex flex-col gap-0.5', isUser ? 'items-end' : 'items-start')}
          >
            <div
              className={cn(
                'max-w-[88%] rounded-2xl px-3 py-2 text-sm break-words shadow-sm',
                isUser
                  ? 'text-white rounded-br-md'
                  : 'bg-white text-foreground border border-black/5 rounded-bl-md'
              )}
              style={
                isUser
                  ? {
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 55%, #2563eb 160%)',
                    }
                  : undefined
              }
            >
              {hasText && <p className="whitespace-pre-wrap">{msg.content}</p>}
              <ContactChatMedia
                attachments={msg.attachments ?? []}
                className={cn(hasText && 'mt-2')}
              />
            </div>
            <span className="text-[10px] text-muted-foreground px-1">
              {isUser ? 'Vous' : 'Support'} ·{' '}
              {formatDistanceToNow(new Date(msg.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
});
