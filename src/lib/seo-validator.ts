/**
 * Validateur SEO pour les boutiques
 * Calcule un score SEO et fournit des recommandations
 */

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
  priority: number; // 1-10, 10 étant le plus important
}

export interface SEOValidationResult {
  score: number; // 0-100
  issues: SEOIssue[];
  strengths: string[];
  recommendations: string[];
  metaTitleLength?: number;
  metaDescriptionLength?: number;
  hasValidImages?: boolean;
  hasContactInfo?: boolean;
  hasSocialLinks?: boolean;
  hasStructuredData?: boolean;
}

export interface StoreSEOData {
  name?: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  logo_url?: string;
  banner_url?: string;
  contact_email?: string;
  contact_phone?: string;
  address_line1?: string;
  city?: string;
  country?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  slug?: string;
  about?: string;
}

/**
 * Valide les données SEO d'une boutique et calcule un score
 */
export function validateStoreSEO(store: StoreSEOData): SEOValidationResult {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Vérifier le nom de la boutique
  if (!store.name || store.name.trim().length === 0) {
    issues.push({
      type: 'error',
      field: 'name',
      message: 'Le nom de la boutique est requis',
      suggestion: 'Ajoutez un nom de boutique clair et descriptif',
      priority: 10
    });
    score -= 10;
  } else if (store.name.length > 60) {
    issues.push({
      type: 'warning',
      field: 'name',
      message: 'Le nom de la boutique est trop long',
      suggestion: `Réduisez le nom à moins de 60 caractères (actuellement: ${store.name.length})`,
      priority: 5
    });
    score -= 3;
  } else {
    strengths.push('Nom de boutique défini');
  }

  // 2. Vérifier la description
  if (!store.description || store.description.trim().length === 0) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'La description de la boutique est requise',
      suggestion: 'Ajoutez une description claire de votre boutique (150-300 caractères recommandés)',
      priority: 9
    });
    score -= 10;
  } else if (store.description.length < 50) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: 'La description est trop courte',
      suggestion: 'Étendez la description à au moins 50 caractères pour une meilleure visibilité',
      priority: 6
    });
    score -= 5;
  } else if (store.description.length > 300) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: 'La description est trop longue',
      suggestion: 'Réduisez la description à moins de 300 caractères',
      priority: 4
    });
    score -= 2;
  } else {
    strengths.push('Description définie');
  }

  // 3. Vérifier le meta title
  const metaTitle = store.meta_title || store.name || '';
  const metaTitleLength = metaTitle.length;
  
  if (!store.meta_title) {
    issues.push({
      type: 'warning',
      field: 'meta_title',
      message: 'Le titre SEO personnalisé n\'est pas défini',
      suggestion: 'Ajoutez un titre SEO personnalisé optimisé pour les moteurs de recherche',
      priority: 8
    });
    score -= 5;
  } else {
    strengths.push('Titre SEO personnalisé défini');
  }

  if (metaTitleLength > 0 && metaTitleLength < 30) {
    issues.push({
      type: 'warning',
      field: 'meta_title',
      message: 'Le titre SEO est trop court',
      suggestion: `Étendez le titre à 30-60 caractères (actuellement: ${metaTitleLength})`,
      priority: 7
    });
    score -= 3;
  } else if (metaTitleLength > 60) {
    issues.push({
      type: 'warning',
      field: 'meta_title',
      message: 'Le titre SEO est trop long et sera tronqué dans les résultats',
      suggestion: `Réduisez le titre à 60 caractères maximum (actuellement: ${metaTitleLength})`,
      priority: 7
    });
    score -= 4;
  }

  // 4. Vérifier le meta description
  const metaDescription = store.meta_description || store.description || '';
  const metaDescriptionLength = metaDescription.length;

  if (!store.meta_description && !store.description) {
    issues.push({
      type: 'error',
      field: 'meta_description',
      message: 'La description SEO n\'est pas définie',
      suggestion: 'Ajoutez une description SEO de 150-160 caractères',
      priority: 9
    });
    score -= 8;
  } else {
    if (!store.meta_description && store.description) {
      issues.push({
        type: 'info',
        field: 'meta_description',
        message: 'Utilisation de la description générale comme meta description',
        suggestion: 'Créez une description SEO optimisée séparée (150-160 caractères)',
        priority: 5
      });
      score -= 2;
    } else {
      strengths.push('Description SEO personnalisée définie');
    }

    if (metaDescriptionLength > 0 && metaDescriptionLength < 120) {
      issues.push({
        type: 'warning',
        field: 'meta_description',
        message: 'La description SEO est trop courte',
        suggestion: `Étendez la description à 120-160 caractères (actuellement: ${metaDescriptionLength})`,
        priority: 6
      });
      score -= 3;
    } else if (metaDescriptionLength > 160) {
      issues.push({
        type: 'warning',
        field: 'meta_description',
        message: 'La description SEO est trop longue et sera tronquée',
        suggestion: `Réduisez la description à 160 caractères maximum (actuellement: ${metaDescriptionLength})`,
        priority: 6
      });
      score -= 4;
    }
  }

  // 5. Vérifier les mots-clés
  if (!store.meta_keywords || store.meta_keywords.trim().length === 0) {
    issues.push({
      type: 'info',
      field: 'meta_keywords',
      message: 'Les mots-clés SEO ne sont pas définis',
      suggestion: 'Ajoutez des mots-clés pertinents séparés par des virgules (optionnel mais recommandé)',
      priority: 3
    });
    score -= 2;
  } else {
    strengths.push('Mots-clés SEO définis');
  }

  // 6. Vérifier les images
  const hasLogo = !!store.logo_url;
  const hasBanner = !!store.banner_url;
  const hasOGImage = !!store.og_image;

  if (!hasLogo) {
    issues.push({
      type: 'warning',
      field: 'logo_url',
      message: 'Le logo de la boutique n\'est pas défini',
      suggestion: 'Ajoutez un logo pour améliorer l\'image de marque',
      priority: 6
    });
    score -= 5;
  } else {
    strengths.push('Logo défini');
  }

  if (!hasBanner) {
    issues.push({
      type: 'info',
      field: 'banner_url',
      message: 'La bannière de la boutique n\'est pas définie',
      suggestion: 'Ajoutez une bannière pour personnaliser votre boutique',
      priority: 4
    });
    score -= 2;
  } else {
    strengths.push('Bannière définie');
  }

  if (!hasOGImage) {
    issues.push({
      type: 'warning',
      field: 'og_image',
      message: 'L\'image Open Graph n\'est pas définie',
      suggestion: 'Ajoutez une image Open Graph pour un meilleur partage sur les réseaux sociaux',
      priority: 7
    });
    score -= 5;
  } else {
    strengths.push('Image Open Graph définie');
  }

  const hasValidImages = hasLogo || hasBanner || hasOGImage;

  // 7. Vérifier les informations de contact
  const hasEmail = !!store.contact_email;
  const hasPhone = !!store.contact_phone;
  const hasAddress = !!(store.address_line1 && store.city && store.country);
  const hasContactInfo = hasEmail || hasPhone || hasAddress;

  if (!hasContactInfo) {
    issues.push({
      type: 'warning',
      field: 'contact',
      message: 'Aucune information de contact n\'est définie',
      suggestion: 'Ajoutez au moins un email, un téléphone ou une adresse pour la confiance des clients',
      priority: 7
    });
    score -= 8;
  } else {
    strengths.push('Informations de contact définies');
    if (hasEmail) strengths.push('Email de contact disponible');
    if (hasPhone) strengths.push('Téléphone de contact disponible');
    if (hasAddress) strengths.push('Adresse complète disponible');
  }

  // 8. Vérifier les réseaux sociaux
  const hasSocialLinks = !!(store.facebook_url || store.instagram_url || store.twitter_url || store.linkedin_url);
  
  if (!hasSocialLinks) {
    issues.push({
      type: 'info',
      field: 'social',
      message: 'Aucun lien vers les réseaux sociaux n\'est défini',
      suggestion: 'Ajoutez vos liens de réseaux sociaux pour améliorer votre présence en ligne',
      priority: 4
    });
    score -= 3;
  } else {
    strengths.push('Liens de réseaux sociaux définis');
  }

  // 9. Vérifier le slug
  if (!store.slug || store.slug.trim().length === 0) {
    issues.push({
      type: 'error',
      field: 'slug',
      message: 'Le slug de la boutique est requis',
      suggestion: 'Le slug est généré automatiquement à partir du nom',
      priority: 10
    });
    score -= 10;
  } else {
    strengths.push('Slug défini');
  }

  // 10. Générer des recommandations basées sur les problèmes
  if (score < 50) {
    recommendations.push('⚠️ Votre boutique nécessite des améliorations SEO importantes pour être bien référencée.');
  } else if (score < 70) {
    recommendations.push('✅ Votre boutique a une bonne base SEO mais peut être améliorée.');
  } else if (score < 85) {
    recommendations.push('🎉 Votre boutique est bien optimisée SEO ! Quelques améliorations mineures sont possibles.');
  } else {
    recommendations.push('🌟 Excellent ! Votre boutique est très bien optimisée pour les moteurs de recherche.');
  }

  // Recommandations spécifiques
  if (!hasContactInfo) {
    recommendations.push('Ajoutez des informations de contact pour améliorer la confiance et le référencement local.');
  }

  if (!hasOGImage) {
    recommendations.push('Ajoutez une image Open Graph pour améliorer le partage sur les réseaux sociaux.');
  }

  if (metaDescriptionLength < 120 || metaDescriptionLength > 160) {
    recommendations.push('Optimisez votre description SEO pour qu\'elle fasse entre 120 et 160 caractères.');
  }

  if (!hasSocialLinks) {
    recommendations.push('Ajoutez vos liens de réseaux sociaux pour renforcer votre présence en ligne.');
  }

  // S'assurer que le score reste entre 0 et 100
  score = Math.max(0, Math.min(100, score));

  // Trier les problèmes par priorité (plus prioritaire en premier)
  issues.sort((a, b) => b.priority - a.priority);

  return {
    score: Math.round(score),
    issues,
    strengths,
    recommendations,
    metaTitleLength,
    metaDescriptionLength,
    hasValidImages,
    hasContactInfo,
    hasSocialLinks,
    hasStructuredData: true // Toujours true car on génère du JSON-LD
  };
}

