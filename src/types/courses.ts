// =========================================================
// Types pour le système de cours en ligne (LMS)
// Date : 27/10/2025
// Description : Types TypeScript pour la fonctionnalité Cours
// =========================================================

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
export type VideoType = 'upload' | 'youtube' | 'vimeo' | 'google-drive';
export type DiscussionType = 'question' | 'discussion' | 'announcement';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled' | 'expired';
export type DripType = 'daily' | 'weekly' | 'none';
export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'open_ended';

// ==============================================
// COURSE (Cours principal)
// ==============================================

export interface Course {
  id: string;
  product_id: string;
  
  // Métadonnées
  level: CourseLevel;
  language: string;
  subtitles: string[];
  total_duration_minutes: number;
  total_lessons: number;
  total_quizzes: number;
  total_resources: number;
  
  // Contenu
  learning_objectives: string[];
  prerequisites: string[];
  target_audience: string[];
  
  // Certificat
  certificate_enabled: boolean;
  certificate_template_url?: string;
  certificate_passing_score: number;
  
  // Drip content
  drip_enabled: boolean;
  drip_type: DripType;
  drip_interval: number;
  
  // Settings
  enable_qa: boolean;
  enable_discussions: boolean;
  enable_notes: boolean;
  enable_downloads: boolean;
  auto_play_next: boolean;
  
  // Stats
  total_enrollments: number;
  average_completion_rate: number;
  average_rating: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations (optionnelles)
  product?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    price: number;
    promotional_price?: number;
    currency: string;
    image_url?: string;
    is_active: boolean;
    is_draft: boolean;
    store_id: string;
  };
  sections?: CourseSection[];
  instructor?: InstructorProfile;
}

// ==============================================
// COURSE SECTION (Section/Chapitre)
// ==============================================

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  
  // Drip
  is_locked: boolean;
  unlock_after_days?: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  lessons?: CourseLesson[];
}

// ==============================================
// COURSE LESSON (Leçon)
// ==============================================

export interface CourseLesson {
  id: string;
  section_id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  
  // Vidéo
  video_type: VideoType;
  video_url: string;
  video_duration_seconds: number;
  video_thumbnail_url?: string;
  
  // Contenu additionnel
  transcript?: string;
  notes?: string;
  
  // Ressources
  downloadable_resources: DownloadableResource[];
  
  // Settings
  is_preview: boolean;
  is_required: boolean;
  has_quiz: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  quiz?: CourseQuiz;
  progress?: LessonProgress;
}

export interface DownloadableResource {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  description?: string;
  uploaded_at?: string;
}

// ==============================================
// COURSE QUIZ (Quiz)
// ==============================================

export interface CourseQuiz {
  id: string;
  lesson_id?: string;
  course_id: string;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts?: number;
  time_limit_minutes?: number;
  shuffle_questions: boolean;
  show_correct_answers: boolean;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: QuizOption[];
  correct_option_ids?: string[];
  points: number;
  explanation?: string;
  order_index?: number;
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
}

// ==============================================
// COURSE ENROLLMENT (Inscription étudiant)
// ==============================================

export interface CourseEnrollment {
  id: string;
  course_id: string;
  product_id: string;
  user_id: string;
  order_id?: string;
  
  // Status
  status: EnrollmentStatus;
  enrollment_date: string;
  completion_date?: string;
  
  // Progression
  progress_percentage: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed_lesson_id?: string;
  last_accessed_at?: string;
  
  // Temps
  total_watch_time_minutes: number;
  
  // Certificat
  certificate_earned: boolean;
  certificate_url?: string;
  certificate_issued_at?: string;
  
  // Notes et favoris
  notes: StudentNote[];
  bookmarks: string[];
  
  created_at: string;
  updated_at: string;
  
  // Relations
  course?: Course;
  certificate?: CourseCertificate;
}

export interface StudentNote {
  id: string;
  lesson_id: string;
  timestamp_seconds: number;
  content: string;
  created_at: string;
}

// ==============================================
// LESSON PROGRESS (Progression leçon)
// ==============================================

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  user_id: string;
  
  // Progression
  is_completed: boolean;
  completed_at?: string;
  watch_time_seconds: number;
  last_position_seconds: number;
  times_watched: number;
  
  // Notes
  personal_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// ==============================================
