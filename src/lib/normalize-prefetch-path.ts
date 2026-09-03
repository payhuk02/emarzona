/** Normalise pathname (sans query/hash, trailing slash). */
export function normalizePrefetchPath(path: string): string {
  try {
    const pathname = path.startsWith('http')
      ? new URL(path).pathname
      : path.split('?')[0].split('#')[0];
    if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
    return pathname || '/';
  } catch {
    return path;
  }
}
