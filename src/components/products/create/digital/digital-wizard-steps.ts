import { lazy } from 'react';

export const LazyDigitalBasicInfoForm = lazy(() =>
  import('./DigitalBasicInfoForm').then(m => ({ default: m.DigitalBasicInfoForm }))
);
export const LazyDigitalFilesUploader = lazy(() =>
  import('./DigitalFilesUploader').then(m => ({ default: m.DigitalFilesUploader }))
);
export const LazyDigitalLicenseConfig = lazy(() =>
  import('./DigitalLicenseConfig').then(m => ({ default: m.DigitalLicenseConfig }))
);
export const LazyDigitalAffiliateSettings = lazy(() =>
  import('./DigitalAffiliateSettings').then(m => ({ default: m.DigitalAffiliateSettings }))
);
export const LazyDigitalPreview = lazy(() =>
  import('./DigitalPreview').then(m => ({ default: m.DigitalPreview }))
);
export const LazyProductSEOForm = lazy(() =>
  import('../shared/ProductSEOForm').then(m => ({ default: m.ProductSEOForm }))
);
export const LazyProductFAQForm = lazy(() =>
  import('../shared/ProductFAQForm').then(m => ({ default: m.ProductFAQForm }))
);
export const LazyProductStatisticsDisplaySettings = lazy(() =>
  import('../shared/ProductStatisticsDisplaySettings').then(m => ({
    default: m.ProductStatisticsDisplaySettings,
  }))
);

export function prefetchDigitalWizardFirstStep(): void {
  void import('./DigitalBasicInfoForm');
}
