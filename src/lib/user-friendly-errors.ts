/**
 * User-Friendly Error Messages
 * Date: 28 Janvier 2025
 * 
 * Système de messages d'erreur user-friendly avec contexte,
 * suggestions d'actions et support multilingue
 */

import { ErrorType, ErrorSeverity, NormalizedError } from './error-handling';

/**
 * Type d'action suggérée pour résoudre l'erreur
 */
export type SuggestedAction = 
  | 'retry'              // Réessayer l'opération
  | 'refresh'            // Rafraîchir la page
  | 'check-connection'    // Vérifier la connexion
  | 'check-permissions'  // Vérifier les permissions
  | 'contact-support'    // Contacter le support
  | 'check-input'        // Vérifier les données saisies
  | 'login'              // Se connecter
  | 'clear-cache'        // Vider le cache
  | 'update-browser'     // Mettre à jour le navigateur
  | 'none';              // Aucune action suggérée

/**
 * Message d'erreur user-friendly avec contexte
 */
export interface UserFriendlyError {
  /**
   * Titre de l'erreur (court, clair)
   */
  title: string;

  /**
   * Description détaillée de l'erreur
   */
  description: string;

  /**
   * Message technique (pour debug, optionnel)
   */
  technicalMessage?: string;

  /**
   * Actions suggérées pour résoudre l'erreur
   */
  suggestedActions: SuggestedAction[];

  /**
   * Message d'aide supplémentaire
   */
  helpText?: string;

  /**
   * Code d'erreur (pour support)
   */
  errorCode?: string;

  /**
   * Sévérité de l'erreur
   */
  severity: ErrorSeverity;

  /**
   * Icône suggérée (nom de l'icône Lucide)
   */
  icon?: string;

  /**
   * Durée d'affichage suggérée (ms)
   */
  duration?: number;
}

/**
 * Mapping des types d'erreurs vers messages user-friendly
 */
