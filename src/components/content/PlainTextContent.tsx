import { cn } from '@/lib/utils';
import {
  isPlainTextListBlock,
  isPlainTextSectionHeading,
  listItemsFromBlock,
  splitPlainTextParagraphs,
} from '@/lib/content/plain-text-content';

interface PlainTextContentProps {
  text: string;
  className?: string;
  headingClassName?: string;
  paragraphClassName?: string;
  listClassName?: string;
}

/**
 * Affiche du texte brut : paragraphes (séparés par une ligne vide), listes (- item) et titres numérotés.
 */
export function PlainTextContent({
  text,
  className,
  headingClassName,
  paragraphClassName,
  listClassName,
}: PlainTextContentProps) {
  const blocks = splitPlainTextParagraphs(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block, index) => {
        if (isPlainTextListBlock(block)) {
          return (
            <ul key={index} className={cn('list-disc space-y-1 pl-6', listClassName)}>
              {listItemsFromBlock(block).map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        if (isPlainTextSectionHeading(block)) {
          return (
            <h2
              key={index}
              className={cn('text-xl font-semibold tracking-tight', headingClassName)}
            >
              {block}
            </h2>
          );
        }

        return (
          <p key={index} className={cn('leading-relaxed whitespace-pre-wrap', paragraphClassName)}>
            {block}
          </p>
        );
      })}
    </div>
  );
}
