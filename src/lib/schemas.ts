import { z } from 'zod';
import { isValidEmail, isValidPhone, isValidAmount, isValidUrl } from '@/lib/validation';

/**
 * Schémas de validation Zod pour les formulaires
 */

// Schéma pour les produits
export const productSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .refine(val => val.trim().length > 0, 'Le nom est requis'),
  
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),
  
  price: z.number()
    .positive('Le prix doit être positif')
    .max(1000000, 'Le prix ne peut pas dépasser 1,000,000')
    .refine(isValidAmount, 'Montant invalide'),
  
  currency: z.string()
    .length(3, 'La devise doit contenir 3 caractères')
    .regex(/^[A-Z]{3}$/, 'Format de devise invalide'),
  
  slug: z.string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide'),
  
  image_url: z.string()
    .url('URL d\'image invalide')
    .optional()
    .or(z.literal('')),
  
  category: z.string()
    .min(2, 'La catégorie doit contenir au moins 2 caractères')
    .max(50, 'La catégorie ne peut pas dépasser 50 caractères')
    .optional(),

  // Licensing: standard | plr | copyrighted
  licensing_type: z.enum(['standard', 'plr', 'copyrighted']).optional(),
  license_terms: z.string().max(2000, 'Les conditions ne peuvent pas dépasser 2000 caractères').optional().or(z.literal('')),
});

// Schéma pour les commandes
export const orderSchema = z.object({
  customer_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  
  customer_email: z.string()
    .email('Email invalide')
    .refine(isValidEmail, 'Format d\'email invalide'),
  
  customer_phone: z.string()
    .optional()
    .refine(val => !val || isValidPhone(val), 'Numéro de téléphone invalide'),
  
  total_amount: z.number()
    .positive('Le montant doit être positif')
    .refine(isValidAmount, 'Montant invalide'),
  
  currency: z.string()
    .length(3, 'La devise doit contenir 3 caractères')
    .regex(/^[A-Z]{3}$/, 'Format de devise invalide'),
  
  notes: z.string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional(),
});

// ============================================
// SCHÉMAS POUR LES BOUTIQUES
// ============================================

// Schéma pour les horaires d'ouverture
const openingHoursSchema = z.object({
  monday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  tuesday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  wednesday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  thursday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  friday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  saturday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  sunday: z.object({
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
  }),
  timezone: z.string().optional(),
  special_hours: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
    open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM)'),
    closed: z.boolean(),
    reason: z.string().max(200, 'La raison ne peut pas dépasser 200 caractères').optional(),
  })).optional(),
}).optional().nullable();

// Schéma pour les pages légales
const legalPagesSchema = z.object({
  terms_of_service: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  privacy_policy: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  return_policy: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  shipping_policy: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  refund_policy: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  cookie_policy: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  disclaimer: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
  faq_content: z.string().max(50000, 'Le contenu ne peut pas dépasser 50000 caractères').optional(),
}).optional().nullable();

