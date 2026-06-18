import type { ReactNode } from 'react';
import type { LegalDocument } from '@/types/legal';
import { PageBodyContent } from '@/components/content/PageBodyContent';

interface LegalDocumentContentProps {
  document: LegalDocument | null | undefined;
  fallback: ReactNode;
}

/**
 * Affiche le contenu publié en base (legal_documents) ou le template statique.
 */
export function LegalDocumentContent({ document, fallback }: LegalDocumentContentProps) {
  if (document?.content?.trim()) {
    return (
      <PageBodyContent
        content={document.content}
        htmlClassName="prose-blue prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700"
        headingClassName="text-gray-900"
        paragraphClassName="text-gray-700"
        listClassName="text-gray-700"
      />
    );
  }
  return <>{fallback}</>;
}
