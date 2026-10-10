/**
 * Renders platform contact message attachments (image / audio / file).
 * Audio: fetch signed URL as Blob + object URL so playback works when Storage
 * Content-Type / Range headers break native <audio src={signedUrl}>.
 */
import { useEffect, useState } from 'react';
import { FileIcon, ImageOff, Loader2 } from 'lucide-react';
import type { PlatformContactAttachment } from '@/lib/support/platform-contact';
import { cn } from '@/lib/utils';

function ContactAudioPlayer({
  signedUrl,
  fileName,
  fileType,
}: {
  signedUrl: string;
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
        const res = await fetch(signedUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const mime =
          (fileType && fileType.startsWith('audio/') ? fileType.split(';')[0] : null) ||
          res.headers.get('content-type')?.split(';')[0] ||
          (fileName.toLowerCase().endsWith('.wav')
            ? 'audio/wav'
            : fileName.toLowerCase().endsWith('.m4a')
              ? 'audio/mp4'
              : fileName.toLowerCase().endsWith('.ogg')
                ? 'audio/ogg'
                : 'audio/webm');
        const blob = new Blob([buf], { type: mime });
        const url = URL.createObjectURL(blob);
        revoked = url;
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setObjectUrl(url);
      } catch {
        if (!cancelled) {
          // Last resort: direct signed URL
          setObjectUrl(signedUrl);
          setFailed(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [signedUrl, fileName, fileType]);

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
          if (!att.signedUrl) {
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
