/**
 * Messages d'erreur Auth (Supabase) pour l'UI
 */

export function getCaughtErrorMessage(caught: unknown): string {
  if (caught instanceof Error) return caught.message;
  if (typeof caught === 'object' && caught !== null && 'message' in caught) {
    const msg = (caught as { message?: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  if (typeof caught === 'string') return caught;
  return '';
}

/** Traduit / clarifie les erreurs Supabase Auth courantes */
export function mapAuthErrorMessage(
  message: string,
  context: 'signup' | 'login' | 'reset'
): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('already registered') ||
    lower.includes('user already registered') ||
    lower.includes('email address is already')
  ) {
    return 'Un compte existe déjà avec cet email. Utilisez Connexion ou Mot de passe oublié.';
  }

  if (
    lower.includes('error sending confirmation') ||
    lower.includes('confirmation email') ||
    lower.includes('unable to send email') ||
    lower.includes('smtp')
  ) {
    return "Impossible d'envoyer l'email de confirmation. Vérifiez l'adresse ou réessayez dans quelques minutes.";
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
  }

  if (lower.includes('password') && lower.includes('weak')) {
    return 'Mot de passe trop faible. Utilisez au moins 6 caractères avec lettres et chiffres.';
  }

  if (lower.includes('invalid login credentials') && context === 'login') {
    return 'Email ou mot de passe incorrect.';
  }

  if (lower.includes('signup') && lower.includes('disabled')) {
    return 'Les inscriptions sont temporairement désactivées.';
  }

  if (lower.includes('invalid email')) {
    return 'Adresse email invalide.';
  }

  return message;
}
