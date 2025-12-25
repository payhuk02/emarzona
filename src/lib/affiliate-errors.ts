/**
 * Système de gestion d'erreurs centralisé pour le système d'affiliation
 * Date : Janvier 2025
 */

/**
 * Codes d'erreur du système d'affiliation
 */
export enum AffiliateErrorCode {
  // Erreurs d'affilié
  AFFILIATE_NOT_FOUND = 'AFFILIATE_NOT_FOUND',
  AFFILIATE_ALREADY_EXISTS = 'AFFILIATE_ALREADY_EXISTS',
  AFFILIATE_SUSPENDED = 'AFFILIATE_SUSPENDED',
  AFFILIATE_INACTIVE = 'AFFILIATE_INACTIVE',
  
  // Erreurs de lien
  LINK_NOT_FOUND = 'LINK_NOT_FOUND',
  LINK_INVALID = 'LINK_INVALID',
  LINK_EXPIRED = 'LINK_EXPIRED',
  LINK_ALREADY_EXISTS = 'LINK_ALREADY_EXISTS',
  
  // Erreurs de produit
  PRODUCT_AFFILIATE_DISABLED = 'PRODUCT_AFFILIATE_DISABLED',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_SETTINGS_NOT_FOUND = 'PRODUCT_SETTINGS_NOT_FOUND',
  
  // Erreurs de commission
  COMMISSION_NOT_FOUND = 'COMMISSION_NOT_FOUND',
  COMMISSION_ALREADY_PAID = 'COMMISSION_ALREADY_PAID',
  COMMISSION_INVALID_AMOUNT = 'COMMISSION_INVALID_AMOUNT',
  COMMISSION_BELOW_MINIMUM = 'COMMISSION_BELOW_MINIMUM',
  
  // Erreurs de tracking
  TRACKING_COOKIE_INVALID = 'TRACKING_COOKIE_INVALID',
  TRACKING_COOKIE_EXPIRED = 'TRACKING_COOKIE_EXPIRED',
  CLICK_NOT_FOUND = 'CLICK_NOT_FOUND',
  CLICK_ALREADY_CONVERTED = 'CLICK_ALREADY_CONVERTED',
  
  // Erreurs de retrait
  WITHDRAWAL_NOT_FOUND = 'WITHDRAWAL_NOT_FOUND',
  WITHDRAWAL_INSUFFICIENT_BALANCE = 'WITHDRAWAL_INSUFFICIENT_BALANCE',
  WITHDRAWAL_BELOW_MINIMUM = 'WITHDRAWAL_BELOW_MINIMUM',
  WITHDRAWAL_ALREADY_PROCESSED = 'WITHDRAWAL_ALREADY_PROCESSED',
  
  // Erreurs de validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Erreurs système
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Classe d'erreur personnalisée pour le système d'affiliation
 */
export class AffiliateError extends Error {
  constructor(
    message: string,
    public code: AffiliateErrorCode,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AffiliateError';
    
    // Maintient la stack trace pour le débogage
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AffiliateError);
    }
  }

  /**
   * Convertit l'erreur en format JSON pour l'API
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
    };
  }

  /**
   * Crée un message utilisateur-friendly
   */
  getUserMessage(): string {
    // Si le message personnalisé contient des informations sur une migration, l'utiliser directement
    if (this.details?.migration && this.message.includes('migration')) {
      return this.message;
    }
    
    const messages: Record<AffiliateErrorCode, string> = {
      [AffiliateErrorCode.AFFILIATE_NOT_FOUND]: 'Affilié introuvable',
      [AffiliateErrorCode.AFFILIATE_ALREADY_EXISTS]: 'Cet affilié existe déjà',
      [AffiliateErrorCode.AFFILIATE_SUSPENDED]: 'Cet affilié est suspendu',
      [AffiliateErrorCode.AFFILIATE_INACTIVE]: 'Cet affilié est inactif',
      
      [AffiliateErrorCode.LINK_NOT_FOUND]: 'Lien d\'affiliation introuvable',
      [AffiliateErrorCode.LINK_INVALID]: 'Lien d\'affiliation invalide',
      [AffiliateErrorCode.LINK_EXPIRED]: 'Ce lien d\'affiliation a expiré',
      [AffiliateErrorCode.LINK_ALREADY_EXISTS]: 'Un lien existe déjà pour ce produit',
      
      [AffiliateErrorCode.PRODUCT_AFFILIATE_DISABLED]: 'L\'affiliation n\'est pas activée pour ce produit',
      [AffiliateErrorCode.PRODUCT_NOT_FOUND]: 'Produit introuvable',
      [AffiliateErrorCode.PRODUCT_SETTINGS_NOT_FOUND]: 'Paramètres d\'affiliation introuvables',
      
      [AffiliateErrorCode.COMMISSION_NOT_FOUND]: 'Commission introuvable',
      [AffiliateErrorCode.COMMISSION_ALREADY_PAID]: 'Cette commission a déjà été payée',
      [AffiliateErrorCode.COMMISSION_INVALID_AMOUNT]: 'Montant de commission invalide',
      [AffiliateErrorCode.COMMISSION_BELOW_MINIMUM]: 'Le montant de la commande est inférieur au minimum requis',
      
      [AffiliateErrorCode.TRACKING_COOKIE_INVALID]: 'Cookie de tracking invalide',
      [AffiliateErrorCode.TRACKING_COOKIE_EXPIRED]: 'Cookie de tracking expiré',
      [AffiliateErrorCode.CLICK_NOT_FOUND]: 'Clic d\'affiliation introuvable',
      [AffiliateErrorCode.CLICK_ALREADY_CONVERTED]: 'Ce clic a déjà été converti',
      
      [AffiliateErrorCode.WITHDRAWAL_NOT_FOUND]: 'Demande de retrait introuvable',
      [AffiliateErrorCode.WITHDRAWAL_INSUFFICIENT_BALANCE]: 'Solde insuffisant pour ce retrait',
      [AffiliateErrorCode.WITHDRAWAL_BELOW_MINIMUM]: 'Le montant est inférieur au minimum de retrait (10 000 XOF)',
      [AffiliateErrorCode.WITHDRAWAL_ALREADY_PROCESSED]: 'Cette demande de retrait a déjà été traitée',
      
      [AffiliateErrorCode.VALIDATION_ERROR]: 'Erreur de validation des données',
      [AffiliateErrorCode.INVALID_INPUT]: 'Données d\'entrée invalides',
      
      [AffiliateErrorCode.DATABASE_ERROR]: 'Erreur de base de données',
      [AffiliateErrorCode.NETWORK_ERROR]: 'Erreur de réseau',
      [AffiliateErrorCode.UNKNOWN_ERROR]: 'Une erreur inconnue s\'est produite',
    };

    return messages[this.code] || this.message;
  }
}

