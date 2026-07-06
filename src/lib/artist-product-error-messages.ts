/**
 * 💬 ARTIST PRODUCT ERROR MESSAGES - Phase 3 UX
 * Date: 31 Janvier 2025
 *
 * Messages d'erreur améliorés avec suggestions de correction
 */

import {
  PRODUCT_DESCRIPTION_MAX_WORDS,
  PRODUCT_DESCRIPTION_WORD_LIMIT_MESSAGE,
} from '@/constants/product-description';
import { countPlainTextWords, htmlToPlainTextForCount } from '@/lib/string-utils';

export interface ErrorMessageWithSuggestion {
  error: string;
  suggestion?: string;
  field?: string;
}

/**
 * Génère un message d'erreur avec suggestion pour un champ vide
 */
export function getRequiredFieldError(fieldName: string): ErrorMessageWithSuggestion {
  return {
    error: `${fieldName} est requis`,
    suggestion: `Veuillez remplir le champ "${fieldName}" pour continuer`,
    field: fieldName,
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une longueur minimale
 */
export function getMinLengthError(
  fieldName: string,
  minLength: number,
  currentLength: number
): ErrorMessageWithSuggestion {
  const missing = minLength - currentLength;
  return {
    error: `${fieldName} doit contenir au moins ${minLength} caractères`,
    suggestion: `Il manque ${missing} caractère${missing > 1 ? 's' : ''}. Ajoutez plus de détails pour compléter ce champ.`,
    field: fieldName,
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une longueur maximale
 */
export function getMaxLengthError(
  fieldName: string,
  maxLength: number,
  currentLength: number
): ErrorMessageWithSuggestion {
  const excess = currentLength - maxLength;
  return {
    error: `${fieldName} ne peut pas dépasser ${maxLength} caractères`,
    suggestion: `Réduisez de ${excess} caractère${excess > 1 ? 's' : ''} pour respecter la limite.`,
    field: fieldName,
  };
}

/**
 * Génère un message d'erreur avec suggestion pour un prix invalide
 */
export function getPriceError(price: number | null | undefined): ErrorMessageWithSuggestion {
  if (price === null || price === undefined || price === 0) {
    return {
      error: 'Le prix est requis',
      suggestion: 'Entrez un prix supérieur à 0 XOF pour votre œuvre',
    };
  }

  if (price < 0) {
    return {
      error: 'Le prix ne peut pas être négatif',
      suggestion: 'Entrez un prix positif (ex: 50000 XOF)',
    };
  }

  if (price > 999999999.99) {
    return {
      error: 'Le prix est trop élevé',
      suggestion: 'Le prix maximum est 999,999,999.99 XOF. Réduisez le montant.',
    };
  }

  return {
    error: 'Format de prix invalide',
    suggestion: 'Utilisez un format numérique avec maximum 2 décimales (ex: 50000.00)',
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une URL invalide
 */
export function getURLError(url: string, fieldName: string = 'URL'): ErrorMessageWithSuggestion {
  if (!url || !url.trim()) {
    return {
      error: `${fieldName} est vide`,
      suggestion: 'Entrez une URL valide commençant par http:// ou https://',
    };
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      error: "Format d'URL invalide",
      suggestion: `Ajoutez "https://" au début de votre URL. Exemple: https://${url}`,
    };
  }

  return {
    error: 'URL invalide',
    suggestion: "Vérifiez que l'URL est correcte et accessible (ex: https://example.com)",
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une URL de réseau social
 */
export function getSocialURLError(
  url: string,
  network: 'instagram' | 'facebook' | 'twitter' | 'youtube'
): ErrorMessageWithSuggestion {
  const networkNames = {
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter/X',
    youtube: 'YouTube',
  };

  const networkDomains = {
    instagram: 'instagram.com',
    facebook: 'facebook.com ou fb.com',
    twitter: 'twitter.com ou x.com',
    youtube: 'youtube.com ou youtu.be',
  };

  if (!url || !url.trim()) {
    return {
      error: `URL ${networkNames[network]} est vide`,
      suggestion: `Entrez votre URL ${networkNames[network]} (ex: https://${network === 'instagram' ? 'instagram.com' : network === 'facebook' ? 'facebook.com' : network === 'twitter' ? 'twitter.com' : 'youtube.com'}/votre-profil)`,
    };
  }

  return {
    error: `URL ${networkNames[network]} invalide`,
    suggestion: `L'URL doit contenir ${networkDomains[network]}. Exemple: https://${network === 'instagram' ? 'instagram.com' : network === 'facebook' ? 'facebook.com' : network === 'twitter' ? 'twitter.com' : 'youtube.com'}/votre-profil`,
  };
}

/**
 * Génère un message d'erreur avec suggestion pour un ISBN invalide
 */
export function getISBNError(isbn: string): ErrorMessageWithSuggestion {
  if (!isbn || !isbn.trim()) {
    return {
      error: 'ISBN est vide',
      suggestion:
        'Entrez un ISBN-10 (10 chiffres) ou ISBN-13 (13 chiffres commençant par 978 ou 979)',
    };
  }

  const cleanISBN = isbn.replace(/[-\s]/g, '');

  if (cleanISBN.length < 10) {
    return {
      error: 'ISBN trop court',
      suggestion: 'Un ISBN doit contenir 10 chiffres (ISBN-10) ou 13 chiffres (ISBN-13)',
    };
  }

  if (cleanISBN.length > 13) {
    return {
      error: 'ISBN trop long',
      suggestion:
        "Un ISBN ne peut pas dépasser 13 chiffres. Vérifiez que vous n'avez pas ajouté d'espaces ou de caractères supplémentaires.",
    };
  }

  return {
    error: 'Format ISBN invalide',
    suggestion: 'Format attendu: ISBN-10 (ex: 2-1234-5678-9) ou ISBN-13 (ex: 978-2-1234-5678-9)',
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une édition limitée
 */
export function getEditionError(
  editionNumber: number | null | undefined,
  totalEditions: number | null | undefined
): ErrorMessageWithSuggestion {
  if (!editionNumber || !totalEditions) {
    return {
      error: "Informations d'édition incomplètes",
      suggestion:
        "Pour une édition limitée, renseignez le numéro d'édition (ex: 1) et le total d'éditions (ex: 100)",
    };
  }

  if (editionNumber > totalEditions) {
    return {
      error: "Numéro d'édition invalide",
      suggestion: `Le numéro d'édition (${editionNumber}) ne peut pas être supérieur au total (${totalEditions}). Vérifiez vos valeurs.`,
    };
  }

  return {
    error: "Erreur d'édition",
    suggestion: "Vérifiez que le numéro d'édition et le total sont cohérents",
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une description trop courte
 */
export function getDescriptionError(
  description: string | null | undefined
): ErrorMessageWithSuggestion {
  const plainText = htmlToPlainTextForCount(description);

  if (!plainText) {
    return {
      error: 'Description requise',
      suggestion:
        'Ajoutez une description détaillée de votre œuvre (minimum 10 caractères). Décrivez son histoire, sa signification, sa technique...',
    };
  }

  if (countPlainTextWords(description) > PRODUCT_DESCRIPTION_MAX_WORDS) {
    return {
      error: 'Description trop longue',
      suggestion: PRODUCT_DESCRIPTION_WORD_LIMIT_MESSAGE,
    };
  }

  if (plainText.length < 10) {
    const missing = 10 - plainText.length;
    return {
      error: 'Description trop courte',
      suggestion: `Il manque ${missing} caractère${missing > 1 ? 's' : ''}. Ajoutez plus de détails sur l'œuvre, son histoire, sa technique, sa signification...`,
    };
  }

  return { error: '', suggestion: '' };
}

/**
 * Génère un message d'erreur avec suggestion pour des images manquantes
 */
export function getImagesError(images: string[] | null | undefined): ErrorMessageWithSuggestion {
  return {
    error: 'Au moins une image est requise',
    suggestion:
      'Ajoutez au moins une image de votre œuvre pour permettre aux acheteurs de la visualiser. Vous pouvez ajouter plusieurs images pour montrer différents angles.',
  };
}

/**
 * Génère un message d'erreur avec suggestion pour une œuvre non physique sans lien
 */
export function getNonPhysicalArtworkError(): ErrorMessageWithSuggestion {
  return {
    error: "Lien vers l'œuvre requis",
    suggestion:
      "Pour une œuvre non physique (numérique), vous devez fournir un lien vers l'œuvre (ex: https://votre-site.com/oeuvre)",
  };
}

/**
 * Génère un message d'erreur avec suggestion pour un champ générique
 */
export function getGenericFieldError(
  fieldName: string,
  reason: string,
  suggestion?: string
): ErrorMessageWithSuggestion {
  return {
    error: `${fieldName}: ${reason}`,
    suggestion: suggestion || `Vérifiez que le champ "${fieldName}" est correctement rempli`,
    field: fieldName,
  };
}

/**
 * Formate un message d'erreur avec suggestion pour affichage
 */
export function formatErrorMessage(errorData: ErrorMessageWithSuggestion): {
  title: string;
  description: string;
  suggestion?: string;
} {
  return {
    title: errorData.error,
    description: errorData.suggestion || errorData.error,
    suggestion: errorData.suggestion,
  };
}

/**
 * Liste des champs avec leurs noms d'affichage
 */
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  artist_name: "Nom de l'artiste",
  artist_bio: "Biographie de l'artiste",
  artist_website: "Site web de l'artiste",
  artwork_title: "Titre de l'œuvre",
  artwork_medium: 'Médium',
  artwork_year: 'Année de création',
  description: 'Description complète',
  short_description: 'Description courte',
  price: 'Prix',
  compare_at_price: 'Prix de comparaison',
  artwork_link_url: "Lien vers l'œuvre",
  images: 'Images',
  book_isbn: 'ISBN',
  book_language: 'Langue',
  book_genre: 'Genre',
  book_publisher: 'Éditeur',
  album_genre: 'Genre musical',
  album_label: 'Label',
  artwork_style: 'Style',
  artwork_subject: 'Sujet',
  design_category: 'Catégorie',
  signature_location: 'Emplacement de la signature',
  edition_number: "Numéro d'édition",
  total_editions: "Total d'éditions",
};

/**
 * Obtient le nom d'affichage d'un champ
 */
export function getFieldDisplayName(fieldKey: string): string {
  return FIELD_DISPLAY_NAMES[fieldKey] || fieldKey;
}
