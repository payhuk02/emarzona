/**
 * Types stricts pour le formulaire de création de cours en ligne
 * Date: 31 Janvier 2025
 * 
 * Remplace les types `any` dans CreateCourseWizard
 */

export interface CourseLesson {
  id?: string;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  video_duration?: number;
  order_index: number;
  is_preview?: boolean;
  resources?: Array<{
    id?: string;
    name: string;
    url: string;
    type: string;
  }>;
}

export interface CourseSection {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: CourseLesson[];
  isOpen?: boolean;
}

export interface CourseFormData {
  // Informations de base
  title: string;
  slug: string;
  short_description: string;
  description: string;
  level: string;
  language: string;
  category: string;
  
  // Images
  image_url: string;
  images: string[];
  
  // Configuration
  price: number;
  currency: string;
  promotional_price?: number;
  pricing_model: 'one-time' | 'subscription' | 'lifetime';
  create_free_preview: boolean;
  preview_content_description: string;
  licensing_type: 'standard' | 'plr' | 'copyrighted';
  license_terms: string;
  certificate_enabled: boolean;
  certificate_passing_score: number;
  learning_objectives: string[];
  prerequisites: string[];
  target_audience: string[];
  
  // Store ID
  store_id?: string;
}

/**
 * Type pour les mises à jour partielles du formulaire
 */
export type CourseFormDataUpdate = Partial<CourseFormData> & {
  [key: string]: unknown; // Pour permettre les mises à jour dynamiques
};