/**
 * Factory functions pour créer des erreurs typées
 */
export const AffiliateErrors = {
  affiliateNotFound: (affiliateId?: string) =>
    new AffiliateError(
      `Affilié introuvable${affiliateId ? `: ${affiliateId}` : ''}`,
      AffiliateErrorCode.AFFILIATE_NOT_FOUND,
      404,
      { affiliateId }
    ),

  affiliateSuspended: (reason?: string) =>
    new AffiliateError(
      `Affilié suspendu${reason ? `: ${reason}` : ''}`,
      AffiliateErrorCode.AFFILIATE_SUSPENDED,
      403,
      { reason }
    ),

  linkNotFound: (linkCode?: string) =>
    new AffiliateError(
      `Lien d'affiliation introuvable${linkCode ? `: ${linkCode}` : ''}`,
      AffiliateErrorCode.LINK_NOT_FOUND,
      404,
      { linkCode }
    ),

  linkExpired: () =>
    new AffiliateError(
      'Ce lien d\'affiliation a expiré',
      AffiliateErrorCode.LINK_EXPIRED,
      410
    ),

  linkAlreadyExists: (productId?: string, existingLinkUrl?: string) =>
    new AffiliateError(
      `Un lien existe déjà pour ce produit${productId ? `: ${productId}` : ''}${existingLinkUrl ? `. Lien existant: ${existingLinkUrl}` : ''}`,
      AffiliateErrorCode.LINK_ALREADY_EXISTS,
      409,
      { productId, existingLinkUrl }
    ),

  productAffiliateDisabled: (productId?: string) =>
    new AffiliateError(
      `L'affiliation n'est pas activée pour ce produit${productId ? `: ${productId}` : ''}`,
      AffiliateErrorCode.PRODUCT_AFFILIATE_DISABLED,
      400,
      { productId }
    ),

  productNotFound: (productId?: string) =>
    new AffiliateError(
      `Produit introuvable${productId ? `: ${productId}` : ''}`,
      AffiliateErrorCode.PRODUCT_NOT_FOUND,
      404,
      { productId }
    ),

  commissionNotFound: (commissionId?: string) =>
    new AffiliateError(
      `Commission introuvable${commissionId ? `: ${commissionId}` : ''}`,
      AffiliateErrorCode.COMMISSION_NOT_FOUND,
      404,
      { commissionId }
    ),

  commissionBelowMinimum: (orderTotal: number, minimum: number) =>
    new AffiliateError(
      `Le montant de la commande (${orderTotal} XOF) est inférieur au minimum requis (${minimum} XOF)`,
      AffiliateErrorCode.COMMISSION_BELOW_MINIMUM,
      400,
      { orderTotal, minimum }
    ),

  trackingCookieExpired: () =>
    new AffiliateError(
      'Le cookie de tracking a expiré',
      AffiliateErrorCode.TRACKING_COOKIE_EXPIRED,
      410
    ),

  withdrawalInsufficientBalance: (available: number, requested: number) =>
    new AffiliateError(
      `Solde insuffisant. Disponible: ${available} XOF, Demandé: ${requested} XOF`,
      AffiliateErrorCode.WITHDRAWAL_INSUFFICIENT_BALANCE,
      400,
      { available, requested }
    ),

  withdrawalBelowMinimum: (amount: number, minimum: number = 10000) =>
    new AffiliateError(
      `Le montant (${amount} XOF) est inférieur au minimum de retrait (${minimum} XOF)`,
      AffiliateErrorCode.WITHDRAWAL_BELOW_MINIMUM,
      400,
      { amount, minimum }
    ),

  validationError: (field: string, message: string) =>
    new AffiliateError(
      `Erreur de validation: ${field} - ${message}`,
      AffiliateErrorCode.VALIDATION_ERROR,
      400,
      { field, message }
    ),

  databaseError: (error: unknown) =>
    new AffiliateError(
      'Erreur de base de données',
      AffiliateErrorCode.DATABASE_ERROR,
      500,
      { originalError: error instanceof Error ? error.message : String(error) }
    ),

  networkError: (error: unknown) =>
    new AffiliateError(
      'Erreur de réseau',
      AffiliateErrorCode.NETWORK_ERROR,
      503,
      { originalError: error instanceof Error ? error.message : String(error) }
    ),

  unknownError: (error: unknown) =>
    new AffiliateError(
      'Une erreur inconnue s\'est produite',
      AffiliateErrorCode.UNKNOWN_ERROR,
      500,
      { originalError: error instanceof Error ? error.message : String(error) }
    ),
};

