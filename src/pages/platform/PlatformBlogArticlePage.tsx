import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';
import { ArticleSchema } from '@/components/seo/ArticleSchema';
import { PageBodyContent } from '@/components/content/PageBodyContent';
import { PremiumFooter } from '@/components/landing/premium/PremiumFooter';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { BlogArticleEngagement } from '@/components/platform/blog/BlogArticleEngagement';
import { BlogCommentsSection } from '@/components/platform/blog/BlogCommentsSection';
import { usePlatformBlogT } from '@/hooks/usePlatformBlogT';
import {
  usePublicPlatformBlogPost,
  usePublicPlatformBlogPosts,
} from '@/hooks/platform/usePublicPlatformBlog';
import { PLATFORM_BLOG_ROUTE } from '@/lib/admin/platformBlogPageConfig';
import { resolvePlatformBlogLocale } from '@/lib/platform/platformBlogLocale';
import NotFound from '@/pages/NotFound';

const SITE = 'https://www.emarzona.com';

export default function PlatformBlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = usePlatformBlogT();
  const locale = resolvePlatformBlogLocale(i18n.language);
  const { data: post, isLoading, isError } = usePublicPlatformBlogPost(slug);
  const { data: allPosts = [] } = usePublicPlatformBlogPosts({ limit: 48 });
  const commentsRef = useRef<HTMLDivElement>(null);
  const dateLocale = locale === 'en' ? enUS : fr;

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!isLoading && (isError || !post)) {
    return <NotFound />;
  }

  const articleUrl = `${SITE}/blog/${slug ?? ''}`;
  const image = post?.og_image_url ?? post?.featured_image_url ?? `${SITE}/og-image.png`;

  const relatedPosts = post
    ? allPosts
        .filter(
          p => p.id !== post.id && (post.category ? p.category?.slug === post.category.slug : true)
        )
        .slice(0, 3)
    : [];

  return (
    <>
      {post ? (
        <>
          <SEOMeta
            title={post.seo_title || post.title}
            description={post.seo_description || post.excerpt}
            keywords={post.seo_keywords ?? undefined}
            url={post.canonical_url ?? articleUrl}
            canonical={post.canonical_url ?? articleUrl}
            image={image}
            imageAlt={post.featured_image_alt ?? post.title}
            type="article"
            locale={locale === 'en' ? 'en_US' : 'fr_FR'}
            publishedTime={post.published_at ?? undefined}
            modifiedTime={post.updated_at}
            section={post.category?.name}
            tags={post.tags}
            noindex={post.noindex}
          />
          <BreadcrumbSchema
            items={[
              { name: t('breadcrumb.home'), url: `${SITE}/` },
              { name: t('breadcrumb.blog'), url: `${SITE}${PLATFORM_BLOG_ROUTE}` },
              { name: post.title, url: articleUrl },
            ]}
          />
          <ArticleSchema
            title={post.title}
            description={post.seo_description || post.excerpt}
            url={articleUrl}
            image={image}
            imageAlt={post.featured_image_alt ?? post.title}
            authorName={post.author_name}
            publishedTime={post.published_at ?? undefined}
            modifiedTime={post.updated_at}
            keywords={post.tags}
            section={post.category?.name}
          />
        </>
      ) : null}

      <div className="min-h-screen bg-[#060608] text-white">
        <PremiumNav />

        <article className="pt-[4.75rem]">
          {isLoading ? (
            <div className="container mx-auto max-w-3xl px-4 py-10 space-y-4">
              <Skeleton className="h-10 w-3/4 bg-white/10" />
              <Skeleton className="h-4 w-1/2 bg-white/10" />
              <Skeleton className="h-64 w-full bg-white/10" />
            </div>
          ) : post ? (
            <>
              {post.featured_image_url ? (
                <div className="relative w-full overflow-hidden border-b border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/40 to-transparent" />
                  <img
                    src={post.featured_image_url}
                    alt={post.featured_image_alt ?? post.title}
                    className="mx-auto max-h-[min(52vh,520px)] w-full max-w-6xl object-cover"
                  />
                </div>
              ) : null}

              <div className="container mx-auto max-w-3xl px-4 py-10">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="mb-6 text-white/70 hover:text-white"
                >
                  <Link to={PLATFORM_BLOG_ROUTE}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('backToBlog')}
                  </Link>
                </Button>

                <header className="mb-8 border-b border-white/10 pb-8">
                  {post.category ? (
                    <Link to={`${PLATFORM_BLOG_ROUTE}?category=${post.category.slug}`}>
                      <Badge
                        variant="secondary"
                        className="mb-3 bg-white/10 text-white/80 hover:bg-white/15"
                      >
                        {post.category.name}
                      </Badge>
                    </Link>
                  ) : null}
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
                    {post.title}
                  </h1>
                  <p className="mt-4 text-lg leading-relaxed text-white/65">{post.excerpt}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <span className="font-medium text-white/70">{post.author_name}</span>
                    {post.published_at ? (
                      <span>
                        {format(new Date(post.published_at), 'PPP', { locale: dateLocale })}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t('readingTime', { count: post.reading_time_minutes })}
                    </span>
                  </div>
                  {post.tags.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <Link
                          key={tag}
                          to={`${PLATFORM_BLOG_ROUTE}?tag=${encodeURIComponent(tag)}`}
                          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/60 transition hover:border-white/30 hover:text-white"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </header>

                <PageBodyContent
                  content={post.content}
                  htmlClassName="prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-[var(--lp-gold-bright)] prose-p:text-white/80 prose-li:text-white/80 prose-img:rounded-xl"
                />

                <BlogArticleEngagement
                  postId={post.id}
                  articleUrl={articleUrl}
                  articleTitle={post.title}
                  allowComments={post.allow_comments}
                  onScrollToComments={scrollToComments}
                  t={t}
                  className="mt-10"
                />

                {post.author_bio ? (
                  <aside className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6">
                    <p className="text-sm font-semibold text-white">{post.author_name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{post.author_bio}</p>
                  </aside>
                ) : null}

                <div ref={commentsRef}>
                  <BlogCommentsSection
                    postId={post.id}
                    allowComments={post.allow_comments}
                    locale={locale}
                    t={t}
                  />
                </div>

                {relatedPosts.length > 0 ? (
                  <section className="mt-14 border-t border-white/10 pt-10">
                    <h2 className="text-xl font-semibold">{t('relatedTitle')}</h2>
                    <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                      {relatedPosts.map(related => (
                        <li key={related.id}>
                          <Link
                            to={`/blog/${related.slug}`}
                            className="group block overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition hover:border-white/20"
                          >
                            {related.featured_image_url ? (
                              <img
                                src={related.featured_image_url}
                                alt={related.featured_image_alt ?? related.title}
                                className="aspect-[16/10] w-full object-cover"
                              />
                            ) : (
                              <div className="aspect-[16/10] w-full bg-white/[0.04]" />
                            )}
                            <div className="p-4">
                              <h3 className="text-sm font-semibold leading-snug group-hover:text-[var(--lp-gold-bright)] line-clamp-2">
                                {related.title}
                              </h3>
                              <p className="mt-2 text-xs text-white/50 line-clamp-2">
                                {related.excerpt}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            </>
          ) : null}
        </article>

        <PremiumFooter />
      </div>
    </>
  );
}
