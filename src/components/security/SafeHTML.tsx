import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  content: string;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
}

/**
 * Composant pour afficher du HTML sécurisé
 * Utilise DOMPurify pour nettoyer le contenu HTML
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({ 
  content, 
  className, 
  tag: Tag = 'div' 
}) => {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <Tag 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

/**
 * Hook pour nettoyer les données utilisateur
 */
export const useSanitizedInput = (initialValue: string = '') => {
  const [value, setValue] = React.useState(initialValue);
  
  const sanitizedValue = React.useMemo(() => {
    return DOMPurify.sanitize(value, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  }, [value]);

  return {
    value,
    sanitizedValue,
    setValue,
  };
};