// Schéma complet pour les boutiques
export const storeSchema = z.object({
  // Informations de base
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim()
    .refine(val => val.length > 0, 'Le nom est requis'),
  
  slug: z.string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit contenir uniquement des lettres minuscules, des chiffres et des tirets')
    .refine(val => !val.includes('--'), 'Le slug ne peut pas contenir deux tirets consécutifs'),
  
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .or(z.literal('')),
  
  about: z.string()
    .max(10000, 'Le texte "À propos" ne peut pas dépasser 10000 caractères')
    .optional()
    .or(z.literal('')),
  
  default_currency: z.string()
    .length(3, 'La devise doit contenir 3 caractères (ex: XOF, EUR, USD)')
    .regex(/^[A-Z]{3}$/, 'Format de devise invalide (majuscules uniquement)')
    .default('XOF'),
  
  // Images
  logo_url: z.string()
    .url('URL du logo invalide')
    .optional()
    .or(z.literal('')),
  
  banner_url: z.string()
    .url('URL de la bannière invalide')
    .optional()
    .or(z.literal('')),
  
  favicon_url: z.string()
    .url('URL du favicon invalide')
    .optional()
    .or(z.literal('')),
  
  apple_touch_icon_url: z.string()
    .url('URL de l\'icône Apple Touch invalide')
    .optional()
    .or(z.literal('')),
  
  watermark_url: z.string()
    .url('URL du filigrane invalide')
    .optional()
    .or(z.literal('')),
  
  placeholder_image_url: z.string()
    .url('URL de l\'image placeholder invalide')
    .optional()
    .or(z.literal('')),
  
  // Contact principal
  contact_email: z.string()
    .email('Format d\'email invalide')
    .refine(val => !val || isValidEmail(val), 'Format d\'email invalide')
    .optional()
    .or(z.literal('')),
  
  contact_phone: z.string()
    .max(20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères')
    .refine(val => !val || isValidPhone(val), 'Format de téléphone invalide (ex: +226 XX XX XX XX)')
    .optional()
    .or(z.literal('')),
  
  // Contacts supplémentaires
  support_email: z.string()
    .email('Format d\'email invalide')
    .optional()
    .or(z.literal('')),
  
  sales_email: z.string()
    .email('Format d\'email invalide')
    .optional()
    .or(z.literal('')),
  
  press_email: z.string()
    .email('Format d\'email invalide')
    .optional()
    .or(z.literal('')),
  
  partnership_email: z.string()
    .email('Format d\'email invalide')
    .optional()
    .or(z.literal('')),
  
  support_phone: z.string()
    .max(20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères')
    .refine(val => !val || isValidPhone(val), 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  
  sales_phone: z.string()
    .max(20, 'Le numéro de téléphone ne peut pas dépasser 20 caractères')
    .refine(val => !val || isValidPhone(val), 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
  
  whatsapp_number: z.string()
    .max(20, 'Le numéro WhatsApp ne peut pas dépasser 20 caractères')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Format de numéro WhatsApp invalide (ex: +226 XX XX XX XX)')
    .optional()
    .or(z.literal('')),
  
  telegram_username: z.string()
    .max(32, 'Le nom d\'utilisateur Telegram ne peut pas dépasser 32 caractères')
    .regex(/^[a-zA-Z0-9_]+$/, 'Le nom d\'utilisateur Telegram ne peut contenir que des lettres, chiffres et underscores')
    .optional()
    .or(z.literal('')),
  
  // Réseaux sociaux
  facebook_url: z.string()
    .url('URL Facebook invalide (ex: https://facebook.com/votre-page)')
    .refine(val => !val || val.includes('facebook.com'), 'Doit être une URL Facebook valide')
    .optional()
    .or(z.literal('')),
  
  instagram_url: z.string()
    .url('URL Instagram invalide (ex: https://instagram.com/votre-compte)')
    .refine(val => !val || val.includes('instagram.com'), 'Doit être une URL Instagram valide')
    .optional()
    .or(z.literal('')),
  
  twitter_url: z.string()
    .url('URL Twitter/X invalide (ex: https://twitter.com/votre-compte)')
    .refine(val => !val || val.includes('twitter.com') || val.includes('x.com'), 'Doit être une URL Twitter/X valide')
    .optional()
    .or(z.literal('')),
  
  linkedin_url: z.string()
    .url('URL LinkedIn invalide (ex: https://linkedin.com/company/votre-entreprise)')
    .refine(val => !val || val.includes('linkedin.com'), 'Doit être une URL LinkedIn valide')
    .optional()
    .or(z.literal('')),
  
  youtube_url: z.string()
    .url('URL YouTube invalide (ex: https://youtube.com/@votre-chaine)')
    .refine(val => !val || val.includes('youtube.com'), 'Doit être une URL YouTube valide')
    .optional()
    .or(z.literal('')),
  
  tiktok_url: z.string()
    .url('URL TikTok invalide (ex: https://tiktok.com/@votre-compte)')
    .refine(val => !val || val.includes('tiktok.com'), 'Doit être une URL TikTok valide')
    .optional()
    .or(z.literal('')),
  
  pinterest_url: z.string()
    .url('URL Pinterest invalide (ex: https://pinterest.com/votre-compte)')
    .refine(val => !val || val.includes('pinterest.com'), 'Doit être une URL Pinterest valide')
    .optional()
    .or(z.literal('')),
  
  snapchat_url: z.string()
    .url('URL Snapchat invalide (ex: https://snapchat.com/add/votre-compte)')
    .optional()
    .or(z.literal('')),
  
  discord_url: z.string()
    .url('URL Discord invalide (ex: https://discord.gg/votre-serveur)')
    .optional()
    .or(z.literal('')),
  
  twitch_url: z.string()
    .url('URL Twitch invalide (ex: https://twitch.tv/votre-compte)')
    .refine(val => !val || val.includes('twitch.tv'), 'Doit être une URL Twitch valide')
    .optional()
    .or(z.literal('')),
  
  // Thème et couleurs
  primary_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide (ex: #3b82f6)')
    .optional()
    .or(z.literal('')),
  
  secondary_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide (ex: #10b981)')
    .optional()
    .or(z.literal('')),
  
  accent_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide (ex: #f59e0b)')
    .optional()
    .or(z.literal('')),
  
  background_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide (ex: #ffffff)')
    .optional()
    .or(z.literal('')),
  
  text_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide (ex: #1f2937)')
    .optional()
    .or(z.literal('')),
  
  text_secondary_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide (ex: #6b7280)')
    .optional()
    .or(z.literal('')),
  
  button_primary_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  button_primary_text: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  button_secondary_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  button_secondary_text: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  link_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  link_hover_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  border_radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional().nullable(),
  shadow_intensity: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional().nullable(),
  
  // Typographie
  heading_font: z.string().max(100, 'Le nom de police ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  body_font: z.string().max(100, 'Le nom de police ne peut pas dépasser 100 caractères').optional().or(z.literal('')),
  font_size_base: z.string().max(20, 'La taille de police ne peut pas dépasser 20 caractères').optional().or(z.literal('')),
  heading_size_h1: z.string().max(20).optional().or(z.literal('')),
  heading_size_h2: z.string().max(20).optional().or(z.literal('')),
  heading_size_h3: z.string().max(20).optional().or(z.literal('')),
  line_height: z.string().max(20).optional().or(z.literal('')),
  letter_spacing: z.string().max(20).optional().or(z.literal('')),
  
  // Layout
  header_style: z.enum(['minimal', 'standard', 'extended']).optional().nullable(),
  footer_style: z.enum(['minimal', 'standard', 'extended']).optional().nullable(),
  sidebar_enabled: z.boolean().optional().nullable(),
  sidebar_position: z.enum(['left', 'right']).optional().nullable(),
  product_grid_columns: z.number().min(1).max(6, 'Le nombre de colonnes ne peut pas dépasser 6').optional().nullable(),
  product_card_style: z.enum(['minimal', 'standard', 'detailed']).optional().nullable(),
  navigation_style: z.enum(['horizontal', 'vertical', 'mega']).optional().nullable(),
  
  // SEO
  meta_title: z.string()
    .max(60, 'Le titre SEO ne doit pas dépasser 60 caractères pour un meilleur référencement')
    .optional()
    .or(z.literal('')),
  
  meta_description: z.string()
    .max(160, 'La description SEO ne doit pas dépasser 160 caractères pour un meilleur référencement')
    .optional()
    .or(z.literal('')),
  
  meta_keywords: z.string()
    .max(255, 'Les mots-clés ne peuvent pas dépasser 255 caractères')
    .optional()
    .or(z.literal('')),
  
  og_title: z.string()
    .max(60, 'Le titre Open Graph ne doit pas dépasser 60 caractères')
    .optional()
    .or(z.literal('')),
  
  og_description: z.string()
    .max(200, 'La description Open Graph ne doit pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),
  
  og_image: z.string()
    .url('URL de l\'image Open Graph invalide')
    .optional()
    .or(z.literal('')),
  
  // Localisation
  address_line1: z.string()
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),
  
  address_line2: z.string()
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères')
    .optional()
    .or(z.literal('')),
  
  city: z.string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  
  state_province: z.string()
    .max(100, 'La région/province ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  
  postal_code: z.string()
    .max(20, 'Le code postal ne peut pas dépasser 20 caractères')
    .optional()
    .or(z.literal('')),
  
  country: z.string()
    .length(2, 'Le code pays doit contenir 2 caractères (ex: BF, FR, CI)')
    .regex(/^[A-Z]{2}$/, 'Format de code pays invalide (majuscules uniquement, ISO 3166-1 alpha-2)')
    .optional()
    .or(z.literal('')),
  
  latitude: z.number()
    .min(-90, 'La latitude doit être entre -90 et 90')
    .max(90, 'La latitude doit être entre -90 et 90')
    .optional()
    .nullable(),
  
  longitude: z.number()
    .min(-180, 'La longitude doit être entre -180 et 180')
    .max(180, 'La longitude doit être entre -180 et 180')
    .optional()
    .nullable(),
  
  timezone: z.string()
    .max(100, 'Le fuseau horaire ne peut pas dépasser 100 caractères (ex: Africa/Ouagadougou)')
    .optional()
    .or(z.literal('')),
  
  opening_hours: openingHoursSchema,
  legal_pages: legalPagesSchema,
  
  // Analytics et Tracking
  google_analytics_id: z.string()
    .regex(/^(G-[A-Z0-9]+|UA-\d{4,10}-\d{1,4})$/, 'Format d\'ID Google Analytics invalide (ex: G-XXXXXXXXXX ou UA-XXXXXX-XX)')
    .optional()
    .or(z.literal('')),
  
  google_analytics_enabled: z.boolean().optional().default(false),
  
  facebook_pixel_id: z.string()
    .regex(/^\d{15,16}$/, 'Format d\'ID Facebook Pixel invalide (15-16 chiffres)')
    .optional()
    .or(z.literal('')),
  
  facebook_pixel_enabled: z.boolean().optional().default(false),
  
  google_tag_manager_id: z.string()
    .regex(/^GTM-[A-Z0-9]+$/, 'Format d\'ID Google Tag Manager invalide (ex: GTM-XXXXXX)')
    .optional()
    .or(z.literal('')),
  
  google_tag_manager_enabled: z.boolean().optional().default(false),
  
  tiktok_pixel_id: z.string()
    .regex(/^[A-Z0-9]{16,20}$/, 'Format d\'ID TikTok Pixel invalide (16-20 caractères alphanumériques)')
    .optional()
    .or(z.literal('')),
  
  tiktok_pixel_enabled: z.boolean().optional().default(false),
  
  custom_tracking_scripts: z.string()
    .max(50000, 'Le script personnalisé ne peut pas dépasser 50000 caractères')
    .optional()
    .or(z.literal('')),
  
  custom_scripts_enabled: z.boolean().optional().default(false),
  
  // Messages d'information
  info_message: z.string()
    .max(500, 'Le message d\'information ne peut pas dépasser 500 caractères')
    .optional()
    .or(z.literal('')),
  
  info_message_color: z.string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Format de couleur invalide')
    .optional()
    .or(z.literal('')),
  
  info_message_font: z.string()
    .max(100, 'Le nom de police ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
});

// Schéma pour la création de boutique (champs requis uniquement)
export const storeCreateSchema = storeSchema.pick({
  name: true,
  slug: true,
  default_currency: true,
}).extend({
  description: storeSchema.shape.description,
  contact_email: storeSchema.shape.contact_email,
});

// Schéma pour la mise à jour de boutique (tous les champs optionnels sauf name et slug)
export const storeUpdateSchema = storeSchema.partial().required({
  name: true,
});

// Schéma de validation par étape (pour le wizard)
export const storeBasicInfoSchema = storeSchema.pick({
  name: true,
  slug: true,
  description: true,
  default_currency: true,
});

export const storeBrandingSchema = storeSchema.pick({
  logo_url: true,
  banner_url: true,
  favicon_url: true,
  apple_touch_icon_url: true,
  watermark_url: true,
  placeholder_image_url: true,
});

export const storeContactSchema = storeSchema.pick({
  contact_email: true,
  contact_phone: true,
  support_email: true,
  sales_email: true,
  press_email: true,
  partnership_email: true,
  support_phone: true,
  sales_phone: true,
  whatsapp_number: true,
  telegram_username: true,
  facebook_url: true,
  instagram_url: true,
  twitter_url: true,
  linkedin_url: true,
  youtube_url: true,
  tiktok_url: true,
  pinterest_url: true,
  snapchat_url: true,
  discord_url: true,
  twitch_url: true,
});

export const storeThemeSchema = storeSchema.pick({
  primary_color: true,
  secondary_color: true,
  accent_color: true,
  background_color: true,
  text_color: true,
  text_secondary_color: true,
  button_primary_color: true,
  button_primary_text: true,
  button_secondary_color: true,
  button_secondary_text: true,
  link_color: true,
  link_hover_color: true,
  border_radius: true,
  shadow_intensity: true,
  heading_font: true,
  body_font: true,
  font_size_base: true,
  heading_size_h1: true,
  heading_size_h2: true,
  heading_size_h3: true,
  line_height: true,
  letter_spacing: true,
  header_style: true,
  footer_style: true,
  sidebar_enabled: true,
  sidebar_position: true,
  product_grid_columns: true,
  product_card_style: true,
  navigation_style: true,
});

export const storeSEOSchema = storeSchema.pick({
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  og_title: true,
  og_description: true,
  og_image: true,
});

export const storeLocationSchema = storeSchema.pick({
  address_line1: true,
  address_line2: true,
  city: true,
  state_province: true,
  postal_code: true,
  country: true,
  latitude: true,
  longitude: true,
  timezone: true,
  opening_hours: true,
});

export const storeLegalSchema = storeSchema.pick({
  legal_pages: true,
});

export const storeAnalyticsSchema = storeSchema.pick({
  google_analytics_id: true,
  google_analytics_enabled: true,
  facebook_pixel_id: true,
  facebook_pixel_enabled: true,
  google_tag_manager_id: true,
  google_tag_manager_enabled: true,
  tiktok_pixel_id: true,
  tiktok_pixel_enabled: true,
  custom_tracking_scripts: true,
  custom_scripts_enabled: true,
});

// Schéma pour les clients
export const customerSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  
  email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .optional()
    .refine(val => !val || isValidPhone(val), 'Numéro de téléphone invalide'),
  
  address: z.string()
    .max(200, 'L\'adresse ne peut pas dépasser 200 caractères')
    .optional(),
  
  city: z.string()
    .max(50, 'La ville ne peut pas dépasser 50 caractères')
    .optional(),
  
  country: z.string()
    .max(50, 'Le pays ne peut pas dépasser 50 caractères')
    .optional(),
  
  notes: z.string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .optional(),
});

// Schéma pour l'authentification
export const authSchema = z.object({
  email: z.string()
    .email('Email invalide')
    .refine(isValidEmail, 'Format d\'email invalide'),
  
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
});

// Types TypeScript dérivés des schémas
export type ProductFormData = z.infer<typeof productSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type StoreFormData = z.infer<typeof storeSchema>;
export type StoreCreateFormData = z.infer<typeof storeCreateSchema>;
export type StoreUpdateFormData = z.infer<typeof storeUpdateSchema>;
export type StoreBasicInfoFormData = z.infer<typeof storeBasicInfoSchema>;
export type StoreBrandingFormData = z.infer<typeof storeBrandingSchema>;
export type StoreContactFormData = z.infer<typeof storeContactSchema>;
export type StoreThemeFormData = z.infer<typeof storeThemeSchema>;
export type StoreSEOFormData = z.infer<typeof storeSEOSchema>;
export type StoreLocationFormData = z.infer<typeof storeLocationSchema>;
export type StoreLegalFormData = z.infer<typeof storeLegalSchema>;
export type StoreAnalyticsFormData = z.infer<typeof storeAnalyticsSchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type AuthFormData = z.infer<typeof authSchema>;






