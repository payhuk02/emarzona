import { lazy, Suspense, type ComponentProps } from 'react';

const StoreMarketingSections = lazy(() =>
  import('@/components/storefront/StoreMarketingSections').then(m => ({
    default: m.StoreMarketingSections,
  }))
);
const ReviewsList = lazy(() =>
  import('@/components/storefront/ReviewsList').then(m => ({ default: m.default }))
);
const ContactForm = lazy(() =>
  import('@/components/storefront/ContactForm').then(m => ({ default: m.default }))
);
const StoreLocationSection = lazy(() =>
  import('@/components/storefront/StoreLocationSection').then(m => ({
    default: m.StoreLocationSection,
  }))
);

function SectionFallback({ label }: { label: string }) {
  return (
    <div className="space-y-4 py-6" aria-busy="true" aria-label={label}>
      <div className="h-6 w-40 rounded-md bg-muted/70 animate-pulse" />
      <div className="h-28 w-full rounded-xl bg-muted/50 animate-pulse" />
      <div className="h-28 w-full rounded-xl bg-muted/40 animate-pulse" />
    </div>
  );
}

export function DeferredStoreMarketing(props: ComponentProps<typeof StoreMarketingSections>) {
  return (
    <Suspense fallback={<SectionFallback label="Chargement du contenu marketing" />}>
      <StoreMarketingSections {...props} />
    </Suspense>
  );
}

export function DeferredReviewsList(props: ComponentProps<typeof ReviewsList>) {
  return (
    <Suspense fallback={<SectionFallback label="Chargement des avis" />}>
      <ReviewsList {...props} />
    </Suspense>
  );
}

export function DeferredContactForm(props: ComponentProps<typeof ContactForm>) {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-border/60 bg-card/80 p-6">
          <SectionFallback label="Chargement du formulaire de contact" />
        </div>
      }
    >
      <ContactForm {...props} />
    </Suspense>
  );
}

export function DeferredStoreLocationSection(props: ComponentProps<typeof StoreLocationSection>) {
  return (
    <Suspense fallback={<SectionFallback label="Chargement de la localisation" />}>
      <StoreLocationSection {...props} />
    </Suspense>
  );
}
