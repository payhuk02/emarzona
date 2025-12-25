/**
 * Types d'erreurs spécifiques pour Moneroo
 * Amélioration de la gestion d'erreurs avec types dédiés
 */

export class MonerooError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'MonerooError';
    Object.setPrototypeOf(this, MonerooError.prototype);
  }
}

/**
 * Erreur réseau (timeout, connexion, etc.)
 */
export class MonerooNetworkError extends MonerooError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'MonerooNetworkError';
    Object.setPrototypeOf(this, MonerooNetworkError.prototype);
  }
}

/**
 * Erreur API Moneroo (réponse d'erreur de l'API)
 */
export class MonerooAPIError extends MonerooError {
  constructor(
    message: string,
    statusCode: number,
    public readonly apiError?: unknown,
    details?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'MonerooAPIError';
    Object.setPrototypeOf(this, MonerooAPIError.prototype);
  }
}

/**
 * Erreur de timeout
 */
export class MonerooTimeoutError extends MonerooError {
  constructor(message: string = 'Request timeout', details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, details);
    this.name = 'MonerooTimeoutError';
    Object.setPrototypeOf(this, MonerooTimeoutError.prototype);
  }
}

/**
 * Erreur de validation (données invalides)
 */
export class MonerooValidationError extends MonerooError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'MonerooValidationError';
    Object.setPrototypeOf(this, MonerooValidationError.prototype);
  }
}

/**
 * Erreur d'authentification (API key invalide, etc.)
 */
export class MonerooAuthenticationError extends MonerooError {
  constructor(message: string = 'Authentication failed', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'MonerooAuthenticationError';
    Object.setPrototypeOf(this, MonerooAuthenticationError.prototype);
  }
}

/**
 * Erreur de signature webhook (signature invalide)
 */
export class MonerooWebhookSignatureError extends MonerooError {
  constructor(message: string = 'Invalid webhook signature', details?: Record<string, unknown>) {
    super(message, 'WEBHOOK_SIGNATURE_ERROR', 401, details);
    this.name = 'MonerooWebhookSignatureError';
    Object.setPrototypeOf(this, MonerooWebhookSignatureError.prototype);
  }
}

/**
 * Erreur de remboursement
 */
export class MonerooRefundError extends MonerooError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'REFUND_ERROR', 400, details);
    this.name = 'MonerooRefundError';
    Object.setPrototypeOf(this, MonerooRefundError.prototype);
  }
}

/**
 * Helper pour déterminer le type d'erreur depuis une erreur inconnue
 */
export function parseMonerooError(error: unknown): MonerooError {
  if (error instanceof MonerooError) {
    return error;
  }

  if (error instanceof Error) {
    // Erreur réseau
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return new MonerooTimeoutError(error.message);
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new MonerooNetworkError(error.message);
    }

    // Erreur d'authentification
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return new MonerooAuthenticationError(error.message);
    }

    // Erreur de validation
    if (error.message.includes('400') || error.message.includes('invalid')) {
      return new MonerooValidationError(error.message);
    }

    // Par défaut, erreur API générique
    return new MonerooAPIError(error.message, 500);
  }

  // Erreur inconnue
  return new MonerooError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  );
}







