import type { CSSProperties } from 'react';
import { usePremiumReveal } from './usePremiumReveal';
import { useLandingPlatformStores } from '@/hooks/useLandingPlatformStores';
import { generateStoreUrl } from '@/lib/store-utils';

const ACCENT_PALETTE = [
  '#c9a227',
  '#e07a5f',
  '#7c5cff',
  '#2d6a4f',
  '#4a90a4',
  '#b8860b',
  '#e8a4b8',
  '#5b7cfa',
];

function accentFromSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_PALETTE[Math.abs(hash) % ACCENT_PALETTE.length];
}

function storeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function StoreChip({
  name,
  slug,
  subdomain,
  logoUrl,
}: {
  name: string;
  slug: string;
  subdomain: string | null;
  logoUrl: string | null;
}) {
  const accent = accentFromSlug(slug);
  const href = generateStoreUrl(slug, subdomain);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="lp-marquee-item mx-3 flex shrink-0 items-center gap-3 rounded-2xl border border-[var(--lp-border-light)] bg-white px-5 py-3 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] sm:mx-4"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          {storeInitials(name)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--lp-text)]">{name}</p>
        <p className="text-[11px] text-[var(--lp-text-muted)]">Boutique Emarzona</p>
      </div>
    </a>
  );
}

function MarqueeSkeleton() {
  return (
    <div className="flex w-max items-center gap-4 px-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="h-[58px] w-48 animate-pulse rounded-2xl bg-[var(--lp-border-light)]"
        />
      ))}
    </div>
  );
}

export function StoresMarqueeSection() {
  const { ref, className } = usePremiumReveal();
  const { data: stores = [], isLoading, isError } = useLandingPlatformStores();

  if (!isLoading && (isError || stores.length === 0)) {
    return null;
  }

  const track = stores.length > 0 ? [...stores, ...stores] : [];

  return (
    <section className="overflow-hidden border-y border-[var(--lp-border-light)] bg-[var(--lp-surface)] py-12 sm:py-16">
      <div ref={ref} className={`lp-reveal ${className}`}>
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.22em] text-[var(--lp-text-muted)]">
          Ils nous font confiance — boutiques sur Emarzona
        </p>
        <div className="lp-marquee-mask relative">
          {isLoading ? (
            <MarqueeSkeleton />
          ) : (
            <div
              className="lp-marquee-track flex w-max items-center"
              style={
                {
                  '--lp-marquee-duration': `${Math.max(56, stores.length * 8)}s`,
                } as CSSProperties
              }
            >
              {track.map((store, i) => (
                <StoreChip
                  key={`${store.id}-${i}`}
                  name={store.name}
                  slug={store.slug}
                  subdomain={store.subdomain}
                  logoUrl={store.logo_url}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
