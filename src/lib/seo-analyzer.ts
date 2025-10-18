export interface SEOScore {
  overall: number;
  structure: number;
  content: number;
  performance: number;
  images: number;
  readability: number;
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'success';
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  recommendation?: string;
}

export interface SEOAnalysis {
  score: SEOScore;
  issues: SEOIssue[];
  strengths: string[];
  keywords: string[];
}

export const analyzeSEO = (data: {
  name: string;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  image_url?: string;
  images?: any[];
  slug?: string;
}): SEOAnalysis => {
  const issues: SEOIssue[] = [];
  const strengths: string[] = [];
  const keywords: string[] = [];

  // Structure Analysis
  let structureScore = 0;
  
  // Title
  if (data.meta_title) {
    if (data.meta_title.length >= 30 && data.meta_title.length <= 60) {
      structureScore += 25;
      strengths.push("Titre SEO optimisé (30-60 caractères)");
    } else if (data.meta_title.length < 30) {
      structureScore += 10;
      issues.push({
        type: 'warning',
        priority: 'medium',
        category: 'Titre',
        message: `Titre trop court (${data.meta_title.length} caractères)`,
        recommendation: 'Augmentez la longueur à 30-60 caractères pour un meilleur référencement'
      });
    } else {
      structureScore += 10;
      issues.push({
        type: 'warning',
        priority: 'medium',
        category: 'Titre',
        message: `Titre trop long (${data.meta_title.length} caractères)`,
        recommendation: 'Réduisez la longueur à maximum 60 caractères'
      });
    }
  } else {
    issues.push({
      type: 'error',
      priority: 'high',
      category: 'Titre',
      message: 'Titre SEO manquant',
      recommendation: 'Ajoutez un titre SEO descriptif de 30-60 caractères'
    });
  }

  // Meta Description
  if (data.meta_description) {
    if (data.meta_description.length >= 120 && data.meta_description.length <= 160) {
      structureScore += 25;
      strengths.push("Meta description optimisée (120-160 caractères)");
    } else if (data.meta_description.length < 120) {
      structureScore += 10;
      issues.push({
        type: 'warning',
        priority: 'medium',
        category: 'Description',
        message: `Description trop courte (${data.meta_description.length} caractères)`,
        recommendation: 'Augmentez la longueur à 120-160 caractères'
      });
    } else {
      structureScore += 10;
      issues.push({
        type: 'warning',
        priority: 'high',
        category: 'Description',
        message: `Description trop longue (${data.meta_description.length} caractères)`,
        recommendation: 'Réduisez la longueur à maximum 160 caractères'
      });
    }
  } else {
    issues.push({
      type: 'error',
      priority: 'high',
      category: 'Description',
      message: 'Meta description manquante',
      recommendation: 'Ajoutez une description SEO de 120-160 caractères'
    });
  }

  // Slug/URL
  if (data.slug && data.slug.length > 0) {
    if (data.slug.match(/^[a-z0-9-]+$/)) {
      structureScore += 25;
      strengths.push("URL SEO-friendly");
    } else {
      structureScore += 15;
      issues.push({
        type: 'warning',
        priority: 'low',
        category: 'URL',
        message: 'URL contient des caractères non optimaux',
        recommendation: 'Utilisez uniquement des lettres minuscules, chiffres et tirets'
      });
    }
  }

  // Meta Keywords
  if (data.meta_keywords && data.meta_keywords.length > 0) {
    structureScore += 25;
    strengths.push("Mots-clés définis");
    keywords.push(...data.meta_keywords.split(',').map(k => k.trim()));
  } else {
    issues.push({
      type: 'warning',
      priority: 'medium',
      category: 'Mots-clés',
      message: 'Mots-clés manquants',
      recommendation: 'Ajoutez 3-5 mots-clés pertinents'
    });
  }

  // Content Analysis
  let contentScore = 0;
  
  if (data.description && data.description.length > 300) {
    contentScore += 50;
    strengths.push("Contenu riche et détaillé");
  } else if (data.description && data.description.length > 150) {
    contentScore += 30;
    issues.push({
      type: 'warning',
      priority: 'medium',
      category: 'Contenu',
      message: 'Description trop courte',
      recommendation: 'Enrichissez le contenu à plus de 300 caractères'
    });
  } else {
    contentScore += 10;
    issues.push({
      type: 'error',
      priority: 'high',
      category: 'Contenu',
      message: 'Description très courte ou manquante',
      recommendation: 'Ajoutez une description détaillée de plus de 300 caractères'
    });
  }

  // Keyword density in content
  if (data.description && data.meta_keywords) {
    const keywordList = data.meta_keywords.split(',').map(k => k.trim().toLowerCase());
    const contentLower = data.description.toLowerCase();
    const hasKeywords = keywordList.some(kw => contentLower.includes(kw));
    
    if (hasKeywords) {
      contentScore += 50;
      strengths.push("Mots-clés présents dans le contenu");
    } else {
      contentScore += 20;
      issues.push({
        type: 'warning',
        priority: 'high',
        category: 'Contenu',
        message: 'Mots-clés absents du contenu',
        recommendation: 'Intégrez naturellement vos mots-clés dans la description'
      });
    }
  }

  // Images Analysis
  let imagesScore = 0;
  const imagesList = data.images || [];
  const totalImages = imagesList.length + (data.image_url ? 1 : 0);

  if (totalImages > 0) {
    imagesScore += 50;
    strengths.push(`${totalImages} image(s) présente(s)`);
    
    // Check for alt text (assuming images array has alt info)
    const hasAltText = imagesList.some((img: any) => img.alt);
    if (hasAltText) {
      imagesScore += 50;
      strengths.push("Images avec texte alternatif");
    } else {
      imagesScore += 20;
      issues.push({
        type: 'warning',
        priority: 'medium',
        category: 'Images',
        message: 'Texte alternatif manquant sur les images',
        recommendation: 'Ajoutez un texte ALT descriptif pour chaque image'
      });
    }
  } else {
    issues.push({
      type: 'warning',
      priority: 'medium',
      category: 'Images',
      message: 'Aucune image',
      recommendation: 'Ajoutez au moins une image avec texte alternatif'
    });
  }

  // Performance (basic check)
  let performanceScore = 70; // Base score
  if (totalImages > 5) {
    performanceScore -= 20;
    issues.push({
      type: 'warning',
      priority: 'low',
      category: 'Performance',
      message: 'Nombre élevé d\'images',
      recommendation: 'Optimisez et compressez vos images'
    });
  } else {
    strengths.push("Nombre d'images optimal");
    performanceScore += 30;
  }

  // Readability
  let readabilityScore = 70; // Base score
  if (data.description) {
    const sentences = data.description.split(/[.!?]+/).length;
    const words = data.description.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    if (avgWordsPerSentence < 20) {
      readabilityScore += 30;
      strengths.push("Phrases courtes et lisibles");
    } else {
      issues.push({
        type: 'warning',
        priority: 'low',
        category: 'Lisibilité',
        message: 'Phrases trop longues',
        recommendation: 'Utilisez des phrases plus courtes pour améliorer la lisibilité'
      });
    }
  }

  const score: SEOScore = {
    structure: Math.min(100, structureScore),
    content: Math.min(100, contentScore),
    images: Math.min(100, imagesScore),
    performance: Math.min(100, performanceScore),
    readability: Math.min(100, readabilityScore),
    overall: 0
  };

  score.overall = Math.round(
    (score.structure + score.content + score.images + score.performance + score.readability) / 5
  );

  return {
    score,
    issues,
    strengths,
    keywords
  };
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
  if (score >= 80) return 'default';
  if (score >= 60) return 'secondary';
  return 'destructive';
};
