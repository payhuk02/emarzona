import type { ArtistProductFormData, EditionType } from '@/types/artist-product';

export const ARTIST_EDITION_TYPE_OPTIONS: Array<{
  value: EditionType;
  label: string;
  description: string;
}> = [
  { value: 'original', label: 'Original', description: 'Pièce unique ou originale' },
  {
    value: 'limited_edition',
    label: 'Édition limitée',
    description: 'Œuvre numérotée sur un tirage limité',
  },
  { value: 'print', label: 'Tirage', description: 'Tirage artistique (numéroté)' },
  { value: 'reproduction', label: 'Reproduction', description: 'Reproduction commerciale' },
];

export type ArtistPublishValidationResult = {
  valid: boolean;
  failedStep?: number;
  title?: string;
  description?: string;
};

function requiresEditionNumbers(editionType: EditionType | null | undefined): boolean {
  return editionType === 'limited_edition' || editionType === 'print';
}

export function validateArtistPublishFormData(
  formData: Partial<ArtistProductFormData>
): ArtistPublishValidationResult {
  if (!formData.artist_type) {
    return {
      valid: false,
      failedStep: 1,
      title: 'Étape 1 incomplète',
      description: "Veuillez sélectionner un type d'artiste",
    };
  }

  if (
    !formData.artwork_title ||
    !formData.artist_name ||
    !formData.artwork_medium ||
    formData.price == null
  ) {
    return {
      valid: false,
      failedStep: 2,
      title: 'Étape 2 incomplète',
      description: 'Veuillez compléter toutes les informations de base',
    };
  }

  if (!formData.description || formData.description.trim().length < 10) {
    return {
      valid: false,
      failedStep: 2,
      title: 'Description requise',
      description: 'Ajoutez une description d’au moins 10 caractères',
    };
  }

  if (!formData.price || formData.price <= 0) {
    return {
      valid: false,
      failedStep: 2,
      title: 'Prix invalide',
      description: 'Le prix doit être supérieur à 0',
    };
  }

  if (!formData.images || formData.images.length === 0) {
    return {
      valid: false,
      failedStep: 2,
      title: 'Images requises',
      description: 'Ajoutez au moins une image de l’œuvre',
    };
  }

  if (!formData.requires_shipping && !formData.artwork_link_url?.trim()) {
    return {
      valid: false,
      failedStep: 2,
      title: 'Lien requis',
      description: "Pour une œuvre non physique, un lien vers l'œuvre est requis",
    };
  }

  if (requiresEditionNumbers(formData.edition_type)) {
    if (!formData.edition_number || !formData.total_editions) {
      return {
        valid: false,
        failedStep: 5,
        title: 'Édition incomplète',
        description: "Indiquez le numéro d'édition et le total (étape Authentification)",
      };
    }
    if (formData.edition_number > formData.total_editions) {
      return {
        valid: false,
        failedStep: 5,
        title: 'Édition invalide',
        description: "Le numéro d'édition ne peut pas dépasser le total",
      };
    }
  }

  if (formData.requires_shipping) {
    if (!formData.shipping_handling_time || formData.shipping_handling_time < 1) {
      return {
        valid: false,
        failedStep: 4,
        title: 'Délai de livraison requis',
        description: 'Spécifiez un délai de livraison valide (minimum 1 jour)',
      };
    }
  }

  if (!formData.payment) {
    return {
      valid: false,
      failedStep: 7,
      title: 'Options de paiement requises',
      description: 'Configurez les options de paiement',
    };
  }

  if (formData.payment.payment_type === 'percentage') {
    const rate = formData.payment.percentage_rate;
    if (rate == null || rate < 1 || rate > 100) {
      return {
        valid: false,
        failedStep: 7,
        title: 'Taux de paiement invalide',
        description: 'Le taux doit être entre 1 % et 100 %',
      };
    }
  }

  return { valid: true };
}
