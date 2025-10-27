/**
 * Types TypeScript pour le système de Reviews & Ratings
 * Date : 27 octobre 2025
 * Universel : Digital, Physical, Service, Course
 */

import type { ProductType } from './product';

export interface Review {
  id: string;
  
  // Relations
  product_id: string;
  user_id: string;
  order_id?: string;
  
  // Contenu
  rating: number; // 1-5
  title?: string;
  content: string;
  
  // Type produit
  product_type: ProductType;
  
  // Ratings détaillés (optionnels)
  quality_rating?: number;
  value_rating?: number;
  service_rating?: number;
  delivery_rating?: number; // Pour physical
  course_content_rating?: number; // Pour courses
  instructor_rating?: number; // Pour courses
  
  // Metadata
  verified_purchase: boolean;
  is_featured: boolean;
  is_approved: boolean;
  is_flagged: boolean;
  
  // Stats
  helpful_count: number;
  not_helpful_count: number;
  reply_count: number;
  
  // Reviewer info
  reviewer_name?: string;
  reviewer_avatar?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations chargées (optionnel)
  replies?: ReviewReply[];
  media?: ReviewMedia[];
  user_vote?: ReviewVote;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  reply_type: 'seller' | 'admin' | 'customer';
  is_official: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations chargées (optionnel)
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ReviewVote {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
}

export interface ReviewMedia {
  id: string;
  review_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  media_thumbnail_url?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  display_order: number;
  created_at: string;
}

export interface ProductReviewStats {
  product_id: string;
  
  // Stats globales
  total_reviews: number;
  average_rating: number;
  
  // Distribution des notes
  rating_5_count: number;
  rating_4_count: number;
  rating_3_count: number;
  rating_2_count: number;
  rating_1_count: number;
  
  // Ratings détaillés moyens
  avg_quality_rating?: number;
  avg_value_rating?: number;
  avg_service_rating?: number;
  avg_delivery_rating?: number;
  avg_course_content_rating?: number;
  avg_instructor_rating?: number;
  
  // Stats supplémentaires
  verified_purchases_count: number;
  featured_reviews_count: number;
  
  // Timestamp
  last_updated: string;
}

// ============================================================
// INTERFACES POUR L'UI
// ============================================================

export interface CreateReviewPayload {
  product_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  content: string;
  product_type: ProductType;
  
  // Ratings détaillés (optionnels)
  quality_rating?: number;
  value_rating?: number;
  service_rating?: number;
  delivery_rating?: number;
  course_content_rating?: number;
  instructor_rating?: number;
  
  // Media
  media_files?: File[];
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  content?: string;
  quality_rating?: number;
  value_rating?: number;
  service_rating?: number;
  delivery_rating?: number;
  course_content_rating?: number;
  instructor_rating?: number;
}

export interface ReviewFilters {
  rating?: number; // Filtrer par note spécifique
  min_rating?: number; // Note minimale
  verified_only?: boolean; // Seulement achats vérifiés
  has_media?: boolean; // Avec photos/vidéos
  sort_by?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  limit?: number;
  offset?: number;
}

export interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verified_percentage: number;
  recommendation_rate: number; // % de notes 4-5
}

// ============================================================
// TYPES SPÉCIFIQUES PAR PRODUIT
// ============================================================

export interface DigitalProductReview extends Review {
  product_type: 'digital';
  quality_rating?: number;
  value_rating?: number;
}

export interface PhysicalProductReview extends Review {
  product_type: 'physical';
  quality_rating?: number;
  value_rating?: number;
  delivery_rating?: number;
}

export interface ServiceReview extends Review {
  product_type: 'service';
  quality_rating?: number;
  value_rating?: number;
  service_rating?: number;
}

export interface CourseReview extends Review {
  product_type: 'course';
  course_content_rating?: number;
  instructor_rating?: number;
  value_rating?: number;
}

// ============================================================
// HELPERS
// ============================================================

export const RATING_LABELS: Record<number, string> = {
  5: 'Excellent',
  4: 'Très bon',
  3: 'Moyen',
  2: 'Médiocre',
  1: 'Très mauvais',
};

export const getDetailedRatingFields = (productType: ProductType): string[] => {
  switch (productType) {
    case 'digital':
      return ['quality_rating', 'value_rating'];
    case 'physical':
      return ['quality_rating', 'value_rating', 'delivery_rating'];
    case 'service':
      return ['quality_rating', 'value_rating', 'service_rating'];
    case 'course':
      return ['course_content_rating', 'instructor_rating', 'value_rating'];
    default:
      return [];
  }
};

export const getDetailedRatingLabel = (field: string): string => {
  const labels: Record<string, string> = {
    quality_rating: 'Qualité',
    value_rating: 'Rapport qualité/prix',
    service_rating: 'Service',
    delivery_rating: 'Livraison',
    course_content_rating: 'Contenu du cours',
    instructor_rating: 'Instructeur',
  };
  return labels[field] || field;
};

