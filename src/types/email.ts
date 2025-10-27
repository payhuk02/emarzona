/**
 * Types TypeScript pour le système d'Email Marketing Universel
 * Date : 27 octobre 2025
 * Supporte: Digital, Physical, Service, Course
 */

export type ProductType = 'digital' | 'physical' | 'service' | 'course';

export type EmailCategory = 'transactional' | 'marketing' | 'notification';

export type SendGridStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

export type EmailFrequency = 'real-time' | 'daily' | 'weekly';

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  category: EmailCategory;
  product_type: ProductType | null; // null = universel
  
  // Contenu multilingue
  subject: { [key: string]: string }; // {"fr": "...", "en": "..."}
  html_content: { [key: string]: string };
  text_content?: { [key: string]: string };
  
  // Variables
  variables: string[]; // ["{{user_name}}", "{{order_id}}"]
  
  // SendGrid
  sendgrid_template_id?: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
  
  // Statut
  is_active: boolean;
  is_default: boolean;
  
  // Stats
  sent_count: number;
  open_rate: number;
  click_rate: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailLog {
  id: string;
  
  // Template
  template_id?: string;
  template_slug: string;
  
  // Destinataire
  recipient_email: string;
  recipient_name?: string;
  user_id?: string;
  
  // Contenu
  subject: string;
  html_content?: string;
  text_content?: string;
  
  // Contexte métier (universel)
  product_type?: ProductType;
  product_id?: string;
  product_name?: string;
  order_id?: string;
  store_id?: string;
  
  // Variables utilisées
  variables: { [key: string]: any };
  
  // SendGrid
  sendgrid_message_id?: string;
  sendgrid_status: SendGridStatus;
  
  // Tracking
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  
  // Stats
  open_count: number;
  click_count: number;
  
  // Erreurs
  error_message?: string;
  error_code?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EmailPreferences {
  id: string;
  user_id: string;
  
  // Préférences globales
  transactional_emails: boolean; // Toujours true (légal)
  marketing_emails: boolean;
  notification_emails: boolean;
  
  // Préférences spécifiques
  order_updates: boolean;
  product_updates: boolean;
  promotional_emails: boolean;
  newsletter: boolean;
  
  // Fréquence
  email_frequency: EmailFrequency;
  
  // Langue
  preferred_language: string; // 'fr' | 'en' | 'es' | 'pt'
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================================
// INTERFACES POUR L'ENVOI D'EMAILS
// ============================================================

export interface SendEmailPayload {
  // Template
  templateSlug: string;
  
  // Destinataire
  to: string;
  toName?: string;
  userId?: string;
  
  // Variables dynamiques
  variables: { [key: string]: any };
  
  // Contexte métier (optionnel)
  productType?: ProductType;
  productId?: string;
  productName?: string;
  orderId?: string;
  storeId?: string;
  
  // Langue (auto-détecté si non fourni)
  language?: string;
  
  // Options avancées
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64
  type: string; // MIME type
  disposition?: 'attachment' | 'inline';
}

// ============================================================
// INTERFACES POUR LES TEMPLATES PAR TYPE DE PRODUIT
// ============================================================

// Digital Product
export interface DigitalProductEmailVariables {
  user_name: string;
  order_id: string;
  product_name: string;
  download_link: string;
  file_format?: string;
  file_size?: string;
  access_expires?: string;
}

// Physical Product
export interface PhysicalProductEmailVariables {
  user_name: string;
  order_id: string;
  product_name: string;
  shipping_address: string;
  delivery_date: string;
  tracking_number?: string;
  tracking_link?: string;
  shipping_carrier?: string;
}

// Service
export interface ServiceEmailVariables {
  user_name: string;
  order_id: string;
  service_name: string;
  booking_date: string;
  booking_time: string;
  booking_link?: string;
  provider_name?: string;
  provider_contact?: string;
}

// Course
export interface CourseEmailVariables {
  user_name: string;
  course_name: string;
  enrollment_date: string;
  course_link: string;
  instructor_name: string;
  course_duration?: string;
  certificate_available?: boolean;
}

// ============================================================
// TYPES POUR SENDGRID
// ============================================================

export interface SendGridEmailRequest {
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>;
    subject: string;
    dynamic_template_data?: { [key: string]: any };
  }>;
  from: { email: string; name: string };
  reply_to?: { email: string; name?: string };
  template_id?: string;
  content?: Array<{ type: string; value: string }>;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
  tracking_settings?: {
    click_tracking: { enable: boolean };
    open_tracking: { enable: boolean };
  };
  custom_args?: { [key: string]: string };
}

export interface SendGridResponse {
  statusCode: number;
  headers: { [key: string]: string };
  body?: string;
}

export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe';
  sg_message_id: string;
  url?: string; // Pour les clics
  reason?: string; // Pour les bounces
}

