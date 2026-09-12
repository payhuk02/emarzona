/**
 * Retry GoTrue admin calls that fail with intermittent JWT verification
 * (ES256 kid &lt;nil&gt;) or transient network/`AuthRetryableFetchError` on shared E2E Supabase.
 */

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (typeof error === 'object' && error && 'name' in error) {
    return String((error as { name: unknown }).name ?? '');
  }
  return '';
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message: unknown }).message ?? '');
  }
  return String(error ?? '');
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || !error) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export function isTransientAuthAdminError(error: unknown): boolean {
  const name = errorName(error);
  if (/AuthRetryableFetchError|FetchError|AbortError/i.test(name)) return true;

  const message = errorMessage(error);
  if (
    /unrecognized JWT kid|unable to parse or verify signature|token is unverifiable|ES256/i.test(
      message
    )
  ) {
    return true;
  }
  if (/fetch failed|network|ECONNRESET|ETIMEDOUT|socket hang up|429|502|503|504/i.test(message)) {
    return true;
  }

  const status = errorStatus(error);
  if (status === 429 || status === 502 || status === 503 || status === 504) return true;

  return false;
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
      if (!retryable || attempt === attempts) {
        if (retryable) {
          throw lastError instanceof Error
            ? Object.assign(lastError, {
                message: `${label} failed after ${attempts} attempts: ${lastError.message || nameOf(lastError)}`,
              })
            : new Error(`${label} failed after ${attempts} attempts: ${String(lastError)}`);
        }
        break;
      }
      await new Promise(resolve => setTimeout(resolve, initialDelayMs * attempt));
    }
  }

  throw lastError ?? new Error(`${label} failed`);
}

function nameOf(error: unknown): string {
  return errorName(error) || errorMessage(error) || 'unknown';
}
