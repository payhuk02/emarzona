/**
 * Composant Schema.org pour les pages produits
 * Génère automatiquement le JSON-LD pour améliorer le SEO
 * Format: Product Schema (https://schema.org/Product)
 */

import { Helmet } from 'react-helmet';

interface ProductSchemaProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    description: string;
    price: number;
    currency: string;
    image_url?: string;
    images?: Array<{ url: string }>;
    rating?: number;
    reviews_count?: number;
    category?: string;
    is_active?: boolean;
    created_at?: string;
    licensing_type?: 'standard' | 'plr' | 'copyrighted';
    license_terms?: string | null;
  };
  store: {
    name: string;
    slug: string;
    logo_url?: string;
  };
  url?: string; // Optionnel, sera généré automatiquement si non fourni
}

export const ProductSchema = ({ product, store, url }: ProductSchemaProps) => {
  // Vérifier que product et store existent
  if (!product || !store) {
    console.warn('[ProductSchema] Product or Store is missing:', { product, store });
    return null;
  }

  // Générer l'URL par défaut si non fournie
  const defaultUrl = product.slug 
    ? `/stores/${store.slug}/products/${product.slug}`
    : `/stores/${store.slug}`;
  const providedUrl = url || defaultUrl;
  
  // Construire l'URL complète
  const fullUrl = providedUrl.startsWith('http') 
    ? providedUrl 
    : `https://payhuk.com${providedUrl}`;
  
  // Images du produit
  const productImages = [
    product.image_url,
    ...(product.images?.map(img => img.url) || [])
  ].filter(Boolean);

  // Schema.org Product
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Disponible sur Payhuk`,
    image: productImages,
    url: fullUrl,
    
    // SKU et identifiants
    sku: product.id,
    productID: product.id,
    
    // Catégorie
    ...(product.category && {
      category: product.category
    }),
    
    // Prix
    offers: {
      '@type': 'Offer',
      url: fullUrl,
      priceCurrency: product.currency || 'XOF',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.is_active !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: store.name,
        url: `https://payhuk.com/stores/${store.slug}`,
        ...(store.logo_url && {
          logo: store.logo_url
        })
      }
    },
    
    // Avis et notes
    ...(product.rating && product.reviews_count && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.reviews_count,
        bestRating: '5',
        worstRating: '1'
      }
    }),
    
    // Marque/Vendeur
    brand: {
      '@type': 'Brand',
      name: store.name
    },
    // Licensing as additionalProperty for SEO context
    ...(product.licensing_type && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'licensing_type',
          value: product.licensing_type
        },
        ...(product.license_terms
          ? [{ '@type': 'PropertyValue', name: 'license_terms', value: product.license_terms }]
          : [])
      ]
    })
  };

  // Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: 'https://payhuk.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Marketplace',
        item: 'https://payhuk.com/marketplace'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: store.name,
        item: `https://payhuk.com/stores/${store.slug}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: fullUrl
      }
    ]
  };

  return (
    <Helmet>
      {/* Product Schema */}
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
      
      {/* Breadcrumb Schema */}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
};
