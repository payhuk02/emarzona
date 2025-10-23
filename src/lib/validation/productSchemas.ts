import { z } from 'zod';

/**
 * Schéma de validation pour l'import CSV de produits
 * Définit les règles de validation strictes pour garantir l'intégrité des données
 */
export const ProductImportSchema = z.object({
  // Champs obligatoires
  name: z.string()
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim(),
  
  slug: z.string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(200, 'Le slug ne peut pas dépasser 200 caractères')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Le slug doit être en minuscules avec tirets uniquement')
    .trim(),
  
  price: z.union([
    z.number().positive('Le prix doit être positif'),
    z.string().transform((val) => {
      const parsed = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
      if (isNaN(parsed)) throw new Error('Prix invalide');
      return parsed;
    })
  ]),
  
  currency: z.enum(['XOF', 'EUR', 'USD', 'GBP', 'CAD'], {
    errorMap: () => ({ message: 'Devise non supportée (XOF, EUR, USD, GBP, CAD)' })
  }),
  
  product_type: z.enum(['digital', 'physical', 'service'], {
    errorMap: () => ({ message: 'Type de produit invalide (digital, physical, service)' })
  }),
  
  // Champs optionnels
  description: z.string()
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .optional()
    .nullable()
    .transform((val) => val || null),
  
  category: z.string()
    .max(100, 'La catégorie ne peut pas dépasser 100 caractères')
    .optional()
    .nullable()
    .transform((val) => val || null),
  
  is_active: z.union([
    z.boolean(),
    z.string().transform((val) => {
      const lower = val.toLowerCase().trim();
      if (lower === 'true' || lower === '1' || lower === 'oui' || lower === 'yes' || lower === 'actif') return true;
      if (lower === 'false' || lower === '0' || lower === 'non' || lower === 'no' || lower === 'inactif') return false;
      return true; // Par défaut actif
    })
  ]).default(true),
  
  promotional_price: z.union([
    z.number().positive().nullable(),
    z.string().transform((val) => {
      if (!val || val.trim() === '') return null;
      const parsed = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
      if (isNaN(parsed)) return null;
      return parsed;
    })
  ]).optional().nullable(),
  
  stock_quantity: z.union([
    z.number().int().min(0, 'Le stock ne peut pas être négatif'),
    z.string().transform((val) => {
      if (!val || val.trim() === '') return 0;
      const parsed = parseInt(val);
      if (isNaN(parsed)) return 0;
      return Math.max(0, parsed);
    })
  ]).optional().default(0),
  
  sku: z.string()
    .max(100, 'Le SKU ne peut pas dépasser 100 caractères')
    .optional()
    .nullable()
    .transform((val) => val || null),
  
  image_url: z.string()
    .url('URL d\'image invalide')
    .optional()
    .nullable()
    .transform((val) => val || null),
});

/**
 * Type TypeScript inféré du schéma
 */
export type ProductImportData = z.infer<typeof ProductImportSchema>;

/**
 * Schéma de validation pour un tableau de produits
 */
export const ProductImportArraySchema = z.array(ProductImportSchema);

/**
 * Fonction utilitaire pour valider un produit
 * @param data - Données brutes du produit
 * @returns Résultat de la validation avec données validées ou erreurs
 */
export function validateProductImport(data: unknown) {
  return ProductImportSchema.safeParse(data);
}

/**
 * Fonction utilitaire pour valider un tableau de produits
 * @param data - Tableau de données brutes
 * @returns Résultat de la validation avec données validées ou erreurs
 */
export function validateProductsImport(data: unknown[]) {
  const results = data.map((item, index) => ({
    index,
    result: ProductImportSchema.safeParse(item),
    originalData: item,
  }));
  
  const successes = results.filter(r => r.result.success);
  const errors = results.filter(r => !r.result.success);
  
  return {
    successes: successes.map(s => ({
      index: s.index,
      data: (s.result as any).data,
    })),
    errors: errors.map(e => ({
      index: e.index,
      errors: (e.result as any).error.errors,
      originalData: e.originalData,
    })),
    total: data.length,
    successCount: successes.length,
    errorCount: errors.length,
  };
}

/**
 * Schéma de validation pour la mise à jour d'un produit existant
 * Tous les champs sont optionnels sauf si explicitement fournis
 */
export const ProductUpdateSchema = ProductImportSchema.partial();

/**
 * Type pour la mise à jour de produit
 */
export type ProductUpdateData = z.infer<typeof ProductUpdateSchema>;

