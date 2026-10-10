/**
 * Shared Galerie / Photo / Vocal controls + pending previews for contact chat.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, Camera, Mic, Square, Trash2 } from 'lucide-react';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { detectContactMediaKind, type PendingContactMedia } from '@/lib/support/platform-contact';
import { describeMediaPermissionError } from '@/lib/support/media-permission-error';

const MAX_PENDING = 5;
const MAX_RECORD_SECS = 120;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function makePending(file: File): PendingContactMedia {
  const kind = detectContactMediaKind(file);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    kind,
    previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined,
  };
}

export function revokeContactPending(items: PendingContactMedia[]) {
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

type ContactChatMediaControlsProps = {
  pending: PendingContactMedia[];
  onPendingChange: (
    next: PendingContactMedia[] | ((prev: PendingContactMedia[]) => PendingContactMedia[])
  ) => void;
  disabled?: boolean;
  className?: string;
};

export function ContactChatMediaControls({
  pending,
  onPendingChange,
  disabled = false,
  className,
}: ContactChatMediaControlsProps) {
  const { toast } = useToast();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);

  const galleryRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStreamRef = useRef<MediaStream | null>(null);
  const recordExtRef = useRef('webm');
  const aliveRef = useRef(true);

  const stopRecordingCleanup = useCallback((silent = false) => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      try {
        if (silent) {
          recorder.ondataavailable = null;
          recorder.onstop = null;
        }
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
      stopRecordingCleanup(true);
    };
  }, [stopRecordingCleanup]);

  const addPendingFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      onPendingChange(prev => {
        const next = [...prev];
        let skipped = 0;
        for (const file of list) {
          if (next.length >= MAX_PENDING) {
            skipped += 1;
            continue;
          }
          if (file.size > MAX_FILE_BYTES) {
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
    [onPendingChange, toast]
  );

  const removePending = (id: string) => {
    onPendingChange(prev => {
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
        description: describeMediaPermissionError(err, 'microphone'),
        variant: 'destructive',
      });
      stopRecordingCleanup(true);
    }
  };

  return (
    <>
      <div className={cn('space-y-2', className)}>
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
                  disabled={disabled}
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
            disabled={disabled || pending.length >= MAX_PENDING}
            onClick={() => galleryRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-black/15 bg-white text-xs font-medium text-foreground/90 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Galerie
          </button>
          <button
            type="button"
            disabled={disabled || pending.length >= MAX_PENDING}
            onClick={() => setCameraOpen(true)}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-black/15 bg-white text-xs font-medium text-foreground/90 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
            Photo
          </button>
          <button
            type="button"
            disabled={disabled || (!recording && pending.length >= MAX_PENDING)}
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
