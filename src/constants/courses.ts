/**
 * Constantes pour le système de cours
 * Date : 27 octobre 2025
 * Amélioration : Configuration centralisée
 */

// Niveaux de cours
export const COURSE_LEVELS = [
  { value: 'beginner', label: 'Débutant', description: 'Aucune expérience requise' },
  { value: 'intermediate', label: 'Intermédiaire', description: 'Connaissances de base requises' },
  { value: 'advanced', label: 'Avancé', description: 'Expérience significative requise' },
  { value: 'expert', label: 'Expert', description: 'Niveau professionnel' },
] as const;

// Langues supportées
export const COURSE_LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'ar', label: 'Arabe' },
  { value: 'pt', label: 'Portugais' },
] as const;

// Catégories de cours
export const COURSE_CATEGORIES = [
  { value: 'programming', label: 'Programmation', icon: '💻' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'marketing', label: 'Marketing', icon: '📊' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'photography', label: 'Photographie', icon: '📷' },
  { value: 'music', label: 'Musique', icon: '🎵' },
  { value: 'languages', label: 'Langues', icon: '🗣️' },
  { value: 'health', label: 'Santé & Bien-être', icon: '🧘' },
  { value: 'cooking', label: 'Cuisine', icon: '👨‍🍳' },
  { value: 'other', label: 'Autre', icon: '📚' },
] as const;

// Types de vidéos
export const VIDEO_TYPES = [
  { 
    value: 'upload', 
    label: 'Upload direct', 
    description: 'Hébergé sur notre plateforme',
    icon: '📤'
  },
  { 
    value: 'youtube', 
    label: 'YouTube', 
    description: 'Lien vers une vidéo YouTube',
    icon: '📺'
  },
  { 
    value: 'vimeo', 
    label: 'Vimeo', 
    description: 'Lien vers une vidéo Vimeo',
    icon: '🎥'
  },
  { 
    value: 'google-drive', 
    label: 'Google Drive', 
    description: 'Lien vers Google Drive',
    icon: '☁️'
  },
] as const;

// Types de questions quiz
export const QUIZ_QUESTION_TYPES = [
  { 
    value: 'multiple_choice', 
    label: 'QCM (Choix multiple)', 
    description: '4 options, 1 réponse correcte',
    icon: '☑️'
  },
  { 
    value: 'true_false', 
    label: 'Vrai/Faux', 
    description: '2 options',
    icon: '✓✗'
  },
  { 
    value: 'text', 
    label: 'Réponse textuelle', 
    description: 'Réponse libre',
    icon: '✍️'
  },
] as const;

// Limites
export const COURSE_LIMITS = {
  MIN_TITLE_LENGTH: 10,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_SHORT_DESCRIPTION_LENGTH: 20,
  MAX_SHORT_DESCRIPTION_LENGTH: 200,
  MIN_SECTIONS: 1,
  MAX_SECTIONS: 50,
  MIN_LESSONS_PER_SECTION: 1,
  MAX_LESSONS_PER_SECTION: 100,
  MIN_OBJECTIVES: 3,
  MAX_OBJECTIVES: 10,
  MIN_PREREQUISITES: 0,
  MAX_PREREQUISITES: 10,
  MIN_TARGET_AUDIENCE: 0,
  MAX_TARGET_AUDIENCE: 5,
  MIN_QUIZ_QUESTIONS: 3,
  MAX_QUIZ_QUESTIONS: 50,
  MAX_VIDEO_SIZE_MB: 500,
  MIN_PASSING_SCORE: 50,
  MAX_PASSING_SCORE: 100,
  DEFAULT_PASSING_SCORE: 70,
  MIN_TIME_LIMIT: 5,
  MAX_TIME_LIMIT: 180,
} as const;

// Messages de progression
export const PROGRESS_MESSAGES = {
  0: "Commencez votre apprentissage !",
  25: "Vous venez de commencer, continuez comme ça !",
  50: "Bon début ! Vous êtes sur la bonne voie.",
  75: "Plus de la moitié ! Vous y êtes presque.",
  100: "Cours terminé ! 🎉",
} as const;

// Configuration du certificat
export const CERTIFICATE_CONFIG = {
  WIDTH: 1000,
  HEIGHT: 707, // Ratio A4 (1.414:1)
  BORDER_COLOR: '#ea580c', // orange-600
  FONT_FAMILY: 'Arial, sans-serif',
  PREFIX: 'CERT',
} as const;

// URLs de vidéos par défaut (placeholders)
export const VIDEO_PLACEHOLDERS = {
  upload: '/placeholder-video.jpg',
  youtube: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  vimeo: '/placeholder-video.jpg',
  'google-drive': '/placeholder-video.jpg',
} as const;

// Temps de sauvegarde automatique (en ms)
export const AUTO_SAVE_INTERVALS = {
  VIDEO_POSITION: 10000, // 10 secondes
  QUIZ_DRAFT: 30000, // 30 secondes
  COURSE_DRAFT: 60000, // 1 minute
} as const;

// Formats de date
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  FULL: 'EEEE dd MMMM yyyy à HH:mm',
} as const;

// Statuts d'enrollment
export const ENROLLMENT_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
} as const;

// Messages de validation
export const VALIDATION_MESSAGES = {
  TITLE_TOO_SHORT: `Le titre doit contenir au moins ${COURSE_LIMITS.MIN_TITLE_LENGTH} caractères`,
  TITLE_TOO_LONG: `Le titre ne peut pas dépasser ${COURSE_LIMITS.MAX_TITLE_LENGTH} caractères`,
  DESCRIPTION_TOO_SHORT: `La description doit contenir au moins ${COURSE_LIMITS.MIN_DESCRIPTION_LENGTH} caractères`,
  DESCRIPTION_TOO_LONG: `La description ne peut pas dépasser ${COURSE_LIMITS.MAX_DESCRIPTION_LENGTH} caractères`,
  INVALID_SLUG: 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
  INVALID_VIDEO_URL: 'URL de vidéo invalide',
  INSUFFICIENT_OBJECTIVES: `Ajoutez au moins ${COURSE_LIMITS.MIN_OBJECTIVES} objectifs d'apprentissage`,
  NO_SECTIONS: 'Ajoutez au moins une section au cours',
  NO_LESSONS: 'Ajoutez au moins une leçon à chaque section',
  INVALID_PRICE: 'Le prix doit être un nombre positif',
  INVALID_PASSING_SCORE: `Le score de réussite doit être entre ${COURSE_LIMITS.MIN_PASSING_SCORE}% et ${COURSE_LIMITS.MAX_PASSING_SCORE}%`,
} as const;

// Export des types
export type CourseLevel = typeof COURSE_LEVELS[number]['value'];
export type CourseLanguage = typeof COURSE_LANGUAGES[number]['value'];
export type CourseCategory = typeof COURSE_CATEGORIES[number]['value'];
export type VideoType = typeof VIDEO_TYPES[number]['value'];
export type QuizQuestionType = typeof QUIZ_QUESTION_TYPES[number]['value'];
export type EnrollmentStatus = typeof ENROLLMENT_STATUSES[keyof typeof ENROLLMENT_STATUSES];

