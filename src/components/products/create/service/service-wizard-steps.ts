import { lazy } from 'react';

export const LazyServiceBasicInfoForm = lazy(() =>
  import('./ServiceBasicInfoForm').then(m => ({ default: m.ServiceBasicInfoForm }))
);
export const LazyServiceDurationAvailabilityForm = lazy(() =>
  import('./ServiceDurationAvailabilityForm').then(m => ({
    default: m.ServiceDurationAvailabilityForm,
  }))
);
export const LazyServiceStaffResourcesForm = lazy(() =>
  import('./ServiceStaffResourcesForm').then(m => ({ default: m.ServiceStaffResourcesForm }))
);
export const LazyServicePricingOptionsForm = lazy(() =>
  import('./ServicePricingOptionsForm').then(m => ({ default: m.ServicePricingOptionsForm }))
);
export const LazyServiceAffiliateSettings = lazy(() =>
  import('./ServiceAffiliateSettings').then(m => ({ default: m.ServiceAffiliateSettings }))
);
export const LazyServiceSEOAndFAQs = lazy(() =>
  import('./ServiceSEOAndFAQs').then(m => ({ default: m.ServiceSEOAndFAQs }))
);
export const LazyServicePreview = lazy(() =>
  import('./ServicePreview').then(m => ({ default: m.ServicePreview }))
);
export const LazyPaymentOptionsForm = lazy(() =>
  import('../shared/PaymentOptionsForm').then(m => ({ default: m.PaymentOptionsForm }))
);
export const LazyProductStatisticsDisplaySettings = lazy(() =>
  import('../shared/ProductStatisticsDisplaySettings').then(m => ({
    default: m.ProductStatisticsDisplaySettings,
  }))
);

export function prefetchServiceWizardFirstStep(): void {
  void import('./ServiceBasicInfoForm');
}
