/**
 * Utilitaires pour les opérations sur le temps et les durées
 * Fournit des fonctions réutilisables pour manipuler le temps
 */

export interface TimeComponents {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export interface DurationFormat {
  short: string;
  long: string;
  compact: string;
  hms: string;
}

/**
 * Convertit des secondes en composants de temps
 */
export function secondsToTime(seconds: number): TimeComponents {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return {
    hours,
    minutes,
    seconds: secs,
    totalSeconds: seconds,
  };
}

/**
 * Convertit des composants de temps en secondes
 */
export function timeToSeconds(time: Partial<TimeComponents>): number {
  const hours = time.hours || 0;
  const minutes = time.minutes || 0;
  const seconds = time.seconds || 0;

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formate une durée en secondes
 */
export function formatDuration(
  seconds: number,
  format: 'short' | 'long' | 'compact' | 'hms' = 'short'
): string {
  if (!seconds || seconds === 0) {
    return format === 'hms' ? '00:00:00' : '0s';
  }

  const { hours, minutes, seconds: secs } = secondsToTime(seconds);

  switch (format) {
    case 'short':
      if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      if (minutes > 0) {
        return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
      }
      return `${secs}s`;

    case 'long': {
      const parts: string[] = [];
      if (hours > 0) {
        parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
      }
      if (minutes > 0) {
        parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
      if (secs > 0 || parts.length === 0) {
        parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);
      }
      return parts.join(', ');
    }

    case 'compact':
      if (hours > 0) {
        return `${hours}h`;
      }
      if (minutes > 0) {
        return `${minutes}m`;
      }
      return `${secs}s`;

    case 'hms':
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    default:
      return `${seconds}s`;
  }
}

/**
 * Formate une durée en minutes
 */
export function formatDurationMinutes(
  minutes: number,
  format: 'short' | 'long' = 'short'
): string {
  if (!minutes || minutes === 0) {
    return format === 'short' ? '0m' : '0 minute';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (format === 'short') {
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);
  }
  return parts.join(' et ');
}

/**
 * Formate une durée en millisecondes
 */
export function formatDurationMs(
  milliseconds: number,
  format: 'short' | 'long' = 'short'
): string {
  return formatDuration(Math.floor(milliseconds / 1000), format);
}

/**
 * Parse une durée depuis une chaîne
 */
export function parseDuration(duration: string): number {
  // Format: "1h 30m 45s" ou "01:30:45" ou "90m"
  const hmsMatch = duration.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (hmsMatch) {
    const [, hours, minutes, seconds] = hmsMatch.map(Number);
    return timeToSeconds({ hours, minutes, seconds });
  }

  const partsMatch = duration.match(/(\d+)([hms])/g);
  if (partsMatch) {
    let totalSeconds = 0;
    partsMatch.forEach((part) => {
      const match = part.match(/(\d+)([hms])/);
      if (match) {
        const value = Number(match[1]);
        const unit = match[2];
        if (unit === 'h') totalSeconds += value * 3600;
        else if (unit === 'm') totalSeconds += value * 60;
        else if (unit === 's') totalSeconds += value;
      }
    });
    return totalSeconds;
  }

  // Fallback: essayer de parser comme nombre de secondes
  const seconds = parseFloat(duration);
  return isNaN(seconds) ? 0 : seconds;
}

/**
 * Calcule la différence entre deux dates en secondes
 */
export function timeDifference(
  start: Date | number,
  end: Date | number
): number {
  const startTime = typeof start === 'number' ? start : start.getTime();
  const endTime = typeof end === 'number' ? end : end.getTime();
  return Math.floor((endTime - startTime) / 1000);
}

/**
 * Calcule le temps restant jusqu'à une date
 */
export function timeRemaining(target: Date | number): TimeComponents {
  const now = Date.now();
  const targetTime = typeof target === 'number' ? target : target.getTime();
  const diff = Math.max(0, Math.floor((targetTime - now) / 1000));
  return secondsToTime(diff);
}

/**
 * Formate le temps restant
 */
export function formatTimeRemaining(
  target: Date | number,
  format: 'short' | 'long' = 'short'
): string {
  const remaining = timeRemaining(target);
  return formatDuration(timeToSeconds(remaining), format);
}

/**
 * Ajoute du temps à une date
 */
export function addTime(
  date: Date,
  time: Partial<TimeComponents>
): Date {
  const seconds = timeToSeconds(time);
  return new Date(date.getTime() + seconds * 1000);
}

/**
 * Soustrait du temps d'une date
 */
export function subtractTime(
  date: Date,
  time: Partial<TimeComponents>
): Date {
  const seconds = timeToSeconds(time);
  return new Date(date.getTime() - seconds * 1000);
}

/**
 * Formate un temps (HH:MM:SS) depuis des secondes
 */
export function formatTime(seconds: number): string {
  return formatDuration(seconds, 'hms');
}

/**
 * Formate un temps depuis une date
 */
export function formatTimeFromDate(
  date: Date,
  includeSeconds: boolean = false
): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  if (includeSeconds) {
    return `${hours}:${minutes}:${seconds}`;
  }
  return `${hours}:${minutes}`;
}

/**
 * Parse un temps (HH:MM:SS) en secondes
 */
export function parseTime(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 3) {
    return timeToSeconds({ hours: parts[0], minutes: parts[1], seconds: parts[2] });
  }
  if (parts.length === 2) {
    return timeToSeconds({ hours: parts[0], minutes: parts[1], seconds: 0 });
  }
  return 0;
}

