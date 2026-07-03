export type VibrationIntensity = 'light' | 'medium' | 'heavy';

export function parseVibrationIntensity(value: string | null | undefined): VibrationIntensity {
  if (value === 'light' || value === 'heavy') return value;
  return 'medium';
}

export function getVibrationPattern(
  intensity: VibrationIntensity | null | undefined,
  enabled = true
): number[] {
  if (!enabled) return [];
  switch (intensity) {
    case 'light':
      return [100, 50, 100];
    case 'heavy':
      return [300, 150, 300];
    case 'medium':
    default:
      return [200, 100, 200];
  }
}

export function triggerDeviceVibration(
  intensity: VibrationIntensity | null | undefined,
  enabled = true
): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  const pattern = getVibrationPattern(intensity, enabled);
  if (pattern.length > 0) navigator.vibrate(pattern);
}
