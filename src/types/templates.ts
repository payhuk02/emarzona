/**
 * Template System Types
 * Système professionnel de templates pour les 4 types de produits
 */

export type ProductType = 'digital' | 'physical' | 'service' | 'course';

export type TemplateCategory = 
  // Digital
  | 'ebook'
  | 'software'
  | 'music'
  | 'design'
  | 'photo'
  // Physical
  | 'fashion'
  | 'electronics'
  | 'cosmetics'
  | 'furniture'
  | 'food'
  // Service
  | 'consulting'
  | 'repair'
  | 'event'
  | 'wellness'
  | 'training'
  // Course
  | 'technical'
  | 'academic'
  | 'video'
  | 'masterclass'
  | 'bootcamp';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  productType: ProductType;
  author: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  downloads: number;
  rating: number;
  thumbnail: string;
  preview_images: string[];
  tags: string[];
  premium: boolean;
  price?: number;
}

export interface TemplateData {
  // Informations de base
  basicInfo: {
    name_template?: string;
    description_template?: string;
    short_description_template?: string;
    category?: string;
    pricing_model?: 'one_time' | 'subscription' | 'free';
    price?: number;
    currency?: string;
    features?: string[];
    specifications?: Record<string, any>[];
  };

  // Visuels
  visuals: {
    image_placeholders?: string[];
    gallery_placeholders?: string[];
    video_url_template?: string;
  };

  // SEO
  seo: {
    meta_title_template?: string;
    meta_description_template?: string;
    meta_keywords?: string[];
    og_settings?: {
      title?: string;
      description?: string;
    };
  };

  // FAQs
  faqs?: Array<{
    question: string;
    answer: string;
  }>;

  // Champs personnalisés par type
  customFields?: Record<string, any>;

  // Digital specific
  digital?: {
    file_types?: string[];
    license_type?: 'single' | 'multi' | 'unlimited';
    download_limit?: number;
    drm_enabled?: boolean;
  };

  // Physical specific
  physical?: {
    variants?: Array<{
      name: string;
      options: string[];
    }>;
    shipping_required?: boolean;
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: string;
    };
    inventory?: {
      track_quantity?: boolean;
      low_stock_threshold?: number;
    };
  };

  // Service specific
  service?: {
    duration?: number;
    duration_unit?: 'minutes' | 'hours' | 'days';
    booking_type?: 'appointment' | 'instant' | 'flexible';
    max_attendees?: number;
    location_type?: 'online' | 'physical' | 'both';
    cancellation_policy?: string;
  };

  // Course specific
  course?: {
    level?: 'beginner' | 'intermediate' | 'advanced' | 'all';
    language?: string;
    duration_hours?: number;
    certificate_enabled?: boolean;
    curriculum_structure?: {
      sections_count?: number;
      lessons_per_section?: number;
      total_videos?: number;
      total_quizzes?: number;
    };
    learning_objectives?: string[];
    prerequisites?: string[];
    target_audience?: string[];
  };

  // Affiliation
  affiliate?: {
    enabled?: boolean;
    commission_rate?: number;
    commission_type?: 'percentage' | 'fixed';
  };

  // Tracking
  tracking?: {
    pixels_enabled?: boolean;
    analytics_enabled?: boolean;
    events?: string[];
  };
}

export interface Template {
  metadata: TemplateMetadata;
  data: TemplateData;
}

export interface TemplateFilter {
  productType?: ProductType;
  category?: TemplateCategory;
  premium?: boolean;
  search?: string;
  tags?: string[];
  minRating?: number;
}

export interface TemplatePreview {
  template: Template;
  isLoading: boolean;
  error?: string;
}

// Types pour l'import/export
export interface ExportedTemplate {
  version: '1.0';
  exportedAt: string;
  template: Template;
}

export interface ImportResult {
  success: boolean;
  template?: Template;
  errors?: string[];
  warnings?: string[];
}

