/**
 * Utilitaires pour les opérations avec retry
 * Fournit des fonctions réutilisables pour gérer les retries avec différentes stratégies
 */

export interface RetryOptions {
  /**
   * Nombre maximum de tentatives (incluant la première)
   * @default 3
   */
  maxRetries?: number;
  /**
   * Délai initial en millisecondes
   * @default 1000
   */
  initialDelay?: number;
  /**
   * Délai maximum en millisecondes
   * @default 30000
   */
  maxDelay?: number;
  /**
   * Multiplicateur pour le backoff exponentiel
   * @default 2
   */
  multiplier?: number;
  /**
   * Activer le jitter (variation aléatoire)
   * @default false
   */
  jitter?: boolean;
  /**
   * Fonction pour déterminer si une erreur peut être retentée
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /**
   * Callback appelé avant chaque retry
   */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
  /**
   * Callback appelé quand le maximum de tentatives est atteint
   */
  onMaxRetries?: (error: unknown, attempts: number) => void;
}

export type RetryStrategy = 'exponential' | 'linear' | 'fixed';

/**
 * Calcule le délai de retry selon la stratégie
 */
function calculateRetryDelay(
  attempt: number,
  strategy: RetryStrategy,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  let  delay: number;

  switch (strategy) {
    case 'exponential':
      delay = initialDelay * Math.pow(multiplier, attempt);
      break;
    case 'linear':
      delay = initialDelay * (attempt + 1);
      break;
    case 'fixed':
      delay = initialDelay;
      break;
    default:
      delay = initialDelay;
  }

  // Appliquer le jitter si activé
  if (jitter) {
    const jitterAmount = delay * 0.1; // 10% de variation
    delay = delay + (Math.random() * 2 - 1) * jitterAmount;
  }

  // Limiter au délai maximum
  return Math.min(delay, maxDelay);
}

/**
 * Vérifie si une erreur peut être retentée par défaut
 */
function defaultShouldRetry(error: unknown, attempt: number): boolean {
  // Ne pas retry si c'est une erreur de validation ou d'authentification
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('validation') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('400') ||
      message.includes('422')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Exécute une fonction avec retry automatique
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { strategy?: RetryStrategy } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    multiplier = 2,
    jitter = false,
    strategy = 'exponential',
    shouldRetry = defaultShouldRetry,
    onRetry,
    onMaxRetries,
  } = options;

  let  lastError: unknown;
  let  attempt= 0;

  while (attempt < maxRetries) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Vérifier si on peut retry
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // Si c'est la dernière tentative, lancer l'erreur
      if (attempt === maxRetries - 1) {
        onMaxRetries?.(error, attempt + 1);
        throw error;
      }

      // Calculer le délai
      const delay = calculateRetryDelay(
        attempt,
        strategy,
        initialDelay,
        maxDelay,
        multiplier,
        jitter
      );

      onRetry?.(attempt + 1, delay, error);

      // Attendre avant de réessayer
      await new Promise((resolve) => setTimeout(resolve, delay));

      attempt++;
    }
  }

  // Ne devrait jamais arriver
  throw lastError;
}

/**
 * Crée une fonction avec retry automatique
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions & { strategy?: RetryStrategy } = {}
): T {
  return ((...args: Parameters<T>) => {
    return retry(() => fn(...args), options);
  }) as T;
}

/**
 * Retry avec backoff exponentiel
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'strategy'> = {}
): Promise<T> {
  return retry(fn, { ...options, strategy: 'exponential' });
}

/**
 * Retry avec backoff linéaire
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'strategy'> = {}
): Promise<T> {
  return retry(fn, { ...options, strategy: 'linear' });
}

/**
 * Retry avec délai fixe
 */
export async function retryWithFixedDelay<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'strategy'> = {}
): Promise<T> {
  return retry(fn, { ...options, strategy: 'fixed' });
}







