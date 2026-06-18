import { lazy } from 'react';

export const LazyPhysicalBasicInfoForm = lazy(() =>
  import('./PhysicalBasicInfoForm').then(m => ({ default: m.PhysicalBasicInfoForm }))
);
export const LazyPhysicalVariantsBuilder = lazy(() =>
  import('./PhysicalVariantsBuilder').then(m => ({ default: m.PhysicalVariantsBuilder }))
);
export const LazyPhysicalInventoryConfig = lazy(() =>
  import('./PhysicalInventoryConfig').then(m => ({ default: m.PhysicalInventoryConfig }))
);
export const LazyPhysicalShippingConfig = lazy(() =>
  import('./PhysicalShippingConfig').then(m => ({ default: m.PhysicalShippingConfig }))
);
export const LazyPhysicalSizeChartSelector = lazy(() =>
  import('./PhysicalSizeChartSelector').then(m => ({ default: m.PhysicalSizeChartSelector }))
);
export const LazyPhysicalAffiliateSettings = lazy(() =>
  import('./PhysicalAffiliateSettings').then(m => ({ default: m.PhysicalAffiliateSettings }))
);
export const LazyPhysicalSEOAndFAQs = lazy(() =>
  import('./PhysicalSEOAndFAQs').then(m => ({ default: m.PhysicalSEOAndFAQs }))
);
export const LazyPhysicalCheckoutOptionsForm = lazy(() =>
  import('./PhysicalCheckoutOptionsForm').then(m => ({ default: m.PhysicalCheckoutOptionsForm }))
);
export const LazyPhysicalPreview = lazy(() =>
  import('./PhysicalPreview').then(m => ({ default: m.PhysicalPreview }))
);
export const LazyPhysicalWhatsAppContactConfig = lazy(() =>
  import('@/components/physical/PhysicalWhatsAppContactConfig').then(m => ({
    default: m.PhysicalWhatsAppContactConfig,
  }))
);
export const LazyProductStatisticsDisplaySettings = lazy(() =>
  import('../shared/ProductStatisticsDisplaySettings').then(m => ({
    default: m.ProductStatisticsDisplaySettings,
  }))
);

/** Prefetch étape 1 (informations de base). */
export function prefetchPhysicalWizardFirstStep(): void {
  void import('./PhysicalBasicInfoForm');
}
