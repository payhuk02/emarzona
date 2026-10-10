/**
 * Renders platform contact message attachments (image / audio / file).
 * Audio: authenticated Storage download → Blob/object URL (signed URL fetch often
 * fails on mobile due to CORS / Content-Type / Range). Re-encode to WAV when needed.
 */
import { useEffect, useState } from 'react';
import { FileIcon, ImageOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ATTACHMENTS_BUCKET } from '@/lib/attachments/storage-ref';
import { convertAudioBlobToWav } from '@/lib/support/audio-wav';
import type { PlatformContactAttachment } from '@/lib/support/platform-contact';
import { cn } from '@/lib/utils';

function guessAudioMime(fileName: string, fileType?: string): string {
  const fromType = fileType?.startsWith('audio/') ? fileType.split(';')[0] : null;
  if (fromType) return fromType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  return 'audio/webm';
}

async function loadAudioBlob(
  storagePath: string,
  signedUrl: string | null | undefined,
  fileName: string,
  fileType?: string
): Promise<Blob> {
  const mime = guessAudioMime(fileName, fileType);

  // 1) Authenticated download (best: session + RLS, no CORS on raw GET)
  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).download(storagePath);
  if (!error && data && data.size > 0) {
    return data.type && data.type.startsWith('audio/')
      ? data
      : new Blob([await data.arrayBuffer()], { type: mime });
  }

  // 2) Signed URL fetch fallback
  if (signedUrl) {
    const res = await fetch(signedUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error('empty audio');
    const headerMime = res.headers.get('content-type')?.split(';')[0];
    return new Blob([buf], {
      type: headerMime?.startsWith('audio/') ? headerMime : mime,
    });
  }

  throw error ?? new Error('audio download failed');
}

function ContactAudioPlayer({
  storagePath,
  signedUrl,
  fileName,
  fileType,
}: {
  storagePath: string;
  signedUrl?: string | null;
  fileName: string;
  fileType?: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    const run = async () => {
      setFailed(false);
      setObjectUrl(null);
      try {
        const raw = await loadAudioBlob(storagePath, signedUrl, fileName, fileType);
        if (cancelled) return;

        // Prefer universal WAV for <audio> (esp. iOS + older WebM notes)
        let playable: Blob = raw;
        const alreadyWav = raw.type.includes('wav') || fileName.toLowerCase().endsWith('.wav');
        if (!alreadyWav) {
          const wav = await convertAudioBlobToWav(raw);
          if (wav && wav.size > 44) playable = wav;
        } else if (!raw.type || raw.type === 'application/octet-stream') {
          playable = new Blob([await raw.arrayBuffer()], { type: 'audio/wav' });
        }

        if (cancelled) return;
        const url = URL.createObjectURL(playable);
        revoked = url;
        setObjectUrl(url);
      } catch {
        if (!cancelled) {
          if (signedUrl) {
            setObjectUrl(signedUrl);
          } else {
            setFailed(true);
          }
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [storagePath, signedUrl, fileName, fileType]);

  if (failed && !objectUrl) {
    return (
      <p className="text-[10px] text-destructive px-1 py-1">Lecture impossible · {fileName}</p>
    );
  }

  if (!objectUrl) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        Chargement du vocal…
      </div>
    );
  }

  return (
    <>
      <audio
        key={objectUrl}
        controls
        preload="auto"
        playsInline
        controlsList="nodownload"
        className="w-full max-w-full h-9"
        src={objectUrl}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <p className="text-[10px] text-destructive mt-1 px-1">Lecture impossible</p>
      ) : (
        <p className="text-[10px] text-muted-foreground mt-1 truncate px-1">{fileName}</p>
      )}
    </>
  );
}

export function ContactChatMedia({
  attachments,
  className,
}: {
  attachments: PlatformContactAttachment[];
  className?: string;
}) {
  if (!attachments?.length) return null;

  return (
    <div className={cn('mt-2 space-y-2 w-full min-w-0', className)}>
      {attachments.map(att => {
        if (att.kind === 'image') {
          if (!att.signedUrl) {
            return (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-xl border bg-background/40 px-3 py-2 text-xs text-muted-foreground"
              >
                <ImageOff className="h-4 w-4 shrink-0" />
                <span className="truncate">{att.file_name}</span>
              </div>
            );
          }
          return (
            <a
              key={att.id}
              href={att.signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-xl border bg-background/40 max-w-full"
            >
              <img
                src={att.signedUrl}
                alt={att.file_name}
                className="max-h-40 sm:max-h-48 w-full object-cover"
                loading="lazy"
              />
            </a>
          );
        }

        if (att.kind === 'audio') {
          if (!att.storage_path && !att.signedUrl) {
            return (
              <div
                key={att.id}
                className="rounded-xl border bg-background/50 px-3 py-2 text-xs text-muted-foreground"
              >
                Vocal indisponible · {att.file_name}
              </div>
            );
          }
          return (
            <div key={att.id} className="rounded-xl border bg-background/50 px-2 py-2 max-w-full">
              <ContactAudioPlayer
                storagePath={att.storage_path}
                signedUrl={att.signedUrl}
                fileName={att.file_name}
                fileType={att.file_type}
              />
            </div>
          );
        }

        return (
          <a
            key={att.id}
            href={att.signedUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-2 rounded-xl border bg-background/50 px-3 py-2 text-xs max-w-full',
              !att.signedUrl && 'pointer-events-none opacity-70'
            )}
          >
            <FileIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{att.file_name}</span>
          </a>
        );
      })}
    </div>
  );
}
