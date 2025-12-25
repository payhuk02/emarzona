/**
 * Améliorations SEO
 * Optimise le référencement de la plateforme
 */

import { logger } from './logger';

/**
 * Métadonnées SEO par défaut
 */
export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  robots?: string;
  author?: string;
}

/**
 * Métadonnées par défaut
 */
const DEFAULT_METADATA: SEOMetadata = {
  title: 'Emarzona - Plateforme de ecommerce et marketing',
  description: 'Créez et gérez votre boutique en ligne avec Emarzona. Support pour produits digitaux, physiques, services, cours en ligne et œuvres d\'artistes.',
  keywords: ['e-commerce', 'boutique en ligne', 'vente en ligne', 'plateforme e-commerce', 'multi-boutiques'],
  ogType: 'website',
  robots: 'index, follow',
};

/**
 * Mettre à jour les métadonnées de la page
 */
export function updateSEOMetadata(metadata: Partial<SEOMetadata>): void {
  const fullMetadata = { ...DEFAULT_METADATA, ...metadata };
  
  // Title
  if (fullMetadata.title) {
    document.title = fullMetadata.title;
    
    // Meta title
    updateMetaTag('title', fullMetadata.title);
    updateMetaTag('og:title', fullMetadata.title);
    updateMetaTag('twitter:title', fullMetadata.title);
  }
  
  // Description
  if (fullMetadata.description) {
    updateMetaTag('description', fullMetadata.description);
    updateMetaTag('og:description', fullMetadata.description);
    updateMetaTag('twitter:description', fullMetadata.description);
  }
  
  // Keywords
  if (fullMetadata.keywords && fullMetadata.keywords.length > 0) {
    updateMetaTag('keywords', fullMetadata.keywords.join(', '));
  }
  
  // OG Image
  if (fullMetadata.ogImage) {
    updateMetaTag('og:image', fullMetadata.ogImage);
    updateMetaTag('twitter:image', fullMetadata.ogImage);
  }
  
  // OG Type
  if (fullMetadata.ogType) {
    updateMetaTag('og:type', fullMetadata.ogType);
  }
  
  // Canonical
  if (fullMetadata.canonical) {
    updateLinkTag('canonical', fullMetadata.canonical);
  } else {
    // Canonical par défaut : URL actuelle
    updateLinkTag('canonical', window.location.href);
  }
  
  // Robots
  if (fullMetadata.robots) {
    updateMetaTag('robots', fullMetadata.robots);
  }
  
  // Author
  if (fullMetadata.author) {
    updateMetaTag('author', fullMetadata.author);
  }
  
  logger.debug('Métadonnées SEO mises à jour', { metadata: fullMetadata });
}

/**
 * Mettre à jour une balise meta
 */
function updateMetaTag(property: string, content: string): void {
  // Essayer par name d'abord
  let element = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
  
  // Si pas trouvé, essayer par property (pour Open Graph)
  if (!element) {
    element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  }
  
  // Si toujours pas trouvé, créer la balise
  if (!element) {
    element = document.createElement('meta');
    
    // Déterminer si c'est property ou name
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      element.setAttribute('property', property);
    } else {
      element.setAttribute('name', property);
    }
    
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

/**
 * Mettre à jour une balise link
 */
function updateLinkTag(rel: string, href: string): void {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}

/**
 * Générer un schema.org JSON-LD
 */
export function generateSchemaOrg(data: {
  type: 'Product' | 'Organization' | 'WebSite' | 'BreadcrumbList';
  [key: string]: any;
}): void {
  const schema = {
    '@context': 'https://schema.org',
    '@type': data.type,
    ...data,
  };
  
  // Supprimer l'ancien schema s'il existe
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }
  
  // Créer le nouveau script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
  
  logger.debug('Schema.org JSON-LD généré', { type: data.type });
}

/**
 * Générer un breadcrumb schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): void {
  generateSchemaOrg({
    type: 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/**
 * Générer un product schema
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  availability?: string;
  sku?: string;
}): void {
  generateSchemaOrg({
    type: 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.availability || 'https://schema.org/InStock',
    },
  });
}

/**
 * Générer un organization schema
 */
export function generateOrganizationSchema(org: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
}): void {
  generateSchemaOrg({
    type: 'Organization',
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
  });
}

/**
 * Optimiser les images pour le SEO
 */
export function optimizeImageForSEO(img: HTMLImageElement, alt: string): void {
  img.setAttribute('alt', alt);
  img.setAttribute('loading', 'lazy');
  img.setAttribute('decoding', 'async');
  
  // Ajouter width et height si disponibles
  if (img.naturalWidth && img.naturalHeight) {
    img.setAttribute('width', img.naturalWidth.toString());
    img.setAttribute('height', img.naturalHeight.toString());
  }
}

/**
 * Ajouter des structured data pour les avis
 */
export function generateReviewSchema(reviews: Array<{
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}>): void {
  if (reviews.length === 0) return;
  
  const aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: (
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    ).toFixed(1),
    reviewCount: reviews.length,
  };
  
  generateSchemaOrg({
    type: 'Product',
    aggregateRating,
    review: reviews.map(review => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
      },
      reviewBody: review.reviewBody,
      datePublished: review.datePublished,
    })),
  });
}


