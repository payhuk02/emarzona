export type AutoEnablePushInput = {
  userId: string | undefined | null;
  pushNotificationsEnabled: boolean | null | undefined;
  isSupported: boolean;
  isVapidReady: boolean;
  permission: NotificationPermissionState;
  isSubscribed: boolean;
  alreadyAttemptedThisSession: boolean;
};

/**
 * Détermine si l'app doit tenter l'opt-in push automatique (permission + abonnement VAPID).
 * Respecte un refus navigateur explicite et évite les boucles dans la même session.
 */
export function shouldAutoEnablePush(input: AutoEnablePushInput): boolean {
  if (!input.userId) return false;
  if (input.alreadyAttemptedThisSession) return false;
  if (!input.isSupported || !input.isVapidReady) return false;
  if (input.pushNotificationsEnabled === false) return false;
  if (input.permission === 'denied') return false;
  if (input.isSubscribed) return false;
  return true;
}

export function getAutoEnablePushSessionKey(userId: string): string {
  return `emarzona_push_auto_${userId}`;
}

export function hasAutoEnablePushBeenAttempted(userId: string): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(getAutoEnablePushSessionKey(userId)) === '1';
}

export function markAutoEnablePushAttempted(userId: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(getAutoEnablePushSessionKey(userId), '1');
}
