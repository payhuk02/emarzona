/**
 * Composant: SEOMeta
 * Description: Composant central réutilisable pour gérer tous les meta tags SEO
 * Usage: <SEOMeta title="..." description="..." ... />
 */

import { Helmet } from 'react-helmet';

export interface SEOMetaProps {
  // Basiques
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  
  // URLs
  url: string;
  canonical?: string;
  
  // Images
  image?: string;
  imageAlt?: string;
  imageWidth?: string;
  imageHeight?: string;
  
  // Type de contenu
  type?: 'website' | 'article' | 'product' | 'profile';
  locale?: string;
  
  // Article/Product specific
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  
  // Product specific
  price?: number;
  currency?: string;
  availability?: 'instock' | 'outofstock' | 'preorder';
  
  // Robots
  noindex?: boolean;
  nofollow?: boolean;
  
  // Twitter specific
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
}

export const SEOMeta = ({
  title,
  description,
  keywords,
  author = 'Payhula',
  url,
  canonical,
  image = 'https://payhula.vercel.app/og-default.jpg',
  imageAlt,
  imageWidth = '1200',
  imageHeight = '630',
  type = 'website',
  locale = 'fr_FR',
  publishedTime,
  modifiedTime,
  section,
  tags,
  price,
  currency,
  availability,
  noindex = false,
  nofollow = false,
  twitterCard = 'summary_large_image',
  twitterSite = '@payhuk',
  twitterCreator = '@payhuk',
}: SEOMetaProps) => {
  
  // Titre complet avec branding
  const fullTitle = title.includes('Payhula') ? title : `${title} | Payhula`;
  
  // Description tronquée si trop longue
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;
  
  // Configuration robots
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    'max-image-preview:large',
    'max-snippet:-1',
    'max-video-preview:-1'
  ].join(', ');
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Payhula" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={locale} />
      
      {/* Images OG */}
      <meta property="og:image" content={image} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:image:width" content={imageWidth} />
      <meta property="og:image:height" content={imageHeight} />
      <meta property="og:image:type" content="image/jpeg" />
      
      {/* Article Meta (si type = article) */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags && tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Product Meta (si type = product) */}
      {type === 'product' && price && currency && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
          {availability && <meta property="product:availability" content={availability} />}
          <meta property="product:condition" content="new" />
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={image} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
      
      {/* Additional Meta */}
      <meta name="theme-color" content="#007bff" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
};

export default SEOMeta;

