/**
 * Utilitaires de validation pour les boutiques
 * Utilise Zod pour une validation complète avec messages d'erreur améliorés
 */

import { 
  storeSchema, 
  storeCreateSchema, 
  storeUpdateSchema,
  storeBasicInfoSchema,
  storeBrandingSchema,
  storeContactSchema,
  storeThemeSchema,
  storeSEOSchema,
  storeLocationSchema,
  storeLegalSchema,
  storeAnalyticsSchema,
  type StoreFormData,
} from './schemas';
import { z } from 'zod';
import { logger } from './logger';

/**
 * Formatte les erreurs Zod en un objet lisible
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  
  return formattedErrors;
}

/**
 * Valide les données d'une boutique (schema complet)
 */
export function validateStore(data: unknown): { 
  valid: boolean; 
  errors: Record<string, string>; 
  data?: StoreFormData;
} {
  try {
    const validated = storeSchema.parse(data);
    return {
      valid: true,
      errors: {},
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: formatZodErrors(error),
      };
    }
    
    logger.error('Erreur de validation inattendue', error);
    return {
      valid: false,
      errors: { _general: 'Erreur de validation inattendue' },
    };
  }
}

/**
 * Valide les données pour la création d'une boutique
 */
export function validateStoreCreate(data: unknown): { 
  valid: boolean; 
  errors: Record<string, string>; 
  data?: z.infer<typeof storeCreateSchema>;
} {
  try {
    const validated = storeCreateSchema.parse(data);
    return {
      valid: true,
      errors: {},
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: formatZodErrors(error),
      };
    }
    
    logger.error('Erreur de validation inattendue', error);
    return {
      valid: false,
      errors: { _general: 'Erreur de validation inattendue' },
    };
  }
}

/**
 * Valide les données pour la mise à jour d'une boutique
 */
export function validateStoreUpdate(data: unknown): { 
  valid: boolean; 
  errors: Record<string, string>; 
  data?: z.infer<typeof storeUpdateSchema>;
} {
  try {
    const validated = storeUpdateSchema.parse(data);
    return {
      valid: true,
      errors: {},
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: formatZodErrors(error),
      };
    }
    
    logger.error('Erreur de validation inattendue', error);
    return {
      valid: false,
      errors: { _general: 'Erreur de validation inattendue' },
    };
  }
}

/**
 * Valide une étape spécifique du wizard
 */
export function validateStoreStep(
  step: 'basic' | 'branding' | 'contact' | 'theme' | 'seo' | 'location' | 'legal' | 'analytics',
  data: unknown
): { 
  valid: boolean; 
  errors: Record<string, string>; 
  data?: unknown;
} {
  let schema: z.ZodSchema;
  
  switch (step) {
    case 'basic':
      schema = storeBasicInfoSchema;
      break;
    case 'branding':
      schema = storeBrandingSchema;
      break;
    case 'contact':
      schema = storeContactSchema;
      break;
    case 'theme':
      schema = storeThemeSchema;
      break;
    case 'seo':
      schema = storeSEOSchema;
      break;
    case 'location':
      schema = storeLocationSchema;
      break;
    case 'legal':
      schema = storeLegalSchema;
      break;
    case 'analytics':
      schema = storeAnalyticsSchema;
      break;
    default:
      return {
        valid: false,
        errors: { _general: 'Étape de validation inconnue' },
      };
  }
  
  try {
    const validated = schema.parse(data);
    return {
      valid: true,
      errors: {},
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: formatZodErrors(error),
      };
    }
    
    logger.error('Erreur de validation inattendue', error);
    return {
      valid: false,
      errors: { _general: 'Erreur de validation inattendue' },
    };
  }
}

/**
 * Valide un champ spécifique de manière asynchrone (pour validation temps réel)
 */
export async function validateStoreField(
  field: string,
  value: unknown
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Récupérer le schéma du champ
    const fieldSchema = storeSchema.shape[field as keyof typeof storeSchema.shape];
    
    if (!fieldSchema) {
      return { valid: true }; // Champ non défini dans le schéma = valide par défaut
    }
    
    // Valider uniquement ce champ
    await fieldSchema.parseAsync(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors[0]?.message || 'Valeur invalide',
      };
    }
    
    return {
      valid: false,
      error: 'Erreur de validation',
    };
  }
}

/**
 * Obtient les messages d'aide pour un champ
 */
export function getFieldHelp(field: string): string | undefined {
  const helpMessages: Record<string, string> = {
    slug: 'Utilisez uniquement des lettres minuscules, des chiffres et des tirets. Ex: ma-boutique-123',
    contact_email: 'Cette adresse sera utilisée pour les communications importantes',
    meta_title: 'Recommandé : 50-60 caractères pour un affichage optimal dans les résultats de recherche',
    meta_description: 'Recommandé : 150-160 caractères pour un affichage optimal dans les résultats de recherche',
    google_analytics_id: 'Format : G-XXXXXXXXXX (GA4) ou UA-XXXXXX-XX (Universal Analytics)',
    facebook_pixel_id: 'Trouvez cet ID dans votre compte Facebook Business Manager',
    google_tag_manager_id: 'Format : GTM-XXXXXX. Trouvez cet ID dans votre compte Google Tag Manager',
    tiktok_pixel_id: 'Trouvez cet ID dans votre compte TikTok Ads Manager',
    whatsapp_number: 'Format international avec indicatif pays. Ex: +226 XX XX XX XX',
    telegram_username: 'Sans le @. Ex: votre_nom pour @votre_nom',
    latitude: 'Coordonnée GPS de votre boutique (entre -90 et 90)',
    longitude: 'Coordonnée GPS de votre boutique (entre -180 et 180)',
  };
  
  return helpMessages[field];
}