const ERROR_MESSAGES: Record<ErrorType, (error: NormalizedError, context?: Record<string, unknown>) => UserFriendlyError> = {
  [ErrorType.NETWORK_ERROR]: (error, context) => ({
    title: 'Problème de connexion',
    description: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.',
    technicalMessage: error.message,
    suggestedActions: ['check-connection', 'retry'],
    helpText: 'Si le problème persiste, vérifiez votre connexion Wi-Fi ou réseau mobile.',
    severity: ErrorSeverity.HIGH,
    icon: 'WifiOff',
    duration: 8000,
  }),

  [ErrorType.TIMEOUT_ERROR]: (error, context) => ({
    title: 'Temps d\'attente dépassé',
    description: 'L\'opération a pris trop de temps. Le serveur n\'a pas répondu à temps.',
    technicalMessage: error.message,
    suggestedActions: ['retry', 'check-connection'],
    helpText: 'Cela peut arriver si votre connexion est lente ou si le serveur est surchargé.',
    severity: ErrorSeverity.MEDIUM,
    icon: 'Clock',
    duration: 6000,
  }),

  [ErrorType.PERMISSION_DENIED]: (error, context) => ({
    title: 'Accès refusé',
    description: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    technicalMessage: error.message,
    suggestedActions: ['check-permissions', 'contact-support'],
    helpText: 'Contactez votre administrateur si vous pensez que c\'est une erreur.',
    severity: ErrorSeverity.HIGH,
    icon: 'ShieldAlert',
    duration: 8000,
  }),

  [ErrorType.UNAUTHORIZED]: (error, context) => ({
    title: 'Session expirée',
    description: 'Votre session a expiré. Veuillez vous reconnecter pour continuer.',
    technicalMessage: error.message,
    suggestedActions: ['login', 'refresh'],
    helpText: 'Vous serez redirigé vers la page de connexion.',
    severity: ErrorSeverity.MEDIUM,
    icon: 'LogIn',
    duration: 5000,
  }),

  [ErrorType.NOT_FOUND]: (error, context) => {
    const resource = context?.resource as string || 'ressource';
    return {
      title: `${resource} introuvable`,
      description: `La ${resource} que vous recherchez n'existe pas ou a été supprimée.`,
      technicalMessage: error.message,
      suggestedActions: ['refresh', 'contact-support'],
      helpText: 'Si vous pensez que c\'est une erreur, contactez le support.',
      severity: ErrorSeverity.MEDIUM,
      icon: 'SearchX',
      duration: 6000,
    };
  },

  [ErrorType.RESOURCE_MISSING]: (error, context) => ({
    title: 'Ressource manquante',
    description: 'Une ressource nécessaire est manquante. Veuillez réessayer ou contacter le support.',
    technicalMessage: error.message,
    suggestedActions: ['retry', 'contact-support'],
    helpText: 'Cette erreur peut être temporaire. Réessayez dans quelques instants.',
    severity: ErrorSeverity.HIGH,
    icon: 'FileQuestion',
    duration: 7000,
  }),

  [ErrorType.VALIDATION_ERROR]: (error, context) => {
    const field = context?.field as string || 'champ';
    return {
      title: 'Données invalides',
      description: `Le ${field} que vous avez saisi n'est pas valide. Veuillez vérifier et corriger.`,
      technicalMessage: error.message,
      suggestedActions: ['check-input'],
      helpText: 'Vérifiez que tous les champs obligatoires sont remplis correctement.',
      severity: ErrorSeverity.MEDIUM,
      icon: 'AlertCircle',
      duration: 6000,
    };
  },

  [ErrorType.INVALID_INPUT]: (error, context) => ({
    title: 'Saisie invalide',
    description: 'Les données que vous avez saisies ne sont pas au bon format. Veuillez vérifier.',
    technicalMessage: error.message,
    suggestedActions: ['check-input'],
      helpText: 'Assurez-vous que tous les champs sont remplis selon le format attendu.',
    severity: ErrorSeverity.MEDIUM,
    icon: 'FileX',
    duration: 6000,
  }),

  [ErrorType.TABLE_NOT_EXISTS]: (error, context) => ({
    title: 'Erreur de configuration',
    description: 'Une table de base de données est manquante. Veuillez contacter le support technique.',
    technicalMessage: error.message,
    suggestedActions: ['contact-support'],
    helpText: 'Cette erreur nécessite une intervention technique. Le support a été notifié.',
    severity: ErrorSeverity.CRITICAL,
    icon: 'Database',
    duration: 10000,
  }),

  [ErrorType.FUNCTION_NOT_EXISTS]: (error, context) => ({
    title: 'Erreur de configuration',
    description: 'Une fonction de base de données est manquante. Veuillez contacter le support technique.',
    technicalMessage: error.message,
    suggestedActions: ['contact-support'],
    helpText: 'Cette erreur nécessite une intervention technique. Le support a été notifié.',
    severity: ErrorSeverity.CRITICAL,
    icon: 'Database',
    duration: 10000,
  }),

  [ErrorType.CONSTRAINT_VIOLATION]: (error, context) => {
    const constraint = context?.constraint as string || 'contrainte';
    return {
      title: 'Données en conflit',
      description: `Les données que vous avez saisies violent une ${constraint}. Veuillez vérifier.`,
      technicalMessage: error.message,
      suggestedActions: ['check-input'],
      helpText: 'Vérifiez que les valeurs saisies respectent toutes les règles (ex: unicité, format).',
      severity: ErrorSeverity.MEDIUM,
      icon: 'AlertTriangle',
      duration: 7000,
    };
  },

  [ErrorType.CRITICAL_ERROR]: (error, context) => ({
    title: 'Erreur critique',
    description: 'Une erreur critique s\'est produite. L\'application peut ne pas fonctionner correctement.',
    technicalMessage: error.message,
    suggestedActions: ['refresh', 'clear-cache', 'contact-support'],
    helpText: 'Essayez de rafraîchir la page. Si le problème persiste, contactez le support.',
    severity: ErrorSeverity.CRITICAL,
    icon: 'AlertCircle',
    duration: 15000,
  }),

  [ErrorType.NON_CRITICAL]: (error, context) => ({
    title: 'Avertissement',
    description: error.userMessage || 'Une opération a échoué, mais cela n\'affecte pas le fonctionnement général.',
    technicalMessage: error.message,
    suggestedActions: ['retry'],
    severity: ErrorSeverity.LOW,
    icon: 'Info',
    duration: 4000,
  }),

  [ErrorType.UNKNOWN]: (error, context) => ({
    title: 'Erreur inattendue',
    description: 'Une erreur inattendue s\'est produite. Veuillez réessayer ou contacter le support si le problème persiste.',
    technicalMessage: error.message,
    suggestedActions: ['retry', 'refresh', 'contact-support'],
    helpText: 'Si cette erreur se répète, contactez le support avec le code d\'erreur.',
    errorCode: error.code,
    severity: ErrorSeverity.HIGH,
    icon: 'AlertCircle',
    duration: 8000,
  }),
};

/**
 * Messages spécifiques par contexte d'opération
 */
