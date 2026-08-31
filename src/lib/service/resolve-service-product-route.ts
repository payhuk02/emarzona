const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isProductUuid(value: string | undefined | null): boolean {
  if (!value) return false;
  return UUID_RE.test(value);
}

/** Chemin public marketplace pour une prestation service. */
export function buildServicePublicPath(product: { id: string; slug?: string | null }): string {
  const segment = product.slug?.trim() || product.id;
  return `/service/${segment}`;
}
