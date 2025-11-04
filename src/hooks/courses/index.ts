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

// Hook useGamification
export {
  useStudentPoints,
  useStudentBadges,
  useStudentAchievements,
  useCourseBadges,
  useCourseAchievements,
  usePointsHistory,
  useCourseLeaderboard,
  useAwardPoints,
  useMarkLessonCompleteWithPoints,
  useCreateBadge,
  useCreateAchievement,
  type StudentPoints,
  type CourseBadge,
  type StudentBadge,
  type CourseAchievement,
  type StudentAchievement,
  type PointsHistory,
  type LeaderboardEntry,
} from './useGamification';

// Hook useAssignments
export {
  useCourseAssignments,
  useAssignment,
  useAssignmentSubmissions,
  useStudentAssignmentSubmission,
  useStudentAssignments,
  useAssignmentGradingHistory,
  useCreateAssignment,
  useSubmitAssignment,
  useGradeAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  type CourseAssignment,
  type AssignmentSubmission,
  type AssignmentGrading,
  type CreateAssignmentData,
  type SubmitAssignmentData,
  type GradeAssignmentData,
} from './useAssignments';

// Hook useDripContent
export {
  useCheckSectionUnlock,
  useUnlockedSections,
  useNextUnlockDate,
  useSectionUnlockStatus,
  type SectionUnlockStatus,
  type UnlockedSections,
} from './useDripContent';

// Hook useCourseNotes
export {
  useLessonNotes,
  useCourseNotes,
  useLessonBookmarks,
  useAddNote,
  useUpdateNote,
  useDeleteNote,
  useAddBookmark,
  useDeleteBookmark,
  type CourseNote,
  type CourseBookmark,
  type CreateNoteData,
} from './useCourseNotes';

