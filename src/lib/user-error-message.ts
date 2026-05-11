/**
 * Readable message when catching unknown values (logs, toasts, UI).
 * Supabase PostgrestError-like values are plain objects with .message, not always instanceof Error.
 */
export function toUserErrorMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err.trim();
  if (typeof err === 'number' || typeof err === 'boolean') return String(err);
  if (err instanceof Error) return err.message.trim();
  if (typeof err === 'object') {
    const o = err as Record<string, unknown>;
    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim();
    const od = o.error_description;
    if (typeof od === 'string' && od.trim()) return od.trim();
    if (typeof o.details === 'string' && o.details.trim()) return o.details.trim();
    if (typeof o.hint === 'string' && o.hint.trim()) return o.hint.trim();
    const code = o.code;
    if (typeof code === 'string' && code.trim()) return code.trim();
    try {
      const s = JSON.stringify(err);
      if (s && s !== '{}' && s !== '[object Object]') return s;
    } catch {
      /* ignore */
    }
  }
  return '';
}
