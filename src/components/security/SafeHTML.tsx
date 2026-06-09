import React from 'react';
import { sanitizeHTML } from '@/lib/html-sanitizer';

interface SafeHTMLProps {
  /** The HTML string to sanitize and render (preferred) */
  html?: string;
  /** Alias for html – kept for backwards compatibility */
  content?: string;
  className?: string;
  /** HTML element to render (alias: `as`) */
  tag?: keyof JSX.IntrinsicElements;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

/**
 * Composant pour afficher du HTML sécurisé
 * Utilise DOMPurify pour nettoyer le contenu HTML
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  content,
  className,
  tag,
  as,
  style,
}) => {
  const Tag = (as ?? tag ?? 'div') as React.ElementType;
  const rawHtml = html ?? content ?? '';
  const sanitizedContent = sanitizeHTML(rawHtml, 'richContent');

  return (
    <Tag
      className={className}
      style={style}
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







