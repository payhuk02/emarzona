/**
 * Shared MediaRecorder helpers for contact chat (user + admin).
 * Prefer WAV upload so HTML audio plays reliably in production (WebM/Opus + signed URLs often fail).
 */
import { convertAudioBlobToWav } from '@/lib/support/audio-wav';

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
 * Assemble chunks into a playable voice File.
 * Converts to WAV when possible so production <audio> + Supabase signed URLs always play.
 */
export async function finalizeVoiceRecording(
  chunks: Blob[],
  mimeType: string,
  _ext: string,
  durationMs: number
): Promise<VoiceFileResult> {
  const baseType = (mimeType || 'audio/webm').split(';')[0] || 'audio/webm';
  const rawBlob = new Blob(chunks, { type: baseType });

  if (rawBlob.size < VOICE_MIN_BYTES || durationMs < VOICE_MIN_MS) {
    return { ok: false, reason: 'too_short' };
  }

  const wav = await convertAudioBlobToWav(rawBlob);
  if (wav && wav.size >= VOICE_MIN_BYTES) {
    const file = new File([wav], `vocal-${Date.now()}.wav`, { type: 'audio/wav' });
    return { ok: true, file, durationMs };
  }

  // Fallback: keep original container (may not play everywhere)
  if (rawBlob.size < VOICE_MIN_BYTES) {
    return { ok: false, reason: 'empty' };
  }
  const fileType = baseType.startsWith('audio/') ? baseType : 'audio/webm';
  const ext =
    fileType.includes('mp4') || fileType.includes('m4a')
      ? 'm4a'
      : fileType.includes('ogg')
        ? 'ogg'
        : 'webm';
  const file = new File([rawBlob], `vocal-${Date.now()}.${ext}`, { type: fileType });
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
    window.setTimeout(done, 2000);
  });
}
