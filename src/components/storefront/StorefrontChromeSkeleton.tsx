/**
 * Shell boutique immédiat (LCP) — remplace le spinner plein écran
 * pendant la résolution store / chunk StoreSubdomainRoutes.
 */
export function StorefrontChromeSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-busy="true"
      aria-label="Chargement de la boutique"
    >
      <div className="h-16 border-b border-border/60 bg-muted/30 animate-pulse" />
      <div className="h-40 sm:h-52 w-full bg-muted/40 animate-pulse" />
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <div className="h-10 w-full max-w-md rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border/50">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-4 space-y-3 bg-card">
                <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Chargement de la boutique…</span>
    </div>
  );
}
