/**
 * Promotion Validation Utilities
 * Date: 30 Janvier 2025
 * 
 * Utilitaires de validation pour les codes promo et promotions
 */

import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valide le format d'un code promo
 * - Alphanumérique en majuscules
 * - 3 à 20 caractères
 * - Pas d'espaces ni caractères spéciaux
 */
export const validateCodeFormat = (code: string): ValidationResult => {
  const  errors: string[] = [];
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    errors.push("Le code promo est requis");
    return { valid: false, errors };
  }

  if (normalizedCode.length < 3) {
    errors.push("Le code doit contenir au moins 3 caractères");
  }

  if (normalizedCode.length > 20) {
    errors.push("Le code ne peut pas dépasser 20 caractères");
  }

  if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
    errors.push("Le code doit être alphanumérique (lettres et chiffres uniquement)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valide la valeur de réduction selon le type
 */
export const validateDiscountValue = (
  discountType: string,
  discountValue: number | string
): ValidationResult => {
  const  errors: string[] = [];
  const value = typeof discountValue === "string" ? parseFloat(discountValue) : discountValue;

  if (isNaN(value) || value <= 0) {
    errors.push("La valeur de réduction doit être positive");
    return { valid: false, errors };
  }

  if (discountType === "percentage" || discountType === "percentage") {
    if (value > 100) {
      errors.push("Le pourcentage ne peut pas dépasser 100%");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valide la cohérence des dates
 */
export const validateDates = (
  startDate: string | null,
  endDate: string | null
): ValidationResult => {
  const  errors: string[] = [];

  if (!startDate && !endDate) {
    return { valid: true, errors: [] };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime())) {
      errors.push("La date de début est invalide");
    }

    if (isNaN(end.getTime())) {
      errors.push("La date de fin est invalide");
    }

    if (start >= end) {
      errors.push("La date de fin doit être après la date de début");
    }

    if (end < now) {
      errors.push("La date de fin ne peut pas être dans le passé");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Valide toutes les données d'une promotion
 */
export const validatePromotionData = (data: {
  code: string;
  discount_type: string;
  discount_value: number | string;
  start_date?: string | null;
  end_date?: string | null;
  min_purchase_amount?: number | string;
  max_uses?: number | string;
}): ValidationResult => {
  const  allErrors: string[] = [];

  // Validation du code
  const codeValidation = validateCodeFormat(data.code);
  if (!codeValidation.valid) {
    allErrors.push(...codeValidation.errors);
  }

  // Validation de la valeur de réduction
  const discountValidation = validateDiscountValue(data.discount_type, data.discount_value);
  if (!discountValidation.valid) {
    allErrors.push(...discountValidation.errors);
  }

  // Validation des dates
  const datesValidation = validateDates(data.start_date || null, data.end_date || null);
  if (!datesValidation.valid) {
    allErrors.push(...datesValidation.errors);
  }

  // Validation du montant minimum
  if (data.min_purchase_amount !== undefined && data.min_purchase_amount !== null) {
    const minAmount = typeof data.min_purchase_amount === "string" 
      ? parseFloat(data.min_purchase_amount) 
      : data.min_purchase_amount;
    if (isNaN(minAmount) || minAmount < 0) {
      allErrors.push("Le montant minimum d'achat doit être positif ou nul");
    }
  }

  // Validation du nombre max d'utilisations
  if (data.max_uses !== undefined && data.max_uses !== null && data.max_uses !== "") {
    const maxUses = typeof data.max_uses === "string" ? parseInt(data.max_uses) : data.max_uses;
    if (isNaN(maxUses) || maxUses < 1) {
      allErrors.push("Le nombre maximum d'utilisations doit être supérieur à 0");
    }
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Vérifie l'unicité d'un code promo dans un store
 * Vérifie dans les tables promotions et product_promotions
 */
export const checkCodeUniqueness = async (
  code: string,
  storeId: string,
  excludeId?: string,
  tableName: "promotions" | "product_promotions" = "promotions"
): Promise<{ unique: boolean; error?: string }> => {
  try {
    const normalizedCode = code.trim().toUpperCase();
    
    // Vérifier dans la table spécifiée
    let  query= supabase
      .from(tableName)
      .select("id")
      .eq("code", normalizedCode)
      .eq("store_id", storeId);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { unique: false, error: "Erreur lors de la vérification" };
    }

    if (data) {
      return { unique: false, error: "Ce code promo existe déjà" };
    }

    // Vérifier aussi dans l'autre table pour éviter les doublons entre systèmes
    const otherTable = tableName === "promotions" ? "product_promotions" : "promotions";
    const otherQuery = supabase
      .from(otherTable)
      .select("id")
      .eq("code", normalizedCode)
      .eq("store_id", storeId);

    const { data: otherData, error: otherError } = await otherQuery.maybeSingle();

    if (otherError) {
      return { unique: false, error: "Erreur lors de la vérification" };
    }

    if (otherData) {
      return { unique: false, error: "Ce code promo existe déjà dans un autre système" };
    }

    return { unique: true };
  } catch ( _error: any) {
    return { unique: false, error: "Erreur lors de la vérification de l'unicité" };
  }
};

/**
 * Obtient un message d'erreur spécifique selon le code d'erreur PostgreSQL
 */
export const getErrorMessage = (error: any): string => {
  // Erreurs de contrainte PostgreSQL
  if (error?.code === "23505") {
    // Violation contrainte unique
    if (error.message?.includes("code")) {
      return "Ce code promo existe déjà pour ce store";
    }
    return "Cette valeur existe déjà";
  }

  if (error?.code === "23503") {
    // Violation clé étrangère
    if (error.message?.includes("store_id")) {
      return "Store invalide ou non autorisé";
    }
    return "Référence invalide";
  }

  if (error?.code === "23514") {
    // Violation contrainte CHECK
    return "Les données ne respectent pas les contraintes de validation";
  }

  // Erreurs réseau
  if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
    return "Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.";
  }

  // Erreur par défaut
  return error?.message || "Une erreur est survenue lors de la création de la promotion";
};







