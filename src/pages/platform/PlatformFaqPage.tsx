import { useMemo, useState } from 'react';

import { Link } from 'react-router-dom';

import { ChevronLeft, CircleHelp, Mail, Search, BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { SEOMeta } from '@/components/seo/SEOMeta';

import { FAQSchema } from '@/components/seo/FAQSchema';

import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

import { PremiumFooter } from '@/components/landing/premium/PremiumFooter';

import { PremiumNav } from '@/components/landing/premium/PremiumNav';

import { usePlatformFaqPage } from '@/hooks/usePlatformFaqPage';

import { usePlatformFaqT } from '@/hooks/usePlatformFaqT';

import {
  usePublicPlatformFaq,
  type PlatformFaqAudience,
  type PublicPlatformFaqCategory,
} from '@/hooks/platform/usePublicPlatformFaq';

import { PLATFORM_FAQ_ROUTE } from '@/lib/admin/platformFaqPageConfig';

import { cn } from '@/lib/utils';

const SITE = 'https://www.emarzona.com';

type AudienceFilter = 'all' | PlatformFaqAudience;

function normalizeSearch(text: string): string {
  return text

    .normalize('NFD')

    .replace(/\p{M}/gu, '')

    .toLowerCase();
}

function matchesQuery(
  item: { question: string; answer: string; keywords: string[] },

  query: string
): boolean {
  if (!query) return true;

  const haystack = normalizeSearch([item.question, item.answer, ...item.keywords].join(' '));

  return haystack.includes(query);
}

function filterCategories(
  categories: PublicPlatformFaqCategory[],

  audience: AudienceFilter,

  search: string
): PublicPlatformFaqCategory[] {
  const q = normalizeSearch(search.trim());

  return categories

    .filter(cat => audience === 'all' || cat.audience === 'all' || cat.audience === audience)

    .map(cat => ({
      ...cat,

      items: cat.items.filter(item => matchesQuery(item, q)),
    }))

    .filter(cat => cat.items.length > 0);
}

export default function PlatformFaqPage() {
  const { t } = usePlatformFaqT();

  const { title, subtitle, seoTitle, seoDescription, seoKeywords, locale } = usePlatformFaqPage();

  const { data: categories = [], isLoading, isError } = usePublicPlatformFaq();

  const [audience, setAudience] = useState<AudienceFilter>('all');

  const [search, setSearch] = useState('');

  const audienceLabels: Record<PlatformFaqAudience, string> = useMemo(
    () => ({
      all: t('audience.all'),

      seller: t('audience.seller'),

      buyer: t('audience.buyer'),
    }),

    [t]
  );

  const filtered = useMemo(
    () => filterCategories(categories, audience, search),

    [categories, audience, search]
  );

  const schemaFaqs = useMemo(
    () =>
      filtered.flatMap(cat =>
        cat.items.map(item => ({
          question: item.question,

          answer: item.answer,
        }))
      ),

    [filtered]
  );

  const totalQuestions = useMemo(
    () => filtered.reduce((sum, cat) => sum + cat.items.length, 0),

    [filtered]
  );

  const questionsLabel =
    totalQuestions > 1
      ? t('resultsCount_plural', { count: totalQuestions })
      : t('resultsCount', { count: totalQuestions });

  return (
    <>
      <SEOMeta
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url={`${SITE}${PLATFORM_FAQ_ROUTE}`}
        canonical={`${SITE}${PLATFORM_FAQ_ROUTE}`}
        locale={locale === 'en' ? 'en_US' : 'fr_FR'}
        type="website"
      />

      <BreadcrumbSchema
        items={[
          { name: t('breadcrumb.home'), url: `${SITE}/` },

          { name: t('breadcrumb.faq'), url: `${SITE}${PLATFORM_FAQ_ROUTE}` },
        ]}
      />

      {schemaFaqs.length > 0 ? <FAQSchema faqs={schemaFaqs} /> : null}

      <div className="min-h-screen bg-[#060608] text-white">
        <PremiumNav />

        <header className="border-b border-white/[0.06] bg-[#0a0a0c] pt-[4.75rem]">
          <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-12">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-4 text-white/70 hover:text-white"
            >
              <Link to="/">
                <ChevronLeft className="mr-2 h-4 w-4" />

                {t('backHome')}
              </Link>
            </Button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <CircleHelp className="h-6 w-6 text-[var(--lp-gold-bright)]" />
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
                  {subtitle}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />

                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-white/40"
                  aria-label={t('searchAria')}
                />
              </div>

              <Tabs
                value={audience}
                onValueChange={v => setAudience(v as AudienceFilter)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3 border border-white/10 bg-white/[0.03] sm:w-auto">
                  <TabsTrigger value="all">{t('audience.all')}</TabsTrigger>

                  <TabsTrigger value="seller">{t('audience.seller')}</TabsTrigger>

                  <TabsTrigger value="buyer">{t('audience.buyer')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-4xl px-4 py-10" id="faq-content">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-200">
              {t('loadError')}{' '}
              <Link to="/help" className="underline">
                {t('helpCenter')}
              </Link>
              .
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-white/70">{t('noResults')}</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-white/20 text-white"
                onClick={() => {
                  setSearch('');

                  setAudience('all');
                }}
              >
                {t('resetFilters')}
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              <p className="text-sm text-white/50">{questionsLabel}</p>

              {filtered.map(category => (
                <section
                  key={category.id}
                  id={category.slug}
                  aria-labelledby={`faq-cat-${category.slug}`}
                  className="scroll-mt-28"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <h2
                      id={`faq-cat-${category.slug}`}
                      className="text-xl font-semibold text-white"
                    >
                      {category.title}
                    </h2>

                    {category.audience !== 'all' ? (
                      <Badge variant="secondary" className="bg-white/10 text-white/80">
                        {audienceLabels[category.audience]}
                      </Badge>
                    ) : null}
                  </div>

                  {category.description ? (
                    <p className="mb-4 text-sm text-white/55">{category.description}</p>
                  ) : null}

                  <Accordion
                    type="multiple"
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-4"
                  >
                    {category.items.map(item => (
                      <AccordionItem key={item.id} value={item.id} className="border-white/10">
                        <AccordionTrigger className="text-left text-white hover:text-[var(--lp-gold-bright)]">
                          {item.question}
                        </AccordionTrigger>

                        <AccordionContent className="text-white/75 leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ))}
            </div>
          )}

          <aside
            className={cn(
              'mt-14 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-8'
            )}
          >
            <h2 className="text-lg font-semibold">{t('cta.title')}</h2>

            <p className="mt-2 text-sm text-white/60">{t('cta.body')}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="secondary" className="gap-2">
                <Link to="/help">
                  <BookOpen className="h-4 w-4" />

                  {t('cta.help')}
                </Link>
              </Button>

              <Button asChild variant="outline" className="gap-2 border-white/20 text-white">
                <Link to="/contact">
                  <Mail className="h-4 w-4" />

                  {t('cta.contact')}
                </Link>
              </Button>
            </div>
          </aside>
        </main>

        <PremiumFooter />
      </div>
    </>
  );
}
