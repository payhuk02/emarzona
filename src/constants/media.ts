/**
 * Constantes pour l'affichage des médias
 */

export const MEDIA_SIZES = {
  /** Miniature (128px) - Pour les listes et aperçus */
  thumbnail: {
    width: 'max-w-32',
    height: 'max-h-32',
    className: 'max-w-32 max-h-32',
  },
  /** Taille moyenne (280-320px) - Pour les messages */
  medium: {
    width: 'max-w-[280px] sm:max-w-[320px]',
    height: 'max-h-64',
    className: 'max-w-[280px] sm:max-w-[320px] max-h-64',
  },
  /** Taille grande (pleine largeur) - Pour les détails */
  large: {
    width: 'max-w-full',
    height: 'max-h-96',
    className: 'max-w-full max-h-96',
  },
} as const;

export type MediaSize = keyof typeof MEDIA_SIZES;

/**
 * Tailles par défaut pour chaque contexte
 */
export const DEFAULT_MEDIA_SIZES = {
  /** Messages dans les conversations */
  conversation: 'medium' as MediaSize,
  /** Liste de conversations */
  conversationList: 'thumbnail' as MediaSize,
  /** Détails d'un message */
  messageDetail: 'large' as MediaSize,
  /** Aperçu dans les notifications */
  notification: 'thumbnail' as MediaSize,
} as const;
