/** Erreurs Auth indiquant qu'un utilisateur existe déjà pour cet email. */
export function isDuplicateAuthUserError(error: { message?: string } | null | undefined): boolean {
  const msg = (error?.message ?? '').toLowerCase();
  return msg.includes('already') || msg.includes('registered') || msg.includes('exists');
}
