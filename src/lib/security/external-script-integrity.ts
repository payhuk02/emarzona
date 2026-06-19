/**
 * Registre SRI pour scripts tiers à URL stable (sans paramètres dynamiques).
 *
 * Les scripts analytics avec ID variable (gtag/js?id=, gtm.js?id=) sont exclus :
 * Google/Meta/TikTok les mettent à jour sans préavis — un hash figé casserait le chargement.
 * Mettre à jour EXTERNAL_SCRIPT_INTEGRITY après vérification manuelle si un CDN change de binaire.
 */
export const EXTERNAL_SCRIPT_INTEGRITY: Record<string, string> = {
  'https://client.crisp.chat/l.js':
    'sha384-B5HkXboyD+DiEK3GD45tLrPkcCTE4JJIJ7tQF8c0B9yHJJwtFFz7kocDpYSJHdHd',
  'https://connect.facebook.net/en_US/fbevents.js':
    'sha384-2xT/fSAV+d6NutyiJRBWGt9JNj9cVUzRe6usUQ59lzj1fMl7nCCZPAtptWI/0aFA',
  'https://s.pinimg.com/ct/core.js':
    'sha384-UFqPDQiQJuBvexyT8M/2StKs53DISCnHbM1SdFJJlbYfC/KfVLJasC6J6jzH/ctk',
} as const;

/** URLs sans hash SRI (contenu variable ou rotation CDN fréquente). */
export const EXTERNAL_SCRIPT_SRI_EXEMPT_PREFIXES = [
  'https://www.googletagmanager.com/gtag/js',
  'https://www.googletagmanager.com/gtm.js',
  'https://analytics.tiktok.com/',
] as const;

export function resolveScriptIntegrity(src: string): string | undefined {
  if (EXTERNAL_SCRIPT_INTEGRITY[src]) {
    return EXTERNAL_SCRIPT_INTEGRITY[src];
  }

  const isExempt = EXTERNAL_SCRIPT_SRI_EXEMPT_PREFIXES.some(prefix => src.startsWith(prefix));
  return isExempt ? undefined : undefined;
}

export function shouldUseAnonymousCrossOrigin(src: string): boolean {
  return (
    Boolean(resolveScriptIntegrity(src)) ||
    EXTERNAL_SCRIPT_SRI_EXEMPT_PREFIXES.some(prefix => src.startsWith(prefix))
  );
}
