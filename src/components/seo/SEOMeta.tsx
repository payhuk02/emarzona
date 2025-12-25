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
  author = 'Emarzona',
  url,
  canonical,
  image = 'https://emarzona.vercel.app/og-default.jpg',
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
  twitterSite = '@emarzona',
  twitterCreator = '@emarzona',
}: SEOMetaProps) => {
  
  // Conversion sécurisée en string
  const safeString = (value: any, fallback: string = ''): string => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'symbol') return fallback;
    try {
      return String(value);
    } catch {
      return fallback;
    }
  };
  
  // Titre complet avec branding
  const safeTitle = safeString(title, 'Emarzona');
  const fullTitle = safeTitle.includes('Emarzona') ? safeTitle : `${safeTitle} | Emarzona`;

  // Description tronquée si trop longue
  const safeDescription = safeString(description, 'Emarzona - Plateforme de ecommerce et marketing');
  const truncatedDescription = safeDescription.length > 160 
    ? safeDescription.substring(0, 157) + '...' 
    : safeDescription;
  
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
      {keywords ? <meta name="keywords" content={safeString(keywords)} /> : null}
      <meta name="author" content={safeString(author, 'Emarzona')} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={safeString(canonical || url, window.location.origin)} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={safeString(type, 'website')} />
      <meta property="og:site_name" content="Emarzona" />
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:url" content={safeString(url, window.location.origin)} />
      <meta property="og:locale" content={safeString(locale, 'fr_FR')} />
      
      {/* Images OG */}
      <meta property="og:image" content={safeString(image, 'https://emarzona.vercel.app/og-default.jpg')} />
      {imageAlt ? <meta property="og:image:alt" content={safeString(imageAlt)} /> : null}
      <meta property="og:image:width" content={safeString(imageWidth, '1200')} />
      <meta property="og:image:height" content={safeString(imageHeight, '630')} />
      <meta property="og:image:type" content="image/jpeg" />
      
      {/* Article Meta (si type = article) */}
      {type === 'article' && publishedTime ? <meta property="article:published_time" content={safeString(publishedTime)} /> : null}
      {type === 'article' && modifiedTime ? <meta property="article:modified_time" content={safeString(modifiedTime)} /> : null}
      {type === 'article' && author ? <meta property="article:author" content={safeString(author)} /> : null}
      {type === 'article' && section ? <meta property="article:section" content={safeString(section)} /> : null}
      {type === 'article' && tags ? tags.map(tag => (
        <meta key={safeString(tag)} property="article:tag" content={safeString(tag)} />
      )) : null}
      
      {/* Product Meta (si type = product) */}
      {type === 'product' && price !== undefined && price !== null && currency ? <meta property="product:price:amount" content={safeString(price)} /> : null}
      {type === 'product' && price !== undefined && price !== null && currency ? <meta property="product:price:currency" content={safeString(currency, 'XOF')} /> : null}
      {type === 'product' && price !== undefined && price !== null && currency && availability ? <meta property="product:availability" content={safeString(availability)} /> : null}
      {type === 'product' && price !== undefined && price !== null && currency ? <meta property="product:condition" content="new" /> : null}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={safeString(twitterCard, 'summary_large_image')} />
      <meta name="twitter:site" content={safeString(twitterSite, '@emarzona')} />
      <meta name="twitter:creator" content={safeString(twitterCreator, '@emarzona')} />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={safeString(image, 'https://emarzona.vercel.app/og-default.jpg')} />
      {imageAlt ? <meta name="twitter:image:alt" content={safeString(imageAlt)} /> : null}
      
      {/* Additional Meta */}
      <meta name="theme-color" content="#007bff" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
};

export default SEOMeta;