const CONTEXT_MESSAGES: Record<string, (error: NormalizedError, context?: Record<string, unknown>) => Partial<UserFriendlyError>> = {
  'product.create': (error, context) => ({
    title: 'Impossible de créer le produit',
    description: 'Une erreur s\'est produite lors de la création du produit. Vérifiez les informations saisies.',
    suggestedActions: ['check-input', 'retry'],
  }),

  'product.update': (error, context) => ({
    title: 'Impossible de mettre à jour le produit',
    description: 'Une erreur s\'est produite lors de la mise à jour. Vérifiez les modifications apportées.',
    suggestedActions: ['check-input', 'retry'],
  }),

  'product.delete': (error, context) => ({
    title: 'Impossible de supprimer le produit',
    description: 'Le produit ne peut pas être supprimé. Il est peut-être utilisé dans des commandes.',
    suggestedActions: ['contact-support'],
  }),

  'order.create': (error, context) => ({
    title: 'Impossible de créer la commande',
    description: 'Une erreur s\'est produite lors de la création de la commande. Vérifiez votre panier.',
    suggestedActions: ['check-input', 'retry'],
  }),

  'order.payment': (error, context) => ({
    title: 'Paiement échoué',
    description: 'Le paiement n\'a pas pu être traité. Vérifiez vos informations de paiement.',
    suggestedActions: ['check-input', 'retry', 'contact-support'],
  }),

  'upload.file': (error, context) => {
    const fileSize = context?.fileSize as number;
    const maxSize = context?.maxSize as number;
    return {
      title: 'Téléchargement échoué',
      description: fileSize && maxSize && fileSize > maxSize
        ? `Le fichier est trop volumineux (max: ${(maxSize / 1024 / 1024).toFixed(0)}MB).`
        : 'Une erreur s\'est produite lors du téléchargement du fichier.',
      suggestedActions: ['retry', 'check-input'],
    };
  },

  'auth.login': (error, context) => ({
    title: 'Connexion échouée',
    description: 'Les identifiants sont incorrects ou le compte n\'existe pas.',
    suggestedActions: ['check-input', 'retry'],
  }),

  'auth.register': (error, context) => ({
    title: 'Inscription échouée',
    description: 'Impossible de créer le compte. Vérifiez que l\'email n\'est pas déjà utilisé.',
    suggestedActions: ['check-input', 'retry'],
  }),
};

/**
 * Génère un message d'erreur user-friendly
 */
export function getUserFriendlyError(
  error: NormalizedError,
  context?: {
    operation?: string;
    resource?: string;
    field?: string;
    constraint?: string;
    fileSize?: number;
    maxSize?: number;
    [key: string]: unknown;
  }
): UserFriendlyError {
  // Récupérer le message de base selon le type d'erreur
  const baseMessage = ERROR_MESSAGES[error.type](error, context);

  // Appliquer les messages spécifiques au contexte si disponibles
  const contextMessage = context?.operation && CONTEXT_MESSAGES[context.operation]
    ? CONTEXT_MESSAGES[context.operation](error, context)
    : {};

  // Fusionner les messages (le contexte override le message de base)
  return {
    ...baseMessage,
    ...contextMessage,
    // Garder les valeurs de base si le contexte ne les fournit pas
    suggestedActions: contextMessage.suggestedActions || baseMessage.suggestedActions,
    severity: contextMessage.severity || baseMessage.severity,
    icon: contextMessage.icon || baseMessage.icon,
    duration: contextMessage.duration || baseMessage.duration,
    errorCode: error.code || baseMessage.errorCode,
  };
}

/**
 * Génère le texte d'action suggérée
 */
export function getActionText(action: SuggestedAction): string {
  const actions: Record<SuggestedAction, string> = {
    retry: 'Réessayer',
    refresh: 'Rafraîchir la page',
    'check-connection': 'Vérifier la connexion',
    'check-permissions': 'Vérifier les permissions',
    'contact-support': 'Contacter le support',
    'check-input': 'Vérifier les données',
    login: 'Se connecter',
    'clear-cache': 'Vider le cache',
    'update-browser': 'Mettre à jour le navigateur',
    none: '',
  };
  return actions[action] || '';
}

/**
 * Génère un message d'erreur court (pour toasts)
 */
export function getShortErrorMessage(error: NormalizedError, context?: Record<string, unknown>): string {
  const friendly = getUserFriendlyError(error, context);
  return friendly.description;
}

/**
 * Génère un titre d'erreur court
 */
export function getShortErrorTitle(error: NormalizedError, context?: Record<string, unknown>): string {
  const friendly = getUserFriendlyError(error, context);
  return friendly.title;
}

