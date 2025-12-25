/**
 * Hook useSEO - Simplifie la gestion des métadonnées SEO
 * Utilise react-helmet pour mettre à jour les meta tags
 * 
 * @example
 * ```tsx
 * useSEO({
 *   title: 'Produit - Emarzona',
 *   description: 'Description du produit',
 *   image: '/product-image.jpg',
 *   type: 'product',
 * });
 * ```
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { updateSEOMetadata, generateSchemaOrg } from '@/lib/seo-enhancements';

export interface UseSEOOptions {
  /**
   * Titre de la page
   */
  title?: string;
  /**
   * Description de la page (max 160 caractères recommandé)
   */
  description?: string;
  /**
   * Mots-clés SEO
   */
  keywords?: string[];
  /**
   * URL de l'image Open Graph
   */
  image?: string;
  /**
   * Type de contenu (website, article, product, profile)
   */
  type?: 'website' | 'article' | 'product' | 'profile';
  /**
   * URL canonique (par défaut: URL actuelle)
   */
  canonical?: string;
  /**
   * Auteur de la page
   */
  author?: string;
  /**
   * Robots meta (par défaut: 'index, follow')
   */
  robots?: string;
  /**
   * Données pour Schema.org JSON-LD
   */
  schema?: {
    type: 'Product' | 'Organization' | 'WebSite' | 'BreadcrumbList' | 'Article';
    data: Record<string, any>;
  };
  /**
   * Breadcrumb items pour générer le schema
   */
  breadcrumbs?: Array<{ name: string; url: string }>;
  /**
   * Données produit pour générer le schema Product
   */
  product?: {
    name: string;
    description: string;
    price: number;
    currency: string;
    image?: string;
    availability?: string;
    sku?: string;
  };
}

/**
 * Hook pour gérer les métadonnées SEO
 */
export function useSEO(options: UseSEOOptions = {}) {
  const location = useLocation();
  const {
    title,
    description,
    keywords,
    image,
    type = 'website',
    canonical,
    author,
    robots,
    schema,
    breadcrumbs,
    product,
  } = options;

  useEffect(() => {
    // Construire l'URL canonique
    const canonicalUrl = canonical || window.location.origin + location.pathname;

    // Mettre à jour les métadonnées SEO
    updateSEOMetadata({
      title,
      description,
      keywords,
      ogImage: image,
      ogType: type,
      canonical: canonicalUrl,
      robots,
      author,
    });

    // Générer le schema JSON-LD si fourni
    if (schema) {
      generateSchemaOrg({
        type: schema.type,
        ...schema.data,
      });
    }

    // Générer le breadcrumb schema si fourni
    if (breadcrumbs && breadcrumbs.length > 0) {
      generateSchemaOrg({
        type: 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      });
    }

    // Générer le product schema si fourni
    if (product) {
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
  }, [
    title,
    description,
    keywords,
    image,
    type,
    canonical,
    author,
    robots,
    schema,
    breadcrumbs,
    product,
    location.pathname,
  ]);
}

/**
 * Hook pour générer automatiquement les métadonnées SEO d'un produit
 */
export function useProductSEO(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  slug: string;
  storeSlug?: string;
  availability?: 'instock' | 'outofstock' | 'preorder';
  sku?: string;
  category?: string;
}) {
  const location = useLocation();
  
  const canonicalUrl = product.storeSlug
    ? `${window.location.origin}/stores/${product.storeSlug}/products/${product.slug}`
    : `${window.location.origin}/products/${product.slug}`;

  const ogImage = product.image || '/og-default.jpg';
  
  const breadcrumbs = [
    { name: 'Accueil', url: window.location.origin },
    ...(product.storeSlug ? [{ name: 'Boutique', url: `${window.location.origin}/stores/${product.storeSlug}` }] : []),
    { name: product.name, url: canonicalUrl },
  ];

  useSEO({
    title: `${product.name} | Emarzona`,
    description: product.description.substring(0, 160),
    keywords: [product.name, product.category, 'e-commerce', 'achat en ligne'].filter(Boolean),
    image: ogImage,
    type: 'product',
    canonical: canonicalUrl,
    breadcrumbs,
    product: {
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      image: ogImage,
      availability: product.availability === 'instock' 
        ? 'https://schema.org/InStock'
        : product.availability === 'outofstock'
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/PreOrder',
      sku: product.sku,
    },
  });
}

/**
 * Hook pour générer automatiquement les métadonnées SEO d'une boutique
 */
export function useStoreSEO(store: {
  name: string;
  description: string;
  slug: string;
  logo?: string;
  banner?: string;
}) {
  const canonicalUrl = `${window.location.origin}/stores/${store.slug}`;
  const ogImage = store.banner || store.logo || '/og-default.jpg';

  const breadcrumbs = [
    { name: 'Accueil', url: window.location.origin },
    { name: store.name, url: canonicalUrl },
  ];

  useSEO({
    title: `${store.name} | Emarzona`,
    description: store.description.substring(0, 160),
    keywords: [store.name, 'boutique en ligne', 'e-commerce'],
    image: ogImage,
    type: 'website',
    canonical: canonicalUrl,
    breadcrumbs,
    schema: {
      type: 'Organization',
      data: {
        name: store.name,
        url: canonicalUrl,
        logo: store.logo,
        description: store.description,
      },
    },
  });
}

