import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { getPlatformMarketingPageBySlug } from '@/lib/admin/platformMarketingPagesConfig';
import { usePlatformMarketingPage } from '@/hooks/usePlatformMarketingPage';
import NotFound from '@/pages/NotFound';

export default function PlatformMarketingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.replace(/^\//, '').split('/').filter(Boolean)[0] ?? '';
  const meta = slug ? getPlatformMarketingPageBySlug(slug) : undefined;

  if (!meta) {
    return <NotFound />;
  }

  return <PlatformMarketingPageContent meta={meta} onBack={() => navigate('/')} />;
}

function PlatformMarketingPageContent({
  meta,
  onBack,
}: {
  meta: NonNullable<ReturnType<typeof getPlatformMarketingPageBySlug>>;
  onBack: () => void;
}) {
  const { title, subtitle, body, seoTitle, seoDescription } = usePlatformMarketingPage(meta);

  return (
    <>
      <SEOMeta
        title={seoTitle}
        description={seoDescription}
        url={`https://www.emarzona.com${meta.route}`}
        canonical={`https://www.emarzona.com${meta.route}`}
        type="article"
      />
      <div className="min-h-screen bg-[#060608] text-white">
        <div className="border-b border-white/[0.06] bg-[#0a0a0c]">
          <div className="container mx-auto max-w-4xl px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-2 text-white/70 hover:text-white"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-white/60">{subtitle}</p> : null}
          </div>
        </div>
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <article
            className="prose prose-invert max-w-none prose-a:text-[var(--lp-blue)] prose-headings:text-white"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </div>
      </div>
    </>
  );
}
