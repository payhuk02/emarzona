import { cn } from '@/lib/utils';
import { PlainTextContent } from '@/components/content/PlainTextContent';
import { SafeHTML } from '@/components/security/SafeHTML';
import { looksLikeHtml } from '@/lib/content/plain-text-content';

interface PageBodyContentProps {
  content: string;
  className?: string;
  /** Classes prose pour le rendu HTML */
  htmlClassName?: string;
  headingClassName?: string;
  paragraphClassName?: string;
  listClassName?: string;
}

/**
 * Affiche le corps d'une page : HTML sécurisé (éditeur riche admin) ou texte brut structuré.
 */
export function PageBodyContent({
  content,
  className,
  htmlClassName,
  headingClassName,
  paragraphClassName,
  listClassName,
}: PageBodyContentProps) {
  if (!content.trim()) return null;

  if (looksLikeHtml(content)) {
    return (
      <SafeHTML
        html={content}
        as="article"
        className={cn(
          'prose max-w-none prose-headings:font-semibold prose-a:underline',
          htmlClassName,
          className
        )}
      />
    );
  }

  return (
    <PlainTextContent
      text={content}
      className={className}
      headingClassName={headingClassName}
      paragraphClassName={paragraphClassName}
      listClassName={listClassName}
    />
  );
}
