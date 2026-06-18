import { useEffect } from 'react';

export interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  authorName?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  section?: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  image = 'https://www.emarzona.com/og-image.png',
  imageAlt,
  authorName = 'Emarzona',
  publishedTime,
  modifiedTime,
  keywords,
  section,
}: ArticleSchemaProps) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      image: [image],
      author: {
        '@type': 'Organization',
        name: authorName,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Emarzona',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.emarzona.com/og-image.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      ...(publishedTime ? { datePublished: publishedTime } : {}),
      ...(modifiedTime ? { dateModified: modifiedTime } : {}),
      ...(section ? { articleSection: section } : {}),
      ...(keywords && keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
      ...(imageAlt ? { thumbnailUrl: image } : {}),
    };

    const existing = document.querySelector('script[data-article-schema="true"]');
    existing?.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-article-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.querySelector('script[data-article-schema="true"]')?.remove();
    };
  }, [
    title,
    description,
    url,
    image,
    imageAlt,
    authorName,
    publishedTime,
    modifiedTime,
    keywords,
    section,
  ]);

  return null;
}
