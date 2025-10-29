/**
 * Index d'export pour les composants de cours
 * Facilite les imports dans toute l'application
 * Date : 29 octobre 2025
 * Dernière mise à jour : Phase 3 - Courses System (Jour 1)
 */

// Création de cours
export { CreateCourseWizard } from './create/CreateCourseWizard';
export { CourseBasicInfoForm } from './create/CourseBasicInfoForm';
export { CourseCurriculumBuilder } from './create/CourseCurriculumBuilder';
export { CourseAdvancedConfig } from './create/CourseAdvancedConfig';
export { VideoUploader } from './create/VideoUploader';

// Affichage de cours
export { CourseCurriculum } from './detail/CourseCurriculum';
export { CourseProgressBar } from './detail/CourseProgressBar';

// Lecteur
export { VideoPlayer } from './player/VideoPlayer';
export { LessonCompletionButton } from './player/LessonCompletionButton';

// Quiz
export { QuizBuilder } from './quiz/QuizBuilder';
export { QuizTaker } from './quiz/QuizTaker';
export { QuizResults } from './quiz/QuizResults';
export { QuizContainer } from './quiz/QuizContainer';

// Certificats
export { CertificateTemplate } from './certificates/CertificateTemplate';
export { CertificateGenerator } from './certificates/CertificateGenerator';

// États partagés
export { 
  LoadingState, 
  ErrorState, 
  EmptyState,
  CourseDetailSkeleton 
} from './shared/CourseLoadingState';

// Marketplace
export { CourseCard } from './marketplace/CourseCard';

// ============================================================
// 🎓 SYSTÈME AVANCÉ COURSES - PHASE 3 (Jour 1)
// ============================================================

// Indicateurs de statut
export { 
  CourseStatusIndicator,
  type CourseStatus,
  type CourseStatusVariant,
  type CourseStatusIndicatorProps
} from './CourseStatusIndicator';

// Affichage des inscriptions
export { 
  EnrollmentInfoDisplay,
  type EnrollmentStatus,
  type EnrollmentInfoVariant,
  type EnrollmentStudent,
  type EnrollmentCourse,
  type EnrollmentInfoDisplayProps
} from './EnrollmentInfoDisplay';

// Gestion des listes de cours
export {
  CoursesList,
  type CourseCategory,
  type CourseSortField,
  type SortDirection,
  type CourseListItem,
  type CoursesListProps
} from './CoursesList';

// Gestion des packages
export {
  CoursePackageManager,
  type PackageType,
  type DiscountType,
  type PackageCourse,
  type PackageTier,
  type CoursePackage,
  type CoursePackageManagerProps
} from './CoursePackageManager';

// Historique des inscriptions
export {
  EnrollmentHistory,
  type EnrollmentEventType,
  type EnrollmentEvent,
  type PeriodFilter,
  type EnrollmentHistoryProps
} from './EnrollmentHistory';

// Mise à jour groupée
export {
  BulkCourseUpdate,
  type BulkUpdateField,
  type UpdateMode,
  type BulkUpdateCourse,
  type BulkUpdateChange,
  type BulkCourseUpdateProps
} from './BulkCourseUpdate';

// Gestion de la progression
export {
  StudentProgressManager,
  type ProgressMilestone,
  type CompletedLesson,
  type ProgressStats,
  type StudentProgressManagerProps
} from './StudentProgressManager';

// Contrôle d'accès
export {
  CourseAccessManager,
  type DripContentType,
  type AccessControlledLesson,
  type CoursePrerequisite,
  type GeoRestriction,
  type AccessConfig,
  type CourseAccessManagerProps
} from './CourseAccessManager';

// Bundles de cours
export {
  CourseBundleBuilder,
  type BundleCourse,
  type BundleDiscountType,
  type CourseBundle,
  type AvailableCourse,
  type CourseBundleBuilderProps
} from './CourseBundleBuilder';

// Dashboards
export {
  CoursesDashboard,
  type DashboardStats,
  type PopularCourse,
  type RecentActivity,
  type CategoryPerformance,
  type CoursesDashboardProps
} from './CoursesDashboard';

export {
  StudentsDashboard,
  type StudentDashboardStats,
  type TopStudent,
  type AtRiskStudent,
  type StudentEngagement,
  type StudentLifecycle,
  type StudentsDashboardProps
} from './StudentsDashboard';

