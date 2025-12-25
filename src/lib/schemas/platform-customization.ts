/**
 * Schémas Zod pour la validation des données de personnalisation de la plateforme
 */

import { z } from 'zod';

// Validation HSL (hsl(210, 100%, 60%) ou 210 100% 60%)
const hslColorSchema = z.string().refine(
  (val) => {
    if (!val) return true; // Optionnel
    // Format hsl(210, 100%, 60%) ou 210 100% 60%
    const hslRegex = /^(hsl\(|)(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\)?$/i;
    if (hslRegex.test(val)) {
      const match = val.match(hslRegex);
      if (match) {
        const h = parseInt(match[2]);
        const s = parseInt(match[3]);
        const l = parseInt(match[4]);
        return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
      }
    }
    return false;
  },
  {
    message: 'Format HSL invalide. Utilisez hsl(210, 100%, 60%) ou 210 100% 60%',
  }
);

// Validation URL
const urlSchema = z.string().url('URL invalide').optional().or(z.literal(''));

// Schéma pour les couleurs
const colorsSchema = z.object({
  primary: hslColorSchema.optional(),
  secondary: hslColorSchema.optional(),
  accent: hslColorSchema.optional(),
  success: hslColorSchema.optional(),
  warning: hslColorSchema.optional(),
  error: hslColorSchema.optional(),
}).optional();

// Schéma pour les logos
const logoSchema = z.object({
  light: urlSchema,
  dark: urlSchema,
  favicon: urlSchema,
}).optional();

// Schéma pour la typographie
const typographySchema = z.object({
  fontFamily: z.string().max(200, 'La famille de police ne peut pas dépasser 200 caractères').optional(),
  fontSize: z.record(z.string(), z.string()).optional(),
}).optional();

// Schéma pour le thème
const themeSchema = z.enum(['light', 'dark', 'auto']).optional();

// Schéma pour les design tokens
const tokensSchema = z.object({
  borderRadius: z.string().max(50, 'Le border radius ne peut pas dépasser 50 caractères').optional(),
  shadow: z.enum(['sm', 'base', 'md', 'lg', 'xl', 'soft', 'medium', 'large', 'glow']).optional(),
  spacing: z.string().max(10, 'Le spacing ne peut pas dépasser 10 caractères').optional(),
}).optional();

// Schéma pour le design
export const designSchema = z.object({
  colors: colorsSchema,
  logo: logoSchema,
  typography: typographySchema,
  theme: themeSchema,
  tokens: tokensSchema,
}).optional();

// Schéma pour les commissions
const commissionsSchema = z.object({
  platformRate: z.number().min(0, 'Le taux doit être positif').max(100, 'Le taux ne peut pas dépasser 100%').optional(),
  referralRate: z.number().min(0, 'Le taux doit être positif').max(100, 'Le taux ne peut pas dépasser 100%').optional(),
}).optional();

// Schéma pour les retraits
const withdrawalsSchema = z.object({
  minAmount: z.number().int('Le montant minimum doit être un entier').min(0, 'Le montant doit être positif').optional(),
  autoApprove: z.boolean().optional(),
}).optional();

// Schéma pour les limites
const limitsSchema = z.object({
  maxProducts: z.number().int('Le nombre maximum doit être un entier').min(0, 'Le nombre doit être positif').optional(),
  maxStores: z.number().int('Le nombre maximum doit être un entier').min(0, 'Le nombre doit être positif').optional(),
}).optional();

// Schéma pour les paramètres
export const settingsSchema = z.object({
  commissions: commissionsSchema,
  withdrawals: withdrawalsSchema,
  limits: limitsSchema,
}).optional();

// Schéma pour le contenu
export const contentSchema = z.object({
  texts: z.record(z.string(), z.string()).optional(),
  emails: z.record(z.string(), z.any()).optional(),
  notifications: z.record(z.string(), z.any()).optional(),
}).optional();

// Schéma pour les intégrations
export const integrationsSchema = z.object({
  payment: z.record(z.string(), z.any()).optional(),
  shipping: z.record(z.string(), z.any()).optional(),
  analytics: z.record(z.string(), z.any()).optional(),
}).optional();

// Schéma pour la sécurité
export const securitySchema = z.object({
  requireAAL2: z.array(z.string().min(1, 'La route ne peut pas être vide')).optional(),
  permissions: z.record(z.string(), z.any()).optional(),
}).optional();

// Schéma pour les fonctionnalités
export const featuresSchema = z.object({
  enabled: z.array(z.string().min(1, 'L\'identifiant de fonctionnalité ne peut pas être vide')).optional(),
  disabled: z.array(z.string().min(1, 'L\'identifiant de fonctionnalité ne peut pas être vide')).optional(),
}).optional();

// Schéma pour les notifications
export const notificationsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  push: z.boolean().optional(),
  channels: z.record(z.string(), z.any()).optional(),
}).optional();

// Schéma pour les pages
export const pagesSchema = z.record(z.string(), z.record(z.string(), z.any())).optional();

// Schéma complet pour la personnalisation de la plateforme
export const platformCustomizationSchema = z.object({
  design: designSchema,
  settings: settingsSchema,
  content: contentSchema,
  integrations: integrationsSchema,
  security: securitySchema,
  features: featuresSchema,
  notifications: notificationsSchema,
  pages: pagesSchema,
}).passthrough(); // Permet des champs supplémentaires pour l'extensibilité

// Type TypeScript dérivé du schéma
export type PlatformCustomizationSchemaType = z.infer<typeof platformCustomizationSchema>;

// Fonction de validation avec messages d'erreur formatés
export function validateCustomizationData(data: unknown): {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
  data?: PlatformCustomizationSchemaType;
} {
  try {
    const validated = platformCustomizationSchema.parse(data);
    return { valid: true, errors: [], data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      return { valid: false, errors };
    }
    return {
      valid: false,
      errors: [{ path: 'unknown', message: 'Erreur de validation inconnue' }],
    };
  }
}

// Validation partielle par section
export function validateSection(section: string, data: unknown): {
  valid: boolean;
  errors: Array<{ path: string; message: string }>;
} {
  const sectionSchemas: Record<string, z.ZodSchema> = {
    design: designSchema,
    settings: settingsSchema,
    content: contentSchema,
    integrations: integrationsSchema,
    security: securitySchema,
    features: featuresSchema,
    notifications: notificationsSchema,
    pages: pagesSchema,
  };

  const schema = sectionSchemas[section];
  if (!schema) {
    return {
      valid: false,
      errors: [{ path: section, message: `Section "${section}" non reconnue` }],
    };
  }

  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      return { valid: false, errors };
    }
    return {
      valid: false,
      errors: [{ path: 'unknown', message: 'Erreur de validation inconnue' }],
    };
  }
}

