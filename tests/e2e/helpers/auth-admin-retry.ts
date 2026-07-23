/**
 * Retry GoTrue admin calls that fail with intermittent JWT verification
 * (ES256 kid &lt;nil&gt;) on shared E2E Supabase projects.
 */
export function isTransientAuthAdminError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error ?? '');
  return /unrecognized JWT kid|unable to parse or verify signature|token is unverifiable|ES256/i.test(
    message
  );
}

export async function withAuthAdminRetry<T>(
  label: string,
  fn: () => Promise<T>,
  options: { attempts?: number; initialDelayMs?: number } = {}
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const initialDelayMs = options.initialDelayMs ?? 1_500;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isTransientAuthAdminError(error);
      if (!retryable || attempt === attempts) break;
      await new Promise(resolve => setTimeout(resolve, initialDelayMs * attempt));
    }
  }

  throw lastError ?? new Error(`${label} failed`);
}
