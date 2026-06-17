import type { ReactNode } from 'react';
import type { LegalDocument } from '@/types/legal';
import { PlainTextContent } from '@/components/content/PlainTextContent';
import { normalizeContentForDisplay } from '@/lib/content/plain-text-content';

interface LegalDocumentContentProps {
  document: LegalDocument | null | undefined;
  fallback: ReactNode;
}

/**
 * Affiche le contenu publié en base (legal_documents) en texte brut, ou le template statique.
 */
export function LegalDocumentContent({ document, fallback }: LegalDocumentContentProps) {
  if (document?.content?.trim()) {
    return (
      <PlainTextContent
        text={normalizeContentForDisplay(document.content)}
        headingClassName="text-gray-900"
        paragraphClassName="text-gray-700"
        listClassName="text-gray-700"
      />
    );
  }
  return <>{fallback}</>;
}
