import { cn } from '@/lib/utils';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { STORE_HERO_BANNER_CLASS } from '@/lib/storefront/store-hero-banner';

/**
 * Shell boutique immédiat (LCP) — remplace le spinner plein écran
 * pendant la résolution store / chunk StoreSubdomainRoutes.
 */

function PremiumProductCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-b from-[#132a4a] via-[#0f1f3d] to-[#0a1628] shadow-[0_4px_20px_-6px_rgba(10,22,40,0.5)] min-h-[480px] sm:min-h-[520px]"
      style={{ animationDelay: `${Math.min(index, 5) * 40}ms` }}
    >
      <div className="aspect-[3/2] bg-[#081220]/65 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
        <div className="h-3.5 w-1/2 rounded bg-white/10 animate-pulse" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-9 rounded-md bg-white/10 animate-pulse" />
          <div className="h-9 rounded-md bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** Grille cartes premium — même ProductGrid / store-product-grid que le catalogue réel. */
export function StorefrontProductGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('mp-product-cards-band', className)}
      aria-busy="true"
      aria-label="Chargement des produits"
    >
      <ProductGrid className="store-product-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <PremiumProductCardSkeleton key={i} index={i} />
        ))}
      </ProductGrid>
    </div>
  );
}

/** Contenu seul (header/footer déjà montés) — ordre = StoreTabs puis filtres. */
export function StorefrontContentSkeleton() {
  return (
    <div
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6"
      role="status"
      aria-busy="true"
      aria-label="Chargement de la boutique"
      data-testid="storefront-content-skeleton"
    >
      <div className="flex gap-1 border-b border-border/50">
        {['w-28', 'w-20', 'w-16', 'w-24'].map((w, i) => (
          <div key={i} className={cn('h-11 rounded-none bg-muted/45 animate-pulse', w)} />
        ))}
      </div>
      <div className="h-11 w-full max-w-md rounded-lg bg-muted/55 animate-pulse" />
      <StorefrontProductGridSkeleton />
      <span className="sr-only">Chargement de la boutique…</span>
    </div>
  );
}

export function StorefrontChromeSkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      role="status"
      aria-busy="true"
      aria-label="Chargement de la boutique"
      data-testid="storefront-chrome-skeleton"
    >
      <div className="h-14 sm:h-16 border-b border-border/60 bg-muted/20" />
      <div
        className={cn(
          'w-full bg-gradient-to-br from-slate-800/80 via-slate-900/70 to-slate-950 animate-pulse',
          STORE_HERO_BANNER_CLASS
        )}
      />
      <div className="h-7 sm:h-10 md:h-12" aria-hidden />
      <StorefrontContentSkeleton />
    </div>
  );
}
