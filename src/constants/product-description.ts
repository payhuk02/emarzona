import { countPlainTextWords } from '@/lib/string-utils';

/** Limite de mots pour les descriptions riches (texte brut, sans balises HTML). */
export const PRODUCT_DESCRIPTION_MAX_WORDS = 5000;

export function isProductDescriptionWithinWordLimit(
  htmlOrText: string | null | undefined
): boolean {
  return countPlainTextWords(htmlOrText) <= PRODUCT_DESCRIPTION_MAX_WORDS;
}

export const PRODUCT_DESCRIPTION_WORD_LIMIT_MESSAGE = `La description ne peut pas dépasser ${PRODUCT_DESCRIPTION_MAX_WORDS} mots`;
