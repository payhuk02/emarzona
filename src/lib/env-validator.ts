/**
 * Validateur des variables d'environnement
 * Valide toutes les variables d'environnement au démarrage de l'application
 */

import { z } from 'zod';
import { logger } from './logger';

/**
 * Schéma de validation pour les variables d'environnement
 */
const envSchema = z.object({
  // Supabase (Requis)
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL doit être une URL valide'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY est requis'),

  // Moneroo (Optionnel)
  VITE_MONEROO_API_URL: z.string().url().optional().or(z.literal('')),
  VITE_MONEROO_TIMEOUT_MS: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_MAX_RETRIES: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_RETRY_BACKOFF_MS: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_CACHE_TTL_MS: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_CACHE_MAX_SIZE: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_RATE_LIMIT_USER_MAX: z.string().regex(/^\d+$/).transform(Number).optional(),
  VITE_MONEROO_RATE_LIMIT_STORE_MAX: z.string().regex(/^\d+$/).transform(Number).optional(),

  // Sentry (Optionnel)
  VITE_SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  VITE_SENTRY_ORG: z.string().optional(),
  VITE_SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Crisp (Optionnel)
  VITE_CRISP_WEBSITE_ID: z.string().optional(),

  // Feature Flags (Optionnel)
  VITE_FEATURE_NEW_CHECKOUT: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  VITE_FEATURE_ADVANCED_ANALYTICS: z
    .string()
    .transform(val => val === 'true')
    .optional(),

  // Environnement
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  MODE: z.enum(['development', 'production']).optional(),
});

/**
 * Type des variables d'environnement validées
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Variables d'environnement validées
 * Accessible dans toute l'application
 */
let  validatedEnv: ValidatedEnv | null = null;

/**
 * Valide les variables d'environnement
 * @throws {Error} Si la validation échoue
 */
export function validateEnv(): ValidatedEnv {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    // Récupérer toutes les variables d'environnement
    const env = import.meta.env;

    // Valider avec Zod
    validatedEnv = envSchema.parse(env);

    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');

      throw new Error(
        `❌ Erreur de validation des variables d'environnement:\n${errors}\n\n` +
          `Vérifiez votre fichier .env et assurez-vous que toutes les variables requises sont définies.`
      );
    }

    throw error;
  }
}

/**
 * Récupère les variables d'environnement validées
 * @returns Variables d'environnement validées
 */
export function getEnv(): ValidatedEnv {
  if (!validatedEnv) {
    return validateEnv();
  }
  return validatedEnv;
}

/**
 * Vérifie si une variable d'environnement est définie
 * @param key Clé de la variable
 * @returns true si définie, false sinon
 */
export function hasEnv(key: keyof ValidatedEnv): boolean {
  const env = getEnv();
  const value = env[key];
  return value !== undefined && value !== null && value !== '';
}

/**
 * Valide les variables d'environnement au chargement du module
 * En développement, affiche un avertissement si des variables optionnelles sont manquantes
 */
if (import.meta.env.DEV) {
  try {
    validateEnv();
  } catch (error) {
    // En développement, on peut continuer avec des variables manquantes (optionnelles)
    // mais on affiche un avertissement
    logger.warn("Variables d'environnement manquantes ou invalides", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
} else {
  // En production, la validation doit être stricte
  // En production, on ne peut pas continuer sans les variables requises
  validateEnv();
}






