import type { ReactNode } from 'react';
import type { LegalDocument } from '@/types/legal';

interface LegalDocumentContentProps {
  document: LegalDocument | null | undefined;
  fallback: ReactNode;
}

/**
 * Affiche le contenu HTML publié en base (legal_documents) ou le template statique.
 */
export function LegalDocumentContent({ document, fallback }: LegalDocumentContentProps) {
  if (document?.content?.trim()) {
    return (
      <article
        className="prose prose-blue max-w-none legal-document-from-db"
        dangerouslySetInnerHTML={{ __html: document.content }}
      />
    );
  }
  return <>{fallback}</>;
}
