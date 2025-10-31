/**
 * Composant SEO - Schema.org Course markup
 * Génère le JSON-LD pour améliorer l'affichage dans Google
 * Date : 27 octobre 2025
 */

import { useEffect } from 'react';

interface CourseSchemaProps {
  courseName: string;
  description: string;
  provider: {
    name: string;
    url?: string;
  };
  instructor?: {
    name: string;
    url?: string;
  };
  price?: number;
  currency?: string;
  category?: string;
  level?: string;
  language?: string;
  totalLessons?: number;
  duration?: string; // Format ISO 8601 (ex: "PT10H30M")
  rating?: {
    value: number;
    count: number;
  };
  image?: string;
  url?: string;
}

export const CourseSchema = ({
  courseName,
  description,
  provider,
  instructor,
  price,
  currency = 'XOF',
  category,
  level,
  language = 'fr',
  totalLessons,
  duration,
  rating,
  image,
  url,
}: CourseSchemaProps) => {
  useEffect(() => {
    // Créer le script JSON-LD
    const schema = {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": courseName,
      "description": description,
      "isFamilyFriendly": true,
      "provider": {
        "@type": "Organization",
        "name": provider.name,
        ...(provider.url && { "url": provider.url }),
      },
      ...(instructor && {
        "instructor": {
          "@type": "Person",
          "name": instructor.name,
          ...(instructor.url && { "url": instructor.url }),
        },
      }),
      ...(price !== undefined && {
        "offers": {
          "@type": "Offer",
          "price": price,
          "priceCurrency": currency,
          "availability": "https://schema.org/InStock",
          ...(url && { "url": url }),
        },
      }),
      ...(category && { "coursePrerequisites": category }),
      ...(level && { "educationalLevel": level }),
      "inLanguage": language,
      ...(totalLessons && { "numberOfLessons": totalLessons }),
      ...(duration && { "timeRequired": duration }),
      ...(rating && rating.count > 0 && {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": rating.value,
          "reviewCount": rating.count,
          "bestRating": "5",
          "worstRating": "1",
        },
      }),
      ...(image && { "image": image }),
      ...(url && { "url": url }),
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "online",
        "courseWorkload": duration || "PT1H",
      },
    };

    // Vérifier s'il existe déjà un script schema pour ce cours
    const existingScript = document.querySelector('script[data-course-schema="true"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Créer et insérer le nouveau script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-course-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Cleanup au démontage
    return () => {
      const scriptToRemove = document.querySelector('script[data-course-schema="true"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [
    courseName,
    description,
    provider,
    instructor,
    price,
    currency,
    category,
    level,
    language,
    totalLessons,
    duration,
    rating,
    image,
    url,
  ]);

  // Ce composant ne rend rien visuellement
  return null;
};

/**
 * Helper pour convertir des minutes en format ISO 8601
 * Ex: 90 minutes -> "PT1H30M"
 */
export const minutesToISO8601 = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  let result = 'PT';
  if (hours > 0) result += `${hours}H`;
  if (mins > 0) result += `${mins}M`;
  
  return result || 'PT0M';
};

