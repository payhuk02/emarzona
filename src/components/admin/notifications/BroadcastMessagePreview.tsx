import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { wrapBroadcastEmailHtml } from '@/lib/admin/broadcast-email-templates';
import { resolveBroadcastBodies, type BroadcastEmailDesign } from '@/lib/admin/broadcast-html';
import type { BroadcastChannel, PopupStyle } from '@/lib/admin/admin-broadcast-service';
import { CHANNEL_OPTIONS } from '@/components/admin/notifications/broadcast-constants';
import { Mail, Megaphone, MessageSquare } from 'lucide-react';
import { SafeHTML } from '@/components/security/SafeHTML';

const RichTextEditorPro = lazy(() =>
  import('@/components/ui/rich-text-editor-pro').then(m => ({ default: m.RichTextEditorPro }))
);

interface BroadcastMessageEditorProps {
  messageHtml: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}

export function BroadcastMessageEditor({
  messageHtml,
  onChange,
  disabled,
}: BroadcastMessageEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 border rounded-lg bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RichTextEditorPro
        content={messageHtml}
        onChange={onChange}
        placeholder="Rédigez votre message avec mise en forme, images, liens..."
        disabled={disabled}
        maxHeight="420px"
        showWordCount
      />
    </Suspense>
  );
}

interface BroadcastMessagePreviewProps {
  title: string;
  message: string;
  messageHtml: string;
  emailDesign: BroadcastEmailDesign;
  channels: BroadcastChannel[];
  actionUrl?: string;
  actionLabel?: string;
  popupStyle?: PopupStyle;
  dismissible?: boolean;
  recipientCount?: number | null;
  recipientName?: string;
}

const POPUP_STYLES: Record<PopupStyle, string> = {
  info: 'border-blue-500 bg-blue-50/80',
  warning: 'border-amber-500 bg-amber-50/80',
  success: 'border-emerald-500 bg-emerald-50/80',
  announcement: 'border-violet-500 bg-violet-50/80',
};

export function BroadcastMessagePreview({
  title,
  message,
  messageHtml,
  emailDesign,
  channels,
  actionUrl,
  actionLabel,
  popupStyle = 'info',
  dismissible = true,
  recipientCount,
  recipientName = 'Utilisateur',
}: BroadcastMessagePreviewProps) {
  const { plain, html: bodyHtml } = resolveBroadcastBodies(message, messageHtml);
  const emailHtml = wrapBroadcastEmailHtml({
    title: title || 'Sans titre',
    bodyHtml,
    recipientName,
    actionUrl,
    actionLabel,
    design: emailDesign,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {channels.map(ch => (
          <Badge key={ch} variant="outline" className="gap-1">
            {ch === 'email' && <Mail className="h-3 w-3" />}
            {ch === 'in_app' && <MessageSquare className="h-3 w-3" />}
            {ch === 'popup' && <Megaphone className="h-3 w-3" />}
            {CHANNEL_OPTIONS.find(c => c.id === ch)?.label ?? ch}
          </Badge>
        ))}
        {typeof recipientCount === 'number' && (
          <Badge variant="secondary">{recipientCount} destinataire(s)</Badge>
        )}
        <Badge variant="secondary">Design : {emailDesign}</Badge>
      </div>

      <Tabs defaultValue={channels.includes('email') ? 'email' : 'in_app'} className="w-full">
        <TabsList className="flex-wrap h-auto w-full">
          {channels.includes('email') && (
            <TabsTrigger value="email" className="gap-1 min-h-[40px]">
              <Mail className="h-4 w-4" /> Email
            </TabsTrigger>
          )}
          {channels.includes('in_app') && (
            <TabsTrigger value="in_app" className="gap-1 min-h-[40px]">
              <MessageSquare className="h-4 w-4" /> Notification
            </TabsTrigger>
          )}
          {channels.includes('popup') && (
            <TabsTrigger value="popup" className="gap-1 min-h-[40px]">
              <Megaphone className="h-4 w-4" /> Popup
            </TabsTrigger>
          )}
        </TabsList>

        {channels.includes('email') && (
          <TabsContent value="email" className="mt-4">
            <div className="rounded-xl border overflow-hidden bg-muted/30 shadow-inner">
              <div className="px-4 py-2 border-b bg-background/80 text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-400" />
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                <span className="ml-2">Aperçu email — {emailDesign}</span>
              </div>
              <iframe
                title="Aperçu email"
                srcDoc={emailHtml}
                className="w-full min-h-[480px] bg-white border-0"
                sandbox=""
              />
            </div>
          </TabsContent>
        )}

        {channels.includes('in_app') && (
          <TabsContent value="in_app" className="mt-4">
            <div className="rounded-xl border bg-card p-4 shadow-sm max-w-md">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{title || 'Sans titre'}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-4">
                    {plain || 'Sans contenu'}
                  </p>
                  {actionUrl && actionLabel && (
                    <span className="inline-block mt-2 text-sm text-primary font-medium">
                      {actionLabel} →
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">À l&apos;instant · Emarzona</p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {channels.includes('popup') && (
          <TabsContent value="popup" className="mt-4">
            <div className="relative rounded-xl border bg-muted/20 p-8 min-h-[200px] flex items-center justify-center">
              <div
                className={cn(
                  'w-full max-w-md rounded-lg border-l-4 p-5 shadow-lg bg-background',
                  POPUP_STYLES[popupStyle]
                )}
              >
                <h3 className="font-bold text-lg mb-2">{title || 'Sans titre'}</h3>
                <SafeHTML
                  html={bodyHtml}
                  className="text-sm text-muted-foreground prose prose-sm max-w-none"
                />
                {actionUrl && actionLabel && (
                  <button type="button" className="mt-4 text-sm font-semibold text-primary">
                    {actionLabel}
                  </button>
                )}
                {dismissible && (
                  <p className="text-xs text-muted-foreground mt-3">
                    L&apos;utilisateur peut fermer cette popup
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
