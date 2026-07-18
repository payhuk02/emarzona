import { readSidebarJsonPref, writeSidebarJsonPref } from '@/lib/navigation/sidebar-prefs-storage';

const SELLER_PUSH_OPT_IN_DISMISSED = 'sellerPushOptInDismissed';

export function isSellerPushOptInDismissed(userId: string | undefined | null): boolean {
  if (!userId) return false;
  return readSidebarJsonPref<boolean>(SELLER_PUSH_OPT_IN_DISMISSED, userId) === true;
}

export function dismissSellerPushOptIn(userId: string): void {
  writeSidebarJsonPref(SELLER_PUSH_OPT_IN_DISMISSED, true, userId);
}

export function resetSellerPushOptInDismissed(userId: string): void {
  writeSidebarJsonPref(SELLER_PUSH_OPT_IN_DISMISSED, false, userId);
}
