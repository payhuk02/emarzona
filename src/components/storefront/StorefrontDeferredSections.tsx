import { lazy, Suspense, type ComponentProps } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-3 py-4" aria-busy="true" aria-label={label}>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
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
        <Card>
          <CardContent className="pt-6">
            <SectionFallback label="Chargement du formulaire de contact" />
          </CardContent>
        </Card>
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
