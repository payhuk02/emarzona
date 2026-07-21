/** Routes compte utilisateur — hors garde-fou vendeur (boutique / plan physique). */
const ACCOUNT_SETTINGS_PREFIXES = [
  '/dashboard/settings',
  '/settings/notifications',
  '/notifications',
] as const;

export function isAccountSettingsPath(pathname: string): boolean {
  const path = pathname.split('?')[0];
  return ACCOUNT_SETTINGS_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}
