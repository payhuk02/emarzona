import React from 'react';
import { sanitizeHTML } from '@/lib/html-sanitizer';

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
  const sanitizedContent = sanitizeHTML(content, 'richContent');

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
    return sanitizeHTML(value, 'plainText');
  }, [value]);

  return {
    value,
    sanitizedValue,
    setValue,
  };
};
