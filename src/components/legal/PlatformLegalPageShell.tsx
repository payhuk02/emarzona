import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { PlainTextContent } from '@/components/content/PlainTextContent';
import { useLegalDocument } from '@/hooks/useLegal';
import { usePlatformLegalPage } from '@/hooks/usePlatformLegalPage';
import type { PlatformLegalPageMeta } from '@/lib/admin/platformLegalPagesConfig';

interface PlatformLegalPageShellProps {
  meta: PlatformLegalPageMeta;
  headerIcon?: ReactNode;
}

export function PlatformLegalPageShell({ meta, headerIcon }: PlatformLegalPageShellProps) {
  const navigate = useNavigate();
  const { data: legalDoc } = useLegalDocument(meta.documentType, 'fr');
  const { title, subtitle, body, seoTitle, seoDescription, effectiveDate, version } =
    usePlatformLegalPage(meta, legalDoc);

  const lastUpdated = effectiveDate ?? '27 octobre 2025';

  return (
    <>
      <SEOMeta
        title={seoTitle}
        description={seoDescription}
        url={`https://www.emarzona.com${meta.route}`}
        canonical={`https://www.emarzona.com${meta.route}`}
        type="article"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-2">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div className="flex items-center gap-3">
              {headerIcon}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Dernière mise à jour : {lastUpdated} • Version {version}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <PlainTextContent
              text={body}
              headingClassName="text-gray-900"
              paragraphClassName="text-gray-700"
              listClassName="text-gray-700"
            />
          </div>
        </div>
      </div>
    </>
  );
}
