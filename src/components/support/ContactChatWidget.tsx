/**
 * Floating contact chat — brand FAB, name placeholder, text + galerie / photo / vocal.
 * Layout: fixed panel height, scrollable thread, pinned composer (Envoyer always visible).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  ImagePlus,
  Camera,
  Mic,
  Square,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { shouldShowBottomNavigation } from '@/config/navigation.horizontal';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  detectContactMediaKind,
  fetchContactMessages,
  fetchMyContactThread,
  markUserRepliesRead,
  sendUserContactMessage,
  type PendingContactMedia,
  type PlatformContactMessage,
  type PlatformContactThread,
} from '@/lib/support/platform-contact';
import { ContactChatMedia } from '@/components/support/ContactChatMedia';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EMARZONA_DEFAULT_LOGO_PUBLIC } from '@/lib/brand/emarzona-logo';

const MAX_PENDING = 5;
const MAX_RECORD_SECS = 120;

function makePending(file: File): PendingContactMedia {
  const kind = detectContactMediaKind(file);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    kind,
    previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined,
  };
}

function revokePending(items: PendingContactMedia[]) {
  items.forEach(p => {
    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
  });
}

function pickRecorderMime(): { mimeType?: string; ext: string } {
  if (typeof MediaRecorder === 'undefined') return { ext: 'webm' };
  const candidates: Array<{ mimeType: string; ext: string }> = [
    { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
    { mimeType: 'audio/webm', ext: 'webm' },
    { mimeType: 'audio/mp4', ext: 'm4a' },
    { mimeType: 'audio/ogg;codecs=opus', ext: 'ogg' },
    { mimeType: 'audio/ogg', ext: 'ogg' },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { ext: 'webm' };
}

export function ContactChatWidget() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const isMobile = useIsMobile();
  const liftForBottomNav = isMobile && shouldShowBottomNavigation(location.pathname);
  const hideOnAdmin = location.pathname.startsWith('/admin');

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<PlatformContactThread | null>(null);
  const [messages, setMessages] = useState<PlatformContactMessage[]>([]);
  const [fullName, setFullName] = useState('');
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingContactMedia[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordExtRef = useRef('webm');
  const aliveRef = useRef(true);
  const nameTouchedRef = useRef(false);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const unread = thread?.user_unread_count ?? 0;

  const stopRecordingCleanup = useCallback((silent = false) => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      try {
        if (silent) recorder.ondataavailable = null;
        if (silent) recorder.onstop = null;
        recorder.stop();
      } catch {
        /* ignore */
      }
    }
    recordStreamRef.current?.getTracks().forEach(t => t.stop());
    recordStreamRef.current = null;
    setRecording(false);
    setRecordSecs(0);
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      revokePending(pendingRef.current);
      stopRecordingCleanup(true);
    };
  }, [stopRecordingCleanup]);

  useEffect(() => {
    if (!user) {
      setThread(null);
      setMessages([]);
      setFullName('');
      nameTouchedRef.current = false;
      setPending(prev => {
        revokePending(prev);
        return [];
      });
      setOpen(false);
      stopRecordingCleanup(true);
    }
  }, [user, stopRecordingCleanup]);

  const loadThread = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!user) return;
      const silent = opts?.silent === true;
      if (!silent) setLoading(true);
      try {
        const t = await fetchMyContactThread(user.id);
        if (!aliveRef.current) return;
        setThread(t);
        if (t) {
          const msgs = await fetchContactMessages(t.id);
          if (!aliveRef.current) return;
          setMessages(msgs);
          if (!nameTouchedRef.current && t.full_name?.trim()) {
            setFullName(t.full_name);
          }
        } else {
          setMessages([]);
        }
      } catch (err) {
        logger.error('Contact chat load failed', { error: err });
      } finally {
        if (aliveRef.current && !silent) setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user || hideOnAdmin) return;
    void loadThread();
  }, [user, hideOnAdmin, loadThread]);

  useEffect(() => {
    if (!open || !thread || !user) return;
    if (thread.user_unread_count <= 0) return;
    void markUserRepliesRead(thread.id)
      .then(() => loadThread({ silent: true }))
      .catch(err => logger.warn('mark replies read failed', { error: err }));
  }, [open, thread, user, loadThread]);

  useEffect(() => {
    if (!open) return;
    const el = messagesScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [open, messages.length, pending.length, sending]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cameraOpen) {
          setCameraOpen(false);
          return;
        }
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, cameraOpen]);

  useEffect(() => {
    if (!open && recording) stopRecordingCleanup(true);
  }, [open, recording, stopRecordingCleanup]);

  const addPendingFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setPending(prev => {
        const next = [...prev];
        let skipped = 0;
        for (const file of list) {
          if (next.length >= MAX_PENDING) {
            skipped += 1;
            continue;
          }
          if (file.size > 10 * 1024 * 1024) {
            skipped += 1;
            continue;
          }
          next.push(makePending(file));
        }
        if (skipped > 0) {
          queueMicrotask(() =>
            toast({
              title: 'Certaines pièces ignorées',
              description: `Max ${MAX_PENDING} fichiers / 10 Mo chacun.`,
              variant: 'destructive',
            })
          );
        }
        return next;
      });
    },
    [toast]
  );

  const removePending = (id: string) => {
    setPending(prev => {
      const target = prev.find(p => p.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  };

  const stopVoice = useCallback(() => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        recordStreamRef.current?.getTracks().forEach(t => t.stop());
      }
    } else {
      recordStreamRef.current?.getTracks().forEach(t => t.stop());
    }
    mediaRecorderRef.current = null;
    setRecording(false);
    setRecordSecs(0);
  }, []);

  const startVoice = async () => {
    if (recording) return;
    if (pending.length >= MAX_PENDING) {
      toast({
        title: 'Limite atteinte',
        description: `Maximum ${MAX_PENDING} pièces jointes.`,
        variant: 'destructive',
      });
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        throw new Error('Enregistrement vocal non supporté sur cet appareil');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!aliveRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      recordStreamRef.current = stream;
      const picked = pickRecorderMime();
      recordExtRef.current = picked.ext;
      const recorder = new MediaRecorder(
        stream,
        picked.mimeType ? { mimeType: picked.mimeType } : undefined
      );
      recordChunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        recordStreamRef.current = null;
        if (!aliveRef.current) return;
        const blob = new Blob(recordChunksRef.current, {
          type: (recorder.mimeType || 'audio/webm').split(';')[0],
        });
        if (blob.size < 800) {
          toast({
            title: 'Vocal trop court',
            description: 'Enregistrez un peu plus longtemps.',
            variant: 'destructive',
          });
          return;
        }
        const baseType = (blob.type || 'audio/webm').split(';')[0] || 'audio/webm';
        const ext = recordExtRef.current || 'webm';
        const file = new File([blob], `vocal-${Date.now()}.${ext}`, {
          type: baseType.startsWith('audio/') ? baseType : 'audio/webm',
        });
        addPendingFiles([file]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSecs(s => {
          const next = s + 1;
          if (next >= MAX_RECORD_SECS) {
            queueMicrotask(() => stopVoice());
            return MAX_RECORD_SECS;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      logger.error('Voice record failed', { error: err });
      toast({
        title: 'Micro inaccessible',
        description:
          err instanceof Error ? err.message : 'Autorisez le micro pour envoyer un vocal.',
        variant: 'destructive',
      });
      stopRecordingCleanup(true);
    }
  };

  const handleSend = async () => {
    if (!user || sending) return;
    const name = fullName.trim();
    const content = draft.trim();
    if (!name) {
      toast({
        title: 'Nom requis',
        description: 'Indiquez votre nom et prénom.',
        variant: 'destructive',
      });
      return;
    }
    if (!content && pending.length === 0) {
      toast({
        title: 'Message vide',
        description: 'Écrivez un message ou ajoutez une photo / un vocal.',
        variant: 'destructive',
      });
      return;
    }
    if (recording) stopVoice();

    setSending(true);
    try {
      await sendUserContactMessage({
        userId: user.id,
        fullName: name,
        content,
        media: pending,
      });
      setDraft('');
      setPending(prev => {
        revokePending(prev);
        return [];
      });
      await loadThread({ silent: true });
      toast({
        title: 'Message envoyé',
        description: 'Notre équipe vous répondra bientôt.',
      });
    } catch (err) {
      logger.error('Contact send failed', { error: err });
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : "Impossible d'envoyer le message",
        variant: 'destructive',
      });
    } finally {
      if (aliveRef.current) setSending(false);
    }
  };

  const panelTitle = useMemo(
    () => (messages.length > 0 ? 'Vos échanges' : 'Contactez-nous'),
    [messages.length]
  );

  const canSend = Boolean(fullName.trim() && (draft.trim() || pending.length > 0) && !sending);

  const panelHeightClass = liftForBottomNav
    ? 'h-[min(calc(100dvh-9.75rem),32rem)] max-h-[calc(100dvh-9.75rem)]'
    : 'h-[min(calc(100dvh-6.75rem),34rem)] max-h-[calc(100dvh-6.75rem)]';

  if (!user || hideOnAdmin) return null;

  return (
    <>
      <div
        className={cn(
          'fixed right-3 sm:right-6 z-[60] flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-none',
          'pb-[max(0.25rem,env(safe-area-inset-bottom))]',
          liftForBottomNav ? 'bottom-[5.25rem] sm:bottom-6' : 'bottom-5 sm:bottom-6'
        )}
      >
        {open && (
          <div
            className={cn(
              'pointer-events-auto w-[min(calc(100vw-1.25rem),23.5rem)]',
              panelHeightClass,
              'rounded-2xl overflow-hidden flex flex-col',
              'bg-background border border-black/5',
              'shadow-[0_18px_50px_-12px_rgba(15,23,42,0.35)]',
              'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Chat contact Emarzona"
          >
            <div
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-white shrink-0"
              style={{
                background: 'linear-gradient(115deg, #f97316 0%, #fb923c 38%, #2563eb 100%)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={EMARZONA_DEFAULT_LOGO_PUBLIC}
                  alt=""
                  className="h-8 w-8 rounded-lg object-contain bg-black/25 p-0.5 shrink-0 ring-1 ring-white/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{panelTitle}</p>
                  <p className="text-[11px] text-white/80 truncate">Support Emarzona</p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 text-white hover:bg-white/15 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Fermer le chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={messagesScrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#f8fafc] [-webkit-overflow-scrolling:touch]"
            >
              <div className="px-3 py-2.5">
                {loading && messages.length === 0 ? (
                  <div className="flex justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground leading-relaxed px-0.5 py-1">
                    Décrivez votre besoin. Joignez une image, une photo ou un vocal — la réponse
                    apparaîtra ici.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => {
                      const isUser = msg.sender_type === 'user';
                      const hasText = Boolean(msg.content?.trim());
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex flex-col gap-0.5',
                            isUser ? 'items-end' : 'items-start'
                          )}
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
                                    background:
                                      'linear-gradient(135deg, #f97316 0%, #ea580c 55%, #2563eb 160%)',
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
                )}
              </div>
            </div>

            <div className="border-t border-black/5 bg-white px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] space-y-2 shrink-0">
              <div className="space-y-1">
                <Label
                  htmlFor="contact-full-name"
                  className="text-xs font-medium text-foreground/80"
                >
                  Nom et prénom
                </Label>
                <Input
                  id="contact-full-name"
                  value={fullName}
                  onChange={e => {
                    nameTouchedRef.current = true;
                    setFullName(e.target.value);
                  }}
                  placeholder="Nom et Prénom"
                  maxLength={120}
                  disabled={sending}
                  autoComplete="name"
                  className="h-9 rounded-xl border-black/10"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="contact-message" className="text-xs font-medium text-foreground/80">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canSend) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Décrivez votre besoin..."
                  rows={2}
                  maxLength={5000}
                  disabled={sending}
                  className="min-h-[3.25rem] max-h-24 rounded-xl border-black/10 resize-none"
                />
              </div>

              {pending.length > 0 && (
                <ul className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                  {pending.map(p => (
                    <li
                      key={p.id}
                      className="relative rounded-xl border border-black/10 overflow-hidden bg-slate-50"
                    >
                      {p.kind === 'image' && p.previewUrl ? (
                        <img src={p.previewUrl} alt="" className="h-12 w-12 object-cover" />
                      ) : (
                        <div className="h-12 min-w-[6.5rem] px-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {p.kind === 'audio' ? (
                            <Mic className="h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
                          ) : (
                            <ImagePlus className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className="truncate max-w-[5rem]">{p.file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                        onClick={() => removePending(p.id)}
                        aria-label="Retirer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={sending || pending.length >= MAX_PENDING}
                  onClick={() => galleryRef.current?.click()}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-black/15 bg-white text-xs font-medium text-foreground/90 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Galerie
                </button>
                <button
                  type="button"
                  disabled={sending || pending.length >= MAX_PENDING}
                  onClick={() => setCameraOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-black/15 bg-white text-xs font-medium text-foreground/90 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Photo
                </button>
                <button
                  type="button"
                  disabled={sending || (!recording && pending.length >= MAX_PENDING)}
                  onClick={() => (recording ? stopVoice() : void startVoice())}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors disabled:opacity-50',
                    recording
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-black/15 bg-white text-foreground/90 hover:bg-slate-50'
                  )}
                >
                  {recording ? (
                    <>
                      <Square className="h-3.5 w-3.5 fill-current" />
                      Stop {recordSecs}s
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      Vocal
                    </>
                  )}
                </button>
              </div>

              <input
                ref={galleryRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files?.length) addPendingFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canSend}
                className={cn(
                  'w-full h-11 rounded-full text-sm font-semibold text-white',
                  'shadow-md transition-opacity disabled:opacity-45 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2 touch-manipulation'
                )}
                style={{
                  background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 42%, #c9a227 100%)',
                }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Envoyer
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className={cn(
            'pointer-events-auto relative h-12 w-12 sm:h-14 sm:w-14 rounded-full text-white',
            'shadow-[0_10px_28px_-6px_rgba(37,99,235,0.55),0_6px_16px_-8px_rgba(249,115,22,0.55)]',
            'ring-2 ring-white/90',
            'transition-transform duration-200 hover:scale-105 active:scale-95',
            'flex items-center justify-center touch-manipulation',
            open && 'scale-95'
          )}
          style={{
            background: 'linear-gradient(145deg, #f97316 0%, #fb923c 45%, #2563eb 100%)',
          }}
          onClick={() => setOpen(v => !v)}
          aria-label={
            unread > 0
              ? `Ouvrir le chat (${unread} réponse${unread > 1 ? 's' : ''})`
              : 'Ouvrir le chat'
          }
          aria-expanded={open}
        >
          {open ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.25} />
          )}
          {!open && unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[1.35rem] h-5 px-1 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white"
              aria-hidden
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={file => {
          addPendingFiles([file]);
          setCameraOpen(false);
        }}
        captureLabel="Utiliser cette photo"
      />
    </>
  );
}
