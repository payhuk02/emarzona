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

// Schéma pour les boutiques
export const storeSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  
  description: z.string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  
  slug: z.string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide'),
  
  contact_email: z.string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  
  contact_phone: z.string()
    .optional()
    .refine(val => !val || isValidPhone(val), 'Numéro de téléphone invalide'),
  
  facebook_url: z.string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  
  instagram_url: z.string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  
  twitter_url: z.string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
  
  linkedin_url: z.string()
    .url('URL invalide')
    .optional()
    .or(z.literal('')),
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
export type CustomerFormData = z.infer<typeof customerSchema>;
export type AuthFormData = z.infer<typeof authSchema>;
