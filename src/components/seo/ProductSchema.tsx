/**
 * Composant: ProductSchema
 * Description: Génère les données structurées Schema.org pour un produit
 * Usage: <ProductSchema product={...} />
 */

import { Helmet } from 'react-helmet';

interface ProductSchemaProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    image_url?: string;
    rating?: number;
    reviews_count?: number;
    slug: string;
    category?: string;
    sku?: string;
    created_at?: string;
    updated_at?: string;
    store: {
      name: string;
      slug: string;
    };
  };
}

export const ProductSchema = ({ product }: ProductSchemaProps) => {
  const productUrl = `${window.location.origin}/stores/${product.store.slug}/products/${product.slug}`;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description?.substring(0, 200) || `Achetez ${product.name} sur Payhula`,
    "image": product.image_url || `${window.location.origin}/og-default.jpg`,
    "url": productUrl,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.store.name
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": product.currency,
      "price": product.price,
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "seller": {
        "@type": "Organization",
        "name": product.store.name,
        "url": `${window.location.origin}/stores/${product.store.slug}`
      }
    }
  };
  
  // Ajout des avis si disponibles
  if (product.rating && product.reviews_count && product.reviews_count > 0) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviews_count,
      "bestRating": 5,
      "worstRating": 1
    };
  }
  
  // Ajout de la catégorie si disponible
  if (product.category) {
    schema["category"] = product.category;
  }
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

export default ProductSchema;

