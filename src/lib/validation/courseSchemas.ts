/**
 * Schémas de validation Zod pour les cours en ligne
 * Date: 1er Février 2025
 * Description: Validation serveur complète pour les données de cours
 */

import { z } from 'zod';

// Schéma pour une leçon
export const courseLessonSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(2, 'Le titre de la leçon doit contenir au moins 2 caractères')
    .max(200, 'Le titre de la leçon ne peut pas dépasser 200 caractères')
    .trim(),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .nullable(),
  video_type: z.enum(['upload', 'youtube', 'vimeo', 'google-drive', 'external'], {
    errorMap: () => ({ message: 'Type de vidéo invalide' }),
  }),
  video_url: z
    .string()
    .url('URL de vidéo invalide')
    .or(z.literal(''))
    .refine(
      val => {
        if (!val || val === '') return true; // URL optionnelle
        // Validation basique pour YouTube
        if (val.includes('youtube.com') || val.includes('youtu.be')) {
          return true;
        }
        // Validation basique pour Vimeo
        if (val.includes('vimeo.com')) {
          return true;
        }
        // Validation pour Google Drive
        if (val.includes('drive.google.com')) {
          return true;
        }
        // Validation pour URLs externes
        return val.startsWith('http://') || val.startsWith('https://');
      },
      { message: "Format d'URL vidéo non supporté" }
    ),
  video_duration_seconds: z
    .number()
    .int('La durée doit être un nombre entier')
    .min(0, 'La durée ne peut pas être négative')
    .max(86400, 'La durée ne peut pas dépasser 24 heures')
    .optional()
    .default(0),
  is_preview: z.boolean().default(false),
  order_index: z
    .number()
    .int("L'index doit être un nombre entier")
    .min(0, "L'index ne peut pas être négatif"),
});

// Schéma pour une section
export const courseSectionSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(2, 'Le titre de la section doit contenir au moins 2 caractères')
    .max(200, 'Le titre de la section ne peut pas dépasser 200 caractères')
    .trim(),
  description: z
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional()
    .nullable(),
  order_index: z
    .number()
    .int("L'index doit être un nombre entier")
    .min(0, "L'index ne peut pas être négatif"),
  lessons: z.array(courseLessonSchema).min(1, 'Une section doit contenir au moins une leçon'),
  isOpen: z.boolean().optional(),
});

// Schéma pour les FAQs
export const courseFAQSchema = z.object({
  id: z.string().optional(),
  question: z
    .string()
    .min(5, 'La question doit contenir au moins 5 caractères')
    .max(500, 'La question ne peut pas dépasser 500 caractères')
    .trim(),
  answer: z
    .string()
    .min(10, 'La réponse doit contenir au moins 10 caractères')
    .max(2000, 'La réponse ne peut pas dépasser 2000 caractères')
    .trim(),
  order: z.number().int().min(0).optional(),
});