// QUIZ ATTEMPT (Tentative quiz)
// ==============================================

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  enrollment_id: string;
  
  // Résultats
  score: number;
  total_questions: number;
  correct_answers: number;
  passed: boolean;
  
  // Réponses
  answers: Record<string, string>;
  
  // Temps
  started_at: string;
  completed_at: string;
  time_taken_seconds: number;
  
  created_at: string;
}

// ==============================================
// COURSE DISCUSSION (Discussion/Q&A)
// ==============================================

export interface CourseDiscussion {
  id: string;
  course_id: string;
  lesson_id?: string;
  user_id: string;
  
  // Contenu
  title: string;
  content: string;
  
  // Type
  discussion_type: DiscussionType;
  
  // Status
  is_answered: boolean;
  is_pinned: boolean;
  answered_by?: string;
  answered_at?: string;
  
  // Engagement
  upvotes: number;
  replies_count: number;
  
  // Video timestamp
  video_timestamp_seconds?: number;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  replies?: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  is_instructor_reply: boolean;
  is_solution: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// ==============================================
// COURSE CERTIFICATE (Certificat)
// ==============================================

export interface CourseCertificate {
  id: string;
  course_id: string;
  user_id: string;
  enrollment_id: string;
  
  // Certificat
  certificate_number: string;
  certificate_url: string;
  certificate_pdf_url?: string;
  
  // Détails
  student_name: string;
  course_title: string;
  instructor_name: string;
  completion_date: string;
  final_score?: number;
  
  // Validation
  is_valid: boolean;
  revoked: boolean;
  revoked_at?: string;
  revoked_reason?: string;
  
  // Partage
  is_public: boolean;
  
  created_at: string;
}

// ==============================================
// INSTRUCTOR PROFILE (Profil instructeur)
// ==============================================

export interface InstructorProfile {
  id: string;
  user_id: string;
  store_id?: string;
  
  // Profil public
  display_name: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  
  // Expertise
  expertise_areas: string[];
  years_of_experience?: number;
  
  // Réseaux sociaux
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  
  // Stats
  total_students: number;
  total_courses: number;
  average_rating: number;
  total_reviews: number;
  
  // Badges
  is_verified: boolean;
  is_top_instructor: boolean;
  
  created_at: string;
  updated_at: string;
}

// ==============================================
// FORM DATA (Pour les formulaires)
// ==============================================

export interface CourseFormData extends Partial<Course> {
  // Champs additionnels pour le formulaire
}

export interface CourseSectionFormData extends Partial<CourseSection> {
  // Champs additionnels
}

export interface CourseLessonFormData extends Partial<CourseLesson> {
  // Champs additionnels
  video_file?: File;
}

export interface CourseQuizFormData extends Partial<CourseQuiz> {
  // Champs additionnels
}

export interface DiscussionFormData {
  title: string;
  content: string;
  discussion_type: DiscussionType;
  lesson_id?: string;
  video_timestamp_seconds?: number;
}

export interface ReplyFormData {
  content: string;
}

// ==============================================
// STATS & ANALYTICS
// ==============================================

export interface CourseStats {
  total_students: number;
  active_students: number;
  completed_students: number;
  average_progress: number;
  average_completion_time_days: number;
  total_watch_time_hours: number;
  average_quiz_score: number;
  total_discussions: number;
  total_questions_answered: number;
  retention_rate: number;
}

export interface LessonStats {
  lesson_id: string;
  lesson_title: string;
  total_views: number;
  average_watch_time: number;
  completion_rate: number;
  average_rewatch_count: number;
  drop_off_rate: number;
}

// ==============================================
// FILTERS & SEARCH
// ==============================================

export interface CourseFilters {
  search?: string;
  level?: CourseLevel;
  language?: string;
  min_rating?: number;
  max_price?: number;
  min_price?: number;
  duration_min?: number;
  duration_max?: number;
  has_certificate?: boolean;
  is_free?: boolean;
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
}

// ==============================================
// API RESPONSES
// ==============================================

export interface CreateCourseResponse {
  success: boolean;
  course?: Course;
  error?: string;
}

export interface EnrollmentResponse {
  success: boolean;
  enrollment?: CourseEnrollment;
  error?: string;
}

export interface QuizSubmissionResponse {
  success: boolean;
  attempt?: QuizAttempt;
  passed: boolean;
  score: number;
  correct_answers: number;
  error?: string;
}

export interface CertificateGenerationResponse {
  success: boolean;
  certificate?: CourseCertificate;
  pdf_url?: string;
  error?: string;
}

