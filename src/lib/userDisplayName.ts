/** Helpers pour résoudre un nom d'utilisateur sans retomber sur l'email. */

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function looksLikeEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_LIKE.test(value.trim());
}

/** Nom utilisable (pas null, pas vide, pas une adresse email). */
export function sanitizeDisplayName(
  value: string | null | undefined,
  email?: string | null
): string | null {
  const trimmed = value?.trim() || '';
  if (!trimmed) return null;
  if (looksLikeEmail(trimmed)) return null;
  if (email && trimmed.toLowerCase() === email.trim().toLowerCase()) return null;
  return trimmed;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Résout le « Nom complet » à afficher.
 * Priorité : prénom+nom → display_name → métadonnée auth (full_name) — jamais l'email.
 */
export function resolveUserFullName(input: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  metaFullName?: string | null;
  email?: string | null;
  fallback?: string;
}): string {
  const composed = [input.firstName, input.lastName]
    .map(p => p?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
  if (composed && !looksLikeEmail(composed)) return composed;

  const fromDisplay = sanitizeDisplayName(input.displayName, input.email);
  if (fromDisplay) return fromDisplay;

  const fromMeta = sanitizeDisplayName(input.metaFullName, input.email);
  if (fromMeta) return fromMeta;

  return input.fallback ?? 'N/A';
}
