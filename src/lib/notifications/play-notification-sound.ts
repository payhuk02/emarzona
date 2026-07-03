/**
 * Sons de notification in-app (Web Audio — pas de fichiers externes)
 */

export type NotificationSoundType = 'default' | 'gentle' | 'urgent';

const SOUND_FREQUENCIES: Record<NotificationSoundType, number[]> = {
  default: [880, 1100],
  gentle: [660, 880],
  urgent: [1200, 900, 1200],
};

/** Contraste renforcé : fréquences plus espacées */
const HIGH_CONTRAST_FREQUENCIES: Record<NotificationSoundType, number[]> = {
  default: [520, 1040, 1560],
  gentle: [440, 880],
  urgent: [880, 1320, 880, 1760],
};

export type PlayNotificationSoundOptions = {
  volumePercent?: number;
  highContrast?: boolean;
};

function clampVolume(percent: number | undefined): number {
  const p = percent ?? 80;
  return Math.min(100, Math.max(0, p)) / 100;
}

export function playNotificationSound(
  soundType: NotificationSoundType = 'default',
  options: PlayNotificationSoundOptions = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const volume = clampVolume(options.volumePercent);
    if (volume <= 0) {
      void ctx.close();
      return;
    }

    const peakGain = 0.12 * volume;
    const frequencies = options.highContrast
      ? (HIGH_CONTRAST_FREQUENCIES[soundType] ?? HIGH_CONTRAST_FREQUENCIES.default)
      : (SOUND_FREQUENCIES[soundType] ?? SOUND_FREQUENCIES.default);

    let time = ctx.currentTime;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = options.highContrast ? 'square' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peakGain, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.2);
      time += index < frequencies.length - 1 ? 0.12 : 0;
    });

    window.setTimeout(() => {
      void ctx.close();
    }, 800);
  } catch {
    // Audio non disponible — ignorer silencieusement
  }
}
