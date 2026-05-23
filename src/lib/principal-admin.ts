/**
 * Administrateur principal — exempté des contraintes 2FA / AAL2 en interface admin.
 * Aligné sur les migrations SQL (contact@edigit-agence.com).
 */
export const PRINCIPAL_ADMIN_EMAIL = 'contact@edigit-agence.com';

export function isPrincipalAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRINCIPAL_ADMIN_EMAIL;
}
