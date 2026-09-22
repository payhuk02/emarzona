/**
 * Retry GoTrue admin calls that fail with intermittent JWT verification
 * (ES256 kid &lt;nil&gt;) or transient network/`AuthRetryableFetchError` on shared E2E Supabase.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';

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

export function isDuplicateAuthUserError(error: unknown): boolean {
  const message = errorMessage(error);
  return /already been registered|already registered|email.?exists|user already exists|duplicate key.*email/i.test(
    message
  );
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
  if (
    /fetch failed|network|ECONNRESET|ETIMEDOUT|socket hang up|429|502|503|504|connection refused|ECONNREFUSED|upstream connect|delayed connect|aborted/i.test(
      message
    )
  ) {
    return true;
  }

  // Postgres aborted transaction / pooler blips bubbled through GoTrue
  if (/25P02|08006|PGRST002|57014|statement timeout|canceling statement/i.test(message)) {
    return true;
  }

  const status = errorStatus(error);
  if (status === 429 || status === 502 || status === 503 || status === 504) return true;

  return false;
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(user => user.email?.toLowerCase() === normalized);
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * createUser with retry. If a prior attempt created the user but the client saw a
 * transient failure, recover via listUsers + updateUserById (password reset).
 */
export async function createConfirmedE2EUser(
  admin: SupabaseClient,
  email: string,
  password: string
): Promise<{ user: User }> {
  return withAuthAdminRetry(`createUser(${email})`, async () => {
    const result = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (!result.error && result.data.user) {
      return { user: result.data.user };
    }

    if (result.error && isDuplicateAuthUserError(result.error)) {
      const existing = await findAuthUserByEmail(admin, email);
      if (existing) {
        const updated = await admin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
        });
        if (updated.error || !updated.data.user) {
          throw updated.error ?? new Error(`updateUserById failed for ${email}`);
        }
        return { user: updated.data.user };
      }
    }

    throw result.error ?? new Error(`createUser failed for ${email}`);
  });
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
