/**
 * Messages d'erreur Auth (Supabase) pour l'UI
 */
import { getErrorMessage } from '@/types/errors';
import { isSupabaseBackendConfigured, isSupabaseNetworkError } from '@/lib/supabase-config';

const AUTH_CODE_MESSAGES: Record<string, string> = {
  user_already_exists:
    'Un compte existe déjà avec cet email. Utilisez Connexion ou Mot de passe oublié.',
  email_exists: 'Un compte existe déjà avec cet email. Utilisez Connexion ou Mot de passe oublié.',
  email_address_invalid: 'Adresse email invalide.',
  email_address_not_authorized: "Cette adresse email n'est pas autorisée.",
  weak_password: 'Mot de passe trop faible. Utilisez au moins 6 caractères.',
  over_email_send_rate_limit:
    "Trop d'emails envoyés. Patientez quelques minutes avant de réessayer.",
  over_request_rate_limit: 'Trop de tentatives. Patientez quelques minutes.',
  signup_disabled: 'Les inscriptions sont temporairement désactivées.',
  unexpected_failure:
    "Impossible d'envoyer l'email de confirmation. Vérifiez la configuration SMTP ou réessayez plus tard.",
};

function readAuthCode(caught: unknown): string | undefined {
  if (typeof caught !== 'object' || caught === null) return undefined;
  const code = (caught as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function readAuthStatus(caught: unknown): number | undefined {
  if (typeof caught !== 'object' || caught === null) return undefined;
  const status = (caught as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

const LOCAL_SUPABASE_CONFIG_HINT =
  'Backend Supabase non configuré en local. Ajoutez VITE_SUPABASE_URL=https://hbdnzajbyjakdhuavrvb.supabase.co et VITE_SUPABASE_ANON_KEY dans un fichier .env à la racine du projet, puis redémarrez npm run dev.';

/** Extrait un message lisible depuis toute erreur Auth / Supabase */
export function getCaughtErrorMessage(caught: unknown): string {
  if (isSupabaseNetworkError(caught)) {
    if (!isSupabaseBackendConfigured()) {
      return LOCAL_SUPABASE_CONFIG_HINT;
    }
    return 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
  }

  const status = readAuthStatus(caught);
  if (status === 504 || status === 522 || status === 524) {
    return AUTH_CODE_MESSAGES.unexpected_failure;
  }

  const code = readAuthCode(caught);
  if (code && AUTH_CODE_MESSAGES[code]) {
    return AUTH_CODE_MESSAGES[code];
  }

  const fromHelper = getErrorMessage(caught);
  if (fromHelper && fromHelper !== "Une erreur inattendue s'est produite") {
    return fromHelper;
  }

  if (typeof caught === 'object' && caught !== null) {
    const o = caught as Record<string, unknown>;
    if (typeof o.msg === 'string' && o.msg.trim()) return o.msg;
    if (typeof o.error_description === 'string' && o.error_description.trim()) {
      return o.error_description;
    }
    if (typeof o.error === 'string' && o.error.trim()) return o.error;
  }

  if (typeof caught === 'string' && caught.trim()) return caught;

  return '';
}

/** Traduit / clarifie les erreurs Supabase Auth courantes (message texte) */
export function mapAuthErrorMessage(
  message: string,
  context: 'signup' | 'login' | 'reset'
): string {
  const trimmed = message.trim();
  if (!trimmed || trimmed === '{}') {
    return '';
  }

  const lower = trimmed.toLowerCase();

  if (
    lower.includes('already registered') ||
    lower.includes('user already registered') ||
    lower.includes('email address is already')
  ) {
    return AUTH_CODE_MESSAGES.user_already_exists;
  }

  if (
    lower.includes('error sending confirmation') ||
    lower.includes('confirmation email') ||
    lower.includes('unable to send email') ||
    lower.includes('smtp')
  ) {
    return AUTH_CODE_MESSAGES.unexpected_failure;
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return AUTH_CODE_MESSAGES.over_request_rate_limit;
  }

  if (lower.includes('password') && lower.includes('weak')) {
    return AUTH_CODE_MESSAGES.weak_password;
  }

  if (lower.includes('invalid login credentials') && context === 'login') {
    return 'Email ou mot de passe incorrect.';
  }

  if (lower.includes('signup') && lower.includes('disabled')) {
    return AUTH_CODE_MESSAGES.signup_disabled;
  }

  if (lower.includes('invalid email')) {
    return AUTH_CODE_MESSAGES.email_address_invalid;
  }

  if (
    lower.includes('gateway timeout') ||
    lower.includes('504') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return AUTH_CODE_MESSAGES.unexpected_failure;
  }

  if (lower.includes('failed to fetch')) {
    return !isSupabaseBackendConfigured()
      ? LOCAL_SUPABASE_CONFIG_HINT
      : 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.';
  }

  return trimmed;
}

/** Toujours une chaîne affichable (évite `{}` dans l'UI) */
export function formatAuthErrorForUi(
  caught: unknown,
  context: 'signup' | 'login' | 'reset',
  fallback: string
): string {
  const raw = getCaughtErrorMessage(caught);
  const mapped = raw ? mapAuthErrorMessage(raw, context) : '';
  const result = mapped || raw;
  if (result && result !== '{}') return result;
  return fallback;
}

/** Normalise une valeur inconnue (ex. message rate limit) en chaîne */
export function coerceToErrorString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed && trimmed !== '{}') return trimmed;
  }
  if (value !== undefined && value !== null) {
    const fromObject = formatAuthErrorForUi(value, 'signup', '');
    if (fromObject) return fromObject;
  }
  return fallback;
}
