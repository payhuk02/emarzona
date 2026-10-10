/**
 * Shared MediaRecorder helpers for contact chat (user + admin).
 */
import { fixWebmDuration } from '@/lib/support/fix-webm-duration';

export const VOICE_MAX_RECORD_SECS = 120;
export const VOICE_MIN_BYTES = 800;
export const VOICE_MIN_MS = 600;

export function pickRecorderMime(): { mimeType?: string; ext: string } {
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

export type VoiceFileResult =
  | { ok: true; file: File; durationMs: number }
  | { ok: false; reason: 'too_short' | 'empty' };

/**
 * Assemble chunks into a playable voice File (WebM duration patched when needed).
 * durationMs should come from a ref updated during recording — not React state
 * (stop handlers often reset state to 0 before onstop runs).
 */
export async function finalizeVoiceRecording(
  chunks: Blob[],
  mimeType: string,
  ext: string,
  durationMs: number
): Promise<VoiceFileResult> {
  const baseType = (mimeType || 'audio/webm').split(';')[0] || 'audio/webm';
  let blob = new Blob(chunks, { type: baseType });

  if (blob.size < VOICE_MIN_BYTES || durationMs < VOICE_MIN_MS) {
    return { ok: false, reason: 'too_short' };
  }

  if (baseType.includes('webm') || baseType.includes('matroska')) {
    blob = await fixWebmDuration(blob, durationMs);
  }

  if (blob.size < VOICE_MIN_BYTES) {
    return { ok: false, reason: 'empty' };
  }

  const fileType = baseType.startsWith('audio/') ? baseType : 'audio/webm';
  const file = new File([blob], `vocal-${Date.now()}.${ext || 'webm'}`, { type: fileType });
  return { ok: true, file, durationMs };
}

/** Stop recorder and wait for onstop (so the blob is ready before send). */
export function stopMediaRecorderAndWait(recorder: MediaRecorder | null): Promise<void> {
  return new Promise(resolve => {
    if (!recorder || recorder.state === 'inactive') {
      resolve();
      return;
    }
    const done = () => resolve();
    recorder.addEventListener('stop', done, { once: true });
    try {
      // Flush the final cluster before stop (helps some Chromium builds)
      if (recorder.state === 'recording') {
        try {
          recorder.requestData();
        } catch {
          /* ignore */
        }
      }
      recorder.stop();
    } catch {
      resolve();
    }
    // Safety timeout if stop never fires
    window.setTimeout(done, 2000);
  });
}
