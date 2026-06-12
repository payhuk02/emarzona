/**
 * Epic 3.4 — Redirection post-paiement cours vers /learn/:slug
 */

export function buildCourseLearnUrl(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) return '/account/courses';
  return `/learn/${encodeURIComponent(trimmed)}`;
}

/** Résout l'URL learn depuis product slug ou id de repli. */
export function resolveCourseLearnUrl(options: {
  slug?: string | null;
  productId?: string | null;
}): string {
  if (options.slug?.trim()) {
    return buildCourseLearnUrl(options.slug);
  }
  if (options.productId) {
    return `/courses/${options.productId}`;
  }
  return '/account/courses';
}
