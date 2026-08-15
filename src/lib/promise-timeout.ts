/**
 * Race a promise against a timeout. Rejects with Error(`${label}_timeout`) on expiry.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label = 'operation'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label}_timeout`));
    }, ms);
  });

  try {
    return await Promise.race([Promise.resolve(promise), timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

/**
 * Returns fallback when promise times out or throws.
 */
export async function withTimeoutFallback<T>(
  promise: PromiseLike<T>,
  ms: number,
  fallback: T,
  label = 'operation'
): Promise<T> {
  try {
    return await withTimeout(promise, ms, label);
  } catch {
    return fallback;
  }
}
