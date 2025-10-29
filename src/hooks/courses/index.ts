/**
 * Index d'export pour les hooks courses
 * Facilite les imports dans toute l'application
 * 
 * @author Payhuk Team
 * @date 29 Octobre 2025
 */

// Hook useCourses
export {
  useCourses,
  type Course,
  type CourseFormData,
  type CourseFilters,
  type CourseStats,
} from './useCourses';

// Hook useEnrollments
export {
  useEnrollments,
  type Enrollment,
  type EnrollmentCreateData,
  type EnrollmentUpdateData,
  type EnrollmentFilters,
  type EnrollmentStats,
  type ProgressEvent,
} from './useEnrollments';

// Hook useCourseAlerts
export {
  useCourseAlerts,
  type AlertType,
  type AlertSeverity,
  type CourseAlert,
  type AlertConfig,
  type AlertFilters,
} from './useCourseAlerts';

// Hook useCourseReports
export {
  useCourseReports,
  type ReportType,
  type ReportPeriod,
  type ExportFormat,
  type EnrollmentReport,
  type RevenueReport,
  type StudentReport,
  type CompletionReport,
  type ReportConfig,
} from './useCourseReports';

