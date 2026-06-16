/**
 * Sons de notification in-app (respecte notification_sound_type des préférences)
 */

export type NotificationSoundType = 'default' | 'gentle' | 'urgent';

const SOUND_FREQUENCIES: Record<NotificationSoundType, number[]> = {
  default: [880, 1100],
  gentle: [660, 880],
  urgent: [1200, 900, 1200],
};

export function playNotificationSound(soundType: NotificationSoundType = 'default'): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const frequencies = SOUND_FREQUENCIES[soundType] ?? SOUND_FREQUENCIES.default;
    let time = ctx.currentTime;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.12, time + 0.02);
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
