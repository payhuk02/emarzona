/**
 * Charge papaparse uniquement lors d'un import/export CSV (hors bundle initial).
 */

type PapaModule = typeof import('papaparse');

let cached: PapaModule['default'] | null = null;

export async function loadPapaParse(): Promise<PapaModule['default']> {
  if (!cached) {
    const mod = await import('papaparse');
    cached = mod.default ?? (mod as unknown as PapaModule['default']);
  }
  return cached;
}