// Schéma principal pour la création de cours
export const createCourseSchema = z
  .object({
    // Données du produit
    storeId: z.string().uuid('ID de boutique invalide'),
    name: z
      .string()
      .min(2, 'Le titre doit contenir au moins 2 caractères')
      .max(200, 'Le titre ne peut pas dépasser 200 caractères')
      .trim(),
    slug: z
      .string()
      .min(2, 'Le slug doit contenir au moins 2 caractères')
      .max(100, 'Le slug ne peut pas dépasser 100 caractères')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Format de slug invalide (minuscules, chiffres et tirets uniquement)'
      )
      .trim(),
    short_description: z
      .string()
      .min(10, 'La description courte doit contenir au moins 10 caractères')
      .max(500, 'La description courte ne peut pas dépasser 500 caractères')
      .trim(),
    description: z
      .string()
      .min(50, 'La description doit contenir au moins 50 caractères')
      .max(10000, 'La description ne peut pas dépasser 10000 caractères')
      .trim(),
    category: z
      .string()
      .min(2, 'La catégorie doit contenir au moins 2 caractères')
      .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
      .trim(),
    image_url: z.string().url("URL d'image invalide").optional().nullable().or(z.literal('')),
    images: z.array(z.string().url("URL d'image invalide")).optional().default([]),
    price: z
      .number()
      .min(0, 'Le prix ne peut pas être négatif')
      .max(1000000, 'Le prix ne peut pas dépasser 1,000,000')
      .refine(val => {
        const decimals = val.toString().split('.')[1];
        return !decimals || decimals.length <= 2;
      }, 'Le prix ne peut avoir que 2 décimales maximum'),
    currency: z.enum(['XOF', 'EUR', 'USD', 'GBP', 'NGN', 'GHS', 'KES', 'ZAR'], {
      errorMap: () => ({ message: 'Devise non supportée' }),
    }),
    promotional_price: z
      .number()
      .min(0, 'Le prix promotionnel ne peut pas être négatif')
      .max(1000000, 'Le prix promotionnel ne peut pas dépasser 1,000,000')
      .optional()
      .nullable(),
    pricing_model: z
      .enum(['one-time', 'subscription', 'free', 'pay-what-you-want'])
      .default('one-time'),
    licensing_type: z.enum(['standard', 'plr', 'copyrighted']).default('standard'),
    license_terms: z
      .string()
      .max(2000, 'Les conditions ne peuvent pas dépasser 2000 caractères')
      .optional()
      .nullable(),
    create_free_preview: z.boolean().default(false),
    preview_content_description: z
      .string()
      .max(500, 'La description preview ne peut pas dépasser 500 caractères')
      .optional()
      .nullable(),

    // Données du cours
    level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels'], {
      errorMap: () => ({ message: 'Niveau invalide' }),
    }),
    language: z
      .string()
      .min(2, 'Le code langue doit contenir au moins 2 caractères')
      .max(10, 'Le code langue ne peut pas dépasser 10 caractères')
      .default('fr'),
    certificate_enabled: z.boolean().default(true),
    certificate_passing_score: z
      .number()
      .int('Le score de passage doit être un nombre entier')
      .min(0, 'Le score de passage ne peut pas être négatif')
      .max(100, 'Le score de passage ne peut pas dépasser 100')
      .default(80),
    learning_objectives: z
      .array(
        z
          .string()
          .min(5, 'Un objectif doit contenir au moins 5 caractères')
          .max(500, 'Un objectif ne peut pas dépasser 500 caractères')
      )
      .max(20, "Maximum 20 objectifs d'apprentissage")
      .default([]),
    prerequisites: z
      .array(
        z
          .string()
          .min(5, 'Un prérequis doit contenir au moins 5 caractères')
          .max(500, 'Un prérequis ne peut pas dépasser 500 caractères')
      )
      .max(20, 'Maximum 20 prérequis')
      .default([]),
    target_audience: z
      .array(
        z
          .string()
          .min(5, 'Un public cible doit contenir au moins 5 caractères')
          .max(500, 'Un public cible ne peut pas dépasser 500 caractères')
      )
      .max(20, 'Maximum 20 publics cibles')
      .default([]),

    // Curriculum
    sections: z
      .array(courseSectionSchema)
      .min(1, 'Un cours doit contenir au moins une section')
      .refine(
        sections => {
          // Vérifier que chaque section a au moins une leçon
          return sections.every(section => section.lessons.length > 0);
        },
        { message: 'Chaque section doit contenir au moins une leçon' }
      )
      .refine(
        sections => {
          // Vérifier que les order_index sont uniques
          const orderIndices = sections.map(s => s.order_index);
          return new Set(orderIndices).size === orderIndices.length;
        },
        { message: 'Les index de section doivent être uniques' }
      ),

    // SEO
    meta_title: z
      .string()
      .max(60, 'Le titre SEO ne peut pas dépasser 60 caractères')
      .optional()
      .nullable(),
    meta_description: z
      .string()
      .max(160, 'La description SEO ne peut pas dépasser 160 caractères')
      .optional()
      .nullable(),
    meta_keywords: z
      .string()
      .max(255, 'Les mots-clés SEO ne peuvent pas dépasser 255 caractères')
      .optional()
      .nullable(),
    og_title: z
      .string()
      .max(60, 'Le titre OG ne peut pas dépasser 60 caractères')
      .optional()
      .nullable(),
    og_description: z
      .string()
      .max(160, 'La description OG ne peut pas dépasser 160 caractères')
      .optional()
      .nullable(),
    og_image: z.string().url("URL d'image OG invalide").optional().nullable().or(z.literal('')),

    // FAQs
    faqs: z.array(courseFAQSchema).max(50, 'Maximum 50 FAQs').optional().default([]),

    // Affiliation
    affiliate_enabled: z.boolean().default(false),
    commission_rate: z
      .number()
      .min(0, 'Le taux de commission ne peut pas être négatif')
      .max(100, 'Le taux de commission ne peut pas dépasser 100%')
      .optional(),
    commission_type: z.enum(['percentage', 'fixed']).optional(),
    fixed_commission_amount: z
      .number()
      .min(0, 'Le montant de commission fixe ne peut pas être négatif')
      .optional(),
    cookie_duration_days: z
      .number()
      .int('La durée du cookie doit être un nombre entier')
      .min(1, "La durée du cookie doit être d'au moins 1 jour")
      .max(365, 'La durée du cookie ne peut pas dépasser 365 jours')
      .optional(),
    max_commission_per_sale: z
      .number()
      .min(0, 'La commission maximale ne peut pas être négative')
      .optional()
      .nullable(),
    min_order_amount: z
      .number()
      .min(0, 'Le montant minimum de commande ne peut pas être négatif')
      .optional(),
    allow_self_referral: z.boolean().optional(),
    require_approval: z.boolean().optional(),
    affiliate_terms_and_conditions: z
      .string()
      .max(2000, "Les conditions d'affiliation ne peuvent pas dépasser 2000 caractères")
      .optional()
      .nullable(),

    // Tracking & Pixels
    tracking_enabled: z.boolean().default(true),
    google_analytics_id: z
      .string()
      .max(50, "L'ID Google Analytics ne peut pas dépasser 50 caractères")
      .optional()
      .nullable(),
    facebook_pixel_id: z
      .string()
      .max(50, "L'ID Facebook Pixel ne peut pas dépasser 50 caractères")
      .optional()
      .nullable(),
    google_tag_manager_id: z
      .string()
      .max(50, "L'ID Google Tag Manager ne peut pas dépasser 50 caractères")
      .optional()
      .nullable(),
    tiktok_pixel_id: z
      .string()
      .max(50, "L'ID TikTok Pixel ne peut pas dépasser 50 caractères")
      .optional()
      .nullable(),
    track_video_events: z.boolean().optional(),
    track_lesson_completion: z.boolean().optional(),
    track_quiz_attempts: z.boolean().optional(),
    track_certificate_downloads: z.boolean().optional(),
  })
  .refine(
    data => {
      // Si pricing_model est 'free', le prix doit être 0
      if (data.pricing_model === 'free' && data.price !== 0) {
        return false;
      }
      return true;
    },
    {
      message: 'Le prix doit être 0 pour un cours gratuit',
      path: ['price'],
    }
  )
  .refine(
    data => {
      // Le prix promotionnel doit être inférieur au prix normal
      if (data.promotional_price !== null && data.promotional_price !== undefined) {
        return data.promotional_price < data.price;
      }
      return true;
    },
    {
      message: 'Le prix promotionnel doit être inférieur au prix normal',
      path: ['promotional_price'],
    }
  )
  .refine(
    data => {
      // Si affiliate_enabled est true, commission_rate ou fixed_commission_amount doit être défini
      if (data.affiliate_enabled) {
        if (
          data.commission_type === 'percentage' &&
          (!data.commission_rate || data.commission_rate <= 0)
        ) {
          return false;
        }
        if (
          data.commission_type === 'fixed' &&
          (!data.fixed_commission_amount || data.fixed_commission_amount <= 0)
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Le taux ou montant de commission est requis lorsque l'affiliation est activée",
      path: ['commission_rate'],
    }
  );

// Type TypeScript dérivé du schéma
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

// Fonction helper pour valider les données
export function validateCourseData(
  data: unknown
): { success: true; data: CreateCourseInput } | { success: false; errors: z.ZodError } {
  const result = createCourseSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
