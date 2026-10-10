/**
 * Admin — messages contact plateforme (répondre aux utilisateurs).
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2, RefreshCw, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  fetchAdminContactThreads,
  fetchContactMessages,
  markAdminThreadRead,
  sendAdminContactReply,
  type PlatformContactMessage,
  type PlatformContactThread,
} from '@/lib/support/platform-contact';
import { ContactChatMedia } from '@/components/support/ContactChatMedia';

export default function AdminContactMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [threads, setThreads] = useState<PlatformContactThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlatformContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminContactThreads();
      setThreads(data);
    } catch (err) {
      logger.error('Admin contact threads load failed', { error: err });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const selected = threads.find(t => t.id === selectedId) ?? null;

  const loadMessages = useCallback(
    async (threadId: string) => {
      setLoadingMessages(true);
      try {
        const msgs = await fetchContactMessages(threadId);
        setMessages(msgs);
        await markAdminThreadRead(threadId);
        setThreads(prev =>
          prev.map(t => (t.id === threadId ? { ...t, admin_unread_count: 0 } : t))
        );
      } catch (err) {
        logger.error('Admin contact messages load failed', { error: err });
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la conversation.',
          variant: 'destructive',
        });
      } finally {
        setLoadingMessages(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (selectedId) {
      void loadMessages(selectedId);
      setReply('');
    } else {
      setMessages([]);
    }
  }, [selectedId, loadMessages]);

  const handleReply = async () => {
    if (!user || !selectedId || !reply.trim()) return;
    setSending(true);
    try {
      await sendAdminContactReply({
        threadId: selectedId,
        adminUserId: user.id,
        content: reply.trim(),
      });
      setReply('');
      await loadMessages(selectedId);
      await loadThreads();
      toast({ title: 'Réponse envoyée' });
    } catch (err) {
      logger.error('Admin reply failed', { error: err });
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Envoi impossible',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const filtered = threads.filter(t => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      t.full_name.toLowerCase().includes(q) ||
      (t.last_message_preview || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Messages contact
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Messages des utilisateurs via le bouton chat — répondez ici.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadThreads()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:min-h-[28rem]">
        <Card
          className={cn(
            'lg:col-span-2 flex flex-col overflow-hidden',
            selectedId && 'hidden lg:flex'
          )}
        >
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <Input
              placeholder="Rechercher un nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">Aucun message pour le moment.</p>
            ) : (
              <ScrollArea className="h-[min(55vh,28rem)]">
                <ul className="divide-y">
                  {filtered.map(t => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={cn(
                          'w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors',
                          selectedId === t.id && 'bg-muted'
                        )}
                        onClick={() => setSelectedId(t.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              {t.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {t.last_message_preview || '—'}
                            </p>
                            {t.last_message_at && (
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(t.last_message_at), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </p>
                            )}
                          </div>
                          {t.admin_unread_count > 0 && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-500 shrink-0">
                              {t.admin_unread_count}
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card
          className={cn(
            'lg:col-span-3 flex flex-col overflow-hidden',
            !selectedId && 'hidden lg:flex'
          )}
        >
          <CardHeader className="pb-3 space-y-2">
            {selectedId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="lg:hidden w-fit -ml-2 h-8"
                onClick={() => setSelectedId(null)}
              >
                ← Conversations
              </Button>
            )}
            <CardTitle className="text-base">
              {selected ? selected.full_name : 'Sélectionnez une conversation'}
            </CardTitle>
            {selected && (
              <CardDescription>
                Créée le{' '}
                {format(new Date(selected.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                {' · '}
                statut {selected.status}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 min-h-0 p-4 pt-0">
            {!selected ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Choisissez un fil à gauche pour lire et répondre.
              </p>
            ) : (
              <>
                <ScrollArea className="flex-1 min-h-[12rem] max-h-[min(50vh,28rem)] rounded-lg border p-3">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map(msg => {
                        const isAdmin = msg.sender_type === 'admin';
                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex flex-col gap-0.5',
                              isAdmin ? 'items-end' : 'items-start'
                            )}
                          >
                            <div
                              className={cn(
                                'max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words',
                                isAdmin
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              )}
                            >
                              {msg.content?.trim() ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              ) : null}
                              <ContactChatMedia attachments={msg.attachments ?? []} />
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                              {isAdmin ? 'Vous (admin)' : selected.full_name} ·{' '}
                              {format(new Date(msg.created_at), 'dd/MM HH:mm')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                <div className="space-y-2 shrink-0">
                  <Textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => {
                      if (
                        e.key === 'Enter' &&
                        (e.ctrlKey || e.metaKey) &&
                        reply.trim() &&
                        !sending
                      ) {
                        e.preventDefault();
                        void handleReply();
                      }
                    }}
                    placeholder="Votre réponse… (Ctrl+Entrée pour envoyer)"
                    rows={3}
                    maxLength={5000}
                    disabled={sending}
                    className="resize-none"
                  />
                  <Button
                    type="button"
                    onClick={() => void handleReply()}
                    disabled={sending || !reply.trim()}
                    className="w-full sm:w-auto"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Répondre
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
