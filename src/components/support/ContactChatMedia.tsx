/**
 * Renders platform contact message attachments (image / audio / file).
 */
import { useCallback, type SyntheticEvent } from 'react';
import { FileIcon, ImageOff } from 'lucide-react';
import type { PlatformContactAttachment } from '@/lib/support/platform-contact';
import { cn } from '@/lib/utils';

/** Chrome often reports Infinity/NaN for MediaRecorder WebM until we force a seek. */
function recoverAudioDuration(e: SyntheticEvent<HTMLAudioElement>) {
  const audio = e.currentTarget;
  if (Number.isFinite(audio.duration) && audio.duration > 0) return;
  const onTimeUpdate = () => {
    audio.removeEventListener('timeupdate', onTimeUpdate);
    audio.currentTime = 0;
  };
  audio.addEventListener('timeupdate', onTimeUpdate);
  try {
    audio.currentTime = 1e101;
  } catch {
    /* ignore */
  }
}

export function ContactChatMedia({
  attachments,
  className,
}: {
  attachments: PlatformContactAttachment[];
  className?: string;
}) {
  const onAudioMeta = useCallback((e: SyntheticEvent<HTMLAudioElement>) => {
    recoverAudioDuration(e);
  }, []);

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
              <audio
                controls
                preload="metadata"
                className="w-full max-w-full h-9"
                src={att.signedUrl}
                onLoadedMetadata={onAudioMeta}
              >
                <track kind="captions" />
              </audio>
              <p className="text-[10px] text-muted-foreground mt-1 truncate px-1">
                {att.file_name}
              </p>
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