/**
 * Helper pour convertir une erreur Supabase en AffiliateError
 */
export function handleSupabaseError(error: unknown): AffiliateError {
  if (error instanceof AffiliateError) {
    return error;
  }

  // Erreur Supabase
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { 
      code: string; 
      message: string; 
      details?: string; 
      hint?: string;
    };
    
    // Erreur 404 - Table ou fonction non trouvée (migration non exécutée)
    if (supabaseError.code === 'PGRST301' || supabaseError.code === '42P01' || 
        supabaseError.code === 'PGRST202' || 
        supabaseError.message?.includes('404') ||
        supabaseError.message?.includes('does not exist') ||
        supabaseError.message?.includes('not found in the schema cache')) {
      
      // Si c'est une fonction RPC pour les liens courts
      if (supabaseError.message?.includes('generate_short_link_code') || 
          supabaseError.hint?.includes('generate_short_link_code')) {
        return new AffiliateError(
          'La fonctionnalité de liens courts nécessite l\'exécution de la migration SQL: 20250131_affiliate_short_links.sql',
          AffiliateErrorCode.DATABASE_ERROR,
          503,
          { migration: '20250131_affiliate_short_links.sql', type: 'rpc_function' }
        );
      }
      
      // Si c'est la table affiliate_short_links
      if (supabaseError.message?.includes('affiliate_short_links') || 
          supabaseError.details?.includes('affiliate_short_links') ||
          supabaseError.message?.includes('relation "affiliate_short_links"')) {
        return new AffiliateError(
          'La fonctionnalité de liens courts nécessite l\'exécution de la migration SQL: 20250131_affiliate_short_links.sql',
          AffiliateErrorCode.DATABASE_ERROR,
          503,
          { migration: '20250131_affiliate_short_links.sql', type: 'table' }
        );
      }
      
      // Erreur générique de ressource non trouvée
      return AffiliateErrors.linkNotFound();
    }
    
    // Erreurs de contrainte unique
    if (supabaseError.code === '23505') {
      // Vérifier si c'est une erreur de lien existant
      if (supabaseError.message?.includes('affiliate_links') || supabaseError.message?.includes('affiliate_id') || supabaseError.message?.includes('product_id')) {
        return new AffiliateError(
          'Un lien existe déjà pour ce produit',
          AffiliateErrorCode.LINK_ALREADY_EXISTS,
          409
        );
      }
      return new AffiliateError(
        'Cette entrée existe déjà',
        AffiliateErrorCode.AFFILIATE_ALREADY_EXISTS,
        409
      );
    }
    
    // Erreur de clé étrangère
    if (supabaseError.code === '23503') {
      return AffiliateErrors.databaseError(error);
    }
    
    // Erreur de valeur nulle
    if (supabaseError.code === '23502') {
      return AffiliateErrors.validationError('required_field', 'Un champ requis est manquant');
    }
    
    // Erreur de permission
    if (supabaseError.code === '42501') {
      return AffiliateErrors.databaseError(error);
    }
  }

  // Erreur réseau
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return AffiliateErrors.networkError(error);
  }

  // Erreur inconnue
  return AffiliateErrors.unknownError(error);
}

/**
 * Type guard pour vérifier si une erreur est une AffiliateError
 */
export function isAffiliateError(error: unknown): error is AffiliateError {
  return error instanceof AffiliateError;
}

