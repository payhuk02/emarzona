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
  | { ok: false; reason: 'too_short' | 'empty' | 'encode_failed' };

/**
 * Assemble chunks into a playable voice File.
 * Converts to WAV when possible so production <audio> always plays (incl. iOS).
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

  // Retry WAV encode once — first attempt can fail if AudioContext was suspended.
  let wav = await convertAudioBlobToWav(rawBlob);
  if (!wav || wav.size < VOICE_MIN_BYTES) {
    await new Promise(r => setTimeout(r, 50));
    wav = await convertAudioBlobToWav(rawBlob);
  }

  if (wav && wav.size >= VOICE_MIN_BYTES) {
    const file = new File([wav], `vocal-${Date.now()}.wav`, { type: 'audio/wav' });
    return { ok: true, file, durationMs };
  }

  // Last resort: keep original container (may not play on iOS). Prefer failing empty over silence.
  if (rawBlob.size < VOICE_MIN_BYTES) {
    return { ok: false, reason: 'empty' };
  }

  // audio/mp4 (Safari MediaRecorder) is widely playable — allow as fallback.
  if (baseType.includes('mp4') || baseType.includes('m4a') || baseType.includes('aac')) {
    const file = new File([rawBlob], `vocal-${Date.now()}.m4a`, { type: 'audio/mp4' });
    return { ok: true, file, durationMs };
  }

  // WebM/Ogg often unplayable in production players — surface encode failure so UI can toast.
  return { ok: false, reason: 'encode_failed' };
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
