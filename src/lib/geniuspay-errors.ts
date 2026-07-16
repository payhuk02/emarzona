/**
 * Types d'erreurs spécifiques pour GeniusPay
 * Amélioration de la gestion d'erreurs avec types dédiés
 */

export class GeniusPayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GeniusPayError';
    Object.setPrototypeOf(this, GeniusPayError.prototype);
  }
}

/**
 * Erreur réseau (timeout, connexion, etc.)
 */
export class GeniusPayNetworkError extends GeniusPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'GeniusPayNetworkError';
    Object.setPrototypeOf(this, GeniusPayNetworkError.prototype);
  }
}

/**
 * Erreur API GeniusPay (réponse d'erreur de l'API)
 */
export class GeniusPayAPIError extends GeniusPayError {
  constructor(
    message: string,
    statusCode: number,
    public readonly apiError?: unknown,
    details?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'GeniusPayAPIError';
    Object.setPrototypeOf(this, GeniusPayAPIError.prototype);
  }
}

/**
 * Erreur de timeout
 */
export class GeniusPayTimeoutError extends GeniusPayError {
  constructor(message: string = 'Request timeout', details?: Record<string, unknown>) {
    super(message, 'TIMEOUT_ERROR', 408, details);
    this.name = 'GeniusPayTimeoutError';
    Object.setPrototypeOf(this, GeniusPayTimeoutError.prototype);
  }
}

/**
 * Erreur de validation (données invalides)
 */
export class GeniusPayValidationError extends GeniusPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'GeniusPayValidationError';
    Object.setPrototypeOf(this, GeniusPayValidationError.prototype);
  }
}

/**
 * Erreur d'authentification (API key invalide, etc.)
 */
export class GeniusPayAuthenticationError extends GeniusPayError {
  constructor(message: string = 'Authentication failed', details?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'GeniusPayAuthenticationError';
    Object.setPrototypeOf(this, GeniusPayAuthenticationError.prototype);
  }
}

/**
 * Erreur de signature webhook (signature invalide)
 */
export class GeniusPayWebhookSignatureError extends GeniusPayError {
  constructor(message: string = 'Invalid webhook signature', details?: Record<string, unknown>) {
    super(message, 'WEBHOOK_SIGNATURE_ERROR', 401, details);
    this.name = 'GeniusPayWebhookSignatureError';
    Object.setPrototypeOf(this, GeniusPayWebhookSignatureError.prototype);
  }
}

/**
 * Erreur de remboursement
 */
export class GeniusPayRefundError extends GeniusPayError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'REFUND_ERROR', 400, details);
    this.name = 'GeniusPayRefundError';
    Object.setPrototypeOf(this, GeniusPayRefundError.prototype);
  }
}

/**
 * Helper pour déterminer le type d'erreur depuis une erreur inconnue
 */
export function parseGeniusPayError(error: unknown): GeniusPayError {
  if (error instanceof GeniusPayError) {
    return error;
  }

  if (error instanceof Error) {
    // Erreur réseau
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return new GeniusPayTimeoutError(error.message);
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new GeniusPayNetworkError(error.message);
    }

    // Erreur d'authentification
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return new GeniusPayAuthenticationError(error.message);
    }

    // Erreur de validation
    if (error.message.includes('400') || error.message.includes('invalid')) {
      return new GeniusPayValidationError(error.message);
    }

    // Par défaut, erreur API générique
    return new GeniusPayAPIError(error.message, 500);
  }

  // Erreur inconnue
  return new GeniusPayError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { originalError: error }
  );
}













