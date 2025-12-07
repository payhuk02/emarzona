/**
 * Utilitaires SEO - Fonctions helper pour optimiser le SEO
 */

/**
 * Tronque une description pour les meta tags (max 160 caractères)
 */
export function truncateDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) {
    return description;
  }
  
  // Tronquer à la dernière phrase complète avant maxLength
  const truncated = description.substring(0, maxLength - 3);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated + '...';
}

/**
 * Génère un titre SEO optimisé
 */
export function generateSEOTitle(title: string, brand: string = 'Emarzona'): string {
  if (title.includes(brand)) {
    return title;
  }
  
  const maxLength = 60; // Longueur recommandée pour les titres SEO
  const suffix = ` | ${brand}`;
  const availableLength = maxLength - suffix.length;
  
  if (title.length <= availableLength) {
    return `${title}${suffix}`;
  }
  
  return `${title.substring(0, availableLength - 3)}...${suffix}`;
}

/**
 * Génère des mots-clés SEO à partir d'un texte
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Mots à exclure (stop words)
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'à', 'pour',
    'dans', 'sur', 'avec', 'par', 'est', 'sont', 'être', 'avoir', 'faire',
    'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'for', 'with', 'by',
  ]);
  
  // Extraire les mots (min 3 caractères)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word));
  
  // Compter les occurrences
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Trier par fréquence et retourner les plus fréquents
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Génère une URL canonique propre
 */
export function generateCanonicalUrl(path: string, baseUrl: string = window.location.origin): string {
  // Supprimer les query params et fragments
  const cleanPath = path.split('?')[0].split('#')[0];
  
  // S'assurer que le path commence par /
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Valide une URL d'image pour Open Graph
 */
export function validateOGImage(imageUrl: string | undefined | null): string {
  if (!imageUrl) {
    return '/og-default.jpg';
  }
  
  // Si c'est une URL relative, la convertir en absolue
  if (imageUrl.startsWith('/')) {
    return `${window.location.origin}${imageUrl}`;
  }
  
  // Si c'est déjà une URL absolue, la retourner telle quelle
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Sinon, retourner l'image par défaut
  return '/og-default.jpg';
}

/**
 * Génère des métadonnées SEO par défaut pour une page
 */
export function generateDefaultSEO(pageName: string, description?: string): {
  title: string;
  description: string;
  keywords: string[];
} {
  const title = generateSEOTitle(pageName);
  const defaultDescription = description || `Découvrez ${pageName} sur Emarzona - Plateforme de ecommerce et marketing`;
  const seoDescription = truncateDescription(defaultDescription);
  const keywords = extractKeywords(`${pageName} ${defaultDescription}`);
  
  return {
    title,
    description: seoDescription,
    keywords,
  };
}

/**
 * Génère un schema.org Product optimisé
 */
export function generateProductSchemaData(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  sku?: string;
  availability?: 'instock' | 'outofstock' | 'preorder';
  brand?: string;
  category?: string;
  rating?: {
    value: number;
    count: number;
  };
}): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image ? validateOGImage(product.image) : undefined,
    sku: product.sku,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.availability === 'instock'
        ? 'https://schema.org/InStock'
        : product.availability === 'outofstock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/PreOrder',
    },
  };
  
  if (product.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.value,
      reviewCount: product.rating.count,
    };
  }
  
  return schema;
}

/**
 * Génère un schema.org BreadcrumbList
 */
export function generateBreadcrumbSchemaData(items: Array<{ name: string; url: string }>): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: generateCanonicalUrl(item.url),
    })),
  };
}

