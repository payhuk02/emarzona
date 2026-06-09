import type { ReactNode } from 'react';
import type { LegalDocument } from '@/types/legal';
import { SafeHTML } from '@/components/security/SafeHTML';
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
      <SafeHTML
        html={document.content}
        as="article"
        className="prose prose-blue max-w-none legal-document-from-db"
      />
    );
  }
  return <>{fallback}</>;
}
