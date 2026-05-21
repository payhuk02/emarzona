/**
 * Routes qui utilisent le thème premium (landing) hors pages déjà dédiées.
 */
export function shouldUseAppPremiumTheme(pathname: string): boolean {
  if (pathname === '/') return false;
  if (pathname.startsWith('/marketplace')) return false;
  return true;
}
