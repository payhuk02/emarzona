type NamedProduct = { name?: string | null };

export function filterServicesBySearch<T extends { product?: NamedProduct | null }>(
  services: T[] | undefined,
  query: string
): T[] {
  const list = services ?? [];
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(s => (s.product?.name || '').toLowerCase().includes(q));
}
