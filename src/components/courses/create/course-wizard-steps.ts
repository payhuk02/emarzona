import { lazy } from 'react';

export const LazyCourseBasicInfoForm = lazy(() =>
  import('./CourseBasicInfoForm').then(m => ({ default: m.CourseBasicInfoForm }))
);
export const LazyCourseCurriculumBuilder = lazy(() =>
  import('./CourseCurriculumBuilder').then(m => ({ default: m.CourseCurriculumBuilder }))
);
export const LazyCourseAdvancedConfig = lazy(() =>
  import('./CourseAdvancedConfig').then(m => ({ default: m.CourseAdvancedConfig }))
);
export const LazyCourseSEOForm = lazy(() =>
  import('./CourseSEOForm').then(m => ({ default: m.CourseSEOForm }))
);
export const LazyCourseFAQForm = lazy(() =>
  import('./CourseFAQForm').then(m => ({ default: m.CourseFAQForm }))
);
export const LazyCourseAffiliateSettings = lazy(() =>
  import('./CourseAffiliateSettings').then(m => ({ default: m.CourseAffiliateSettings }))
);
export const LazyCoursePixelsConfig = lazy(() =>
  import('./CoursePixelsConfig').then(m => ({ default: m.CoursePixelsConfig }))
);

export function prefetchCourseWizardFirstStep(): void {
  void import('./CourseBasicInfoForm');
}
