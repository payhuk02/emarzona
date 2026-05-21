/**
 * Détecte si le backend Supabase est configuré pour des requêtes réseau réelles.
 * Évite les erreurs console quand VITE_SUPABASE_URL pointe vers mock.supabase.co (dev/CI).
 */
export function isSupabaseBackendConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
  const key = (
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    ''
  ).trim();

  if (!url || !key || key === 'mock-key') return false;
  if (/mock\.supabase\.co/i.test(url)) return false;

  try {
    const host = new URL(url).hostname;
    if (!host || host === 'localhost') return false;
  } catch {
    return false;
  }

  return true;
}

/** Erreur réseau typique quand l'URL Supabase est invalide ou injoignable (ex. mock.supabase.co). */
export function isSupabaseNetworkError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error);
  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('ERR_NAME_NOT_RESOLVED') ||
    message.includes('getaddrinfo')
  );
}
