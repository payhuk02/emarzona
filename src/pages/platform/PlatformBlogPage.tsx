import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronLeft, Clock, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { PremiumFooter } from '@/components/landing/premium/PremiumFooter';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { usePlatformBlogPage } from '@/hooks/usePlatformBlogPage';
import { usePlatformBlogT } from '@/hooks/usePlatformBlogT';
import { usePublicPlatformBlogPosts } from '@/hooks/platform/usePublicPlatformBlog';
import { PLATFORM_BLOG_ROUTE } from '@/lib/admin/platformBlogPageConfig';
import { BlogEngagementStats } from '@/components/platform/blog/BlogArticleEngagement';
import { cn } from '@/lib/utils';

const SITE = 'https://www.emarzona.com';

function blogTagButtonClass(active: boolean) {
  return cn(
    'h-8 border-white/20 bg-transparent text-white/70 hover:bg-white/[0.08] hover:text-white',
    active && 'border-white/30 bg-white/15 text-white hover:bg-white/15'
  );
}

export default function PlatformBlogPage() {
  const { t } = usePlatformBlogT();
  const [searchParams] = useSearchParams();
  const { title, subtitle, seoTitle, seoDescription, seoKeywords, locale } = usePlatformBlogPage();
  const tagFromUrl = searchParams.get('tag');
  const { data: posts = [], isLoading, isError } = usePublicPlatformBlogPosts({ limit: 48 });
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(tagFromUrl);

  useEffect(() => {
    if (tagFromUrl) setActiveTag(tagFromUrl);
  }, [tagFromUrl]);

  const dateLocale = locale === 'en' ? enUS : fr;

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const post of posts) {
      for (const tag of post.tags) set.add(tag);
    }
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(post => {
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!q) return true;
      const haystack = [post.title, post.excerpt, ...post.tags].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, search, activeTag]);

  const featured = filtered.find(p => p.is_featured) ?? filtered[0];
  const rest = filtered.filter(p => p.id !== featured?.id);

  return (
    <>
      <SEOMeta
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url={`${SITE}${PLATFORM_BLOG_ROUTE}`}
        canonical={`${SITE}${PLATFORM_BLOG_ROUTE}`}
        locale={locale === 'en' ? 'en_US' : 'fr_FR'}
        type="website"
      />
      <BreadcrumbSchema
        items={[
          { name: t('breadcrumb.home'), url: `${SITE}/` },
          { name: t('breadcrumb.blog'), url: `${SITE}${PLATFORM_BLOG_ROUTE}` },
        ]}
      />

      <div className="min-h-screen bg-[#060608] text-white">
        <PremiumNav />

        <header className="border-b border-white/[0.06] bg-[#0a0a0c] pt-[4.75rem]">
          <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-12">
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
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">{subtitle}</p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="border-white/10 bg-white/[0.04] pl-10 text-white placeholder:text-white/40"
                />
              </div>
              {allTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={blogTagButtonClass(activeTag === null)}
                    onClick={() => setActiveTag(null)}
                  >
                    {t('allTags')}
                  </Button>
                  {allTags.slice(0, 6).map(tag => (
                    <Button
                      key={tag}
                      size="sm"
                      variant="outline"
                      className={blogTagButtonClass(activeTag === tag)}
                      onClick={() => setActiveTag(tag)}
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-6xl px-4 py-10">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl bg-white/5" />
              ))}
            </div>
          ) : isError ? (
            <p className="text-center text-red-300">{t('loadError')}</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-white/60">{t('noResults')}</p>
          ) : (
            <div className="space-y-10">
              {featured ? (
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent"
                >
                  <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                    {featured.featured_image_url ? (
                      <img
                        src={featured.featured_image_url}
                        alt={featured.featured_image_alt ?? featured.title}
                        className="aspect-video w-full rounded-xl object-cover"
                      />
                    ) : null}
                    <div className="flex flex-col justify-center">
                      <Badge className="mb-3 w-fit bg-[var(--lp-gold-bright)]/20 text-[var(--lp-gold-bright)]">
                        {t('featured')}
                      </Badge>
                      {featured.category ? (
                        <span className="text-xs uppercase tracking-wide text-white/50">
                          {featured.category.name}
                        </span>
                      ) : null}
                      <h2 className="mt-2 text-2xl font-bold group-hover:text-[var(--lp-gold-bright)]">
                        {featured.title}
                      </h2>
                      <p className="mt-3 text-sm text-white/65 line-clamp-3">{featured.excerpt}</p>
                      <PostMeta post={featured} dateLocale={dateLocale} t={t} className="mt-4" />
                      <BlogEngagementStats
                        likes={featured.like_count ?? 0}
                        comments={featured.comment_count ?? 0}
                        views={featured.view_count ?? 0}
                        t={t}
                        className="mt-3"
                      />
                    </div>
                  </div>
                </Link>
              ) : null}

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map(post => (
                  <ArticleCard key={post.id} post={post} dateLocale={dateLocale} t={t} />
                ))}
              </div>
            </div>
          )}
        </main>

        <PremiumFooter />
      </div>
    </>
  );
}

function PostMeta({
  post,
  dateLocale,
  t,
  className,
}: {
  post: {
    published_at: string | null;
    reading_time_minutes: number;
    author_name: string;
    like_count?: number;
    comment_count?: number;
    view_count?: number;
  };
  dateLocale: typeof fr;
  t: (key: string, opts?: Record<string, unknown>) => string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 text-xs text-white/50', className)}>
      {post.published_at ? (
        <span>{format(new Date(post.published_at), 'PPP', { locale: dateLocale })}</span>
      ) : null}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {t('readingTime', { count: post.reading_time_minutes })}
      </span>
      <span>{post.author_name}</span>
    </div>
  );
}

function ArticleCard({
  post,
  dateLocale,
  t,
}: {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    featured_image_url: string | null;
    featured_image_alt: string | null;
    category: { name: string } | null;
    tags: string[];
    published_at: string | null;
    reading_time_minutes: number;
    author_name: string;
    like_count: number;
    comment_count: number;
    view_count: number;
  };
  dateLocale: typeof fr;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition hover:border-white/20"
    >
      {post.featured_image_url ? (
        <img
          src={post.featured_image_url}
          alt={post.featured_image_alt ?? post.title}
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div className="aspect-[16/9] w-full bg-white/[0.04]" />
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.category ? (
          <span className="text-xs uppercase tracking-wide text-white/45">
            {post.category.name}
          </span>
        ) : null}
        <h3 className="mt-2 font-semibold leading-snug group-hover:text-[var(--lp-gold-bright)]">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm text-white/60 line-clamp-3">{post.excerpt}</p>
        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] text-white/40"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        <PostMeta
          post={post}
          dateLocale={dateLocale}
          t={t}
          className="mt-4 border-t border-white/10 pt-3"
        />
        <BlogEngagementStats
          likes={post.like_count ?? 0}
          comments={post.comment_count ?? 0}
          views={post.view_count ?? 0}
          t={t}
          className="mt-2"
        />
      </div>
    </Link>
  );
}
