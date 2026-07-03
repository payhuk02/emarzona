/** Ne pas déranger — pause_until sur notification_preferences */
export function isNotificationPaused(pauseUntil: string | null | undefined): boolean {
  if (!pauseUntil) return false;
  const until = Date.parse(pauseUntil);
  if (Number.isNaN(until)) return false;
  return until > Date.now();
}

export function pauseUntilFromHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/** Demain 08:00 heure locale */
export function pauseUntilTomorrowMorning(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}
