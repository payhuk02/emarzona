/**
 * Index d'export pour les composants de cours
 * Facilite les imports dans toute l'application
 * Date : 27 octobre 2025
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

