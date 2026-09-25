/** Fallback Suspense léger — hors chunk SponsoredProductsSection. */
export function SponsoredProductsSectionFallback() {
  return (
    <section
      className="lp-section-pad lp-section-muted lp-sponsored-section border-y border-[var(--lp-border-light)] aria-busy-skeleton"
      aria-busy="true"
      data-busy-quiet=""
      aria-label="Chargement des produits sponsorisés"
    >
      <div className="lp-sponsored-shell mx-auto max-w-7xl">
        <div className="lp-sponsored-shell__pad mx-auto max-w-3xl space-y-4 text-center">
          <div className="mx-auto h-3 w-28 animate-pulse rounded bg-black/[0.06]" />
          <div className="mx-auto h-10 w-64 max-w-full animate-pulse rounded bg-black/[0.08] sm:h-12 sm:w-80" />
          <div className="mx-auto h-4 w-full max-w-md animate-pulse rounded bg-black/[0.05]" />
        </div>
        <div className="lp-sponsored-grid lp-sponsored-grid--skeleton mt-10 sm:mt-14" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="lp-sponsored-card lp-sponsored-card--skeleton">
              <div className="lp-sponsored-card__media lp-sponsored-card__media--skeleton" />
              <div className="lp-sponsored-card__body space-y-3">
                <div className="h-4 w-1/2 animate-pulse rounded bg-black/[0.06]" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-black/[0.07]" />
                <div className="h-8 w-full animate-pulse rounded-lg bg-black/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
