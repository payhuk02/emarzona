/**
 * Admin — Blog plateforme (catégories + articles avec éditeur riche et SEO)
 */

import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditorPro } from '@/components/ui/rich-text-editor-pro';
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminBlogCategories,
  useAdminBlogPosts,
  useDeleteBlogPost,
  useUpsertBlogPost,
  type AdminBlogPost,
  type BlogPostInput,
  type BlogPostStatus,
} from '@/hooks/admin/useAdminPlatformBlog';
import { PLATFORM_BLOG_ROUTE } from '@/lib/admin/platformBlogPageConfig';
import {
  estimateReadingTimeMinutes,
  parseTagsInput,
  slugifyBlog,
} from '@/lib/platform/platformBlogUtils';
import { PlatformBlogImageField } from '@/components/admin/platform/PlatformBlogImageField';
import { BlogAIGeneratorDialog } from '@/components/admin/platform/BlogAIGeneratorDialog';

const STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'scheduled', label: 'Programmé' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' },
];

function emptyPost(): BlogPostInput {
  return {
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    status: 'draft',
    category_id: null,
    author_name: 'Emarzona',
    author_bio: 'Conseils e-commerce et produit pour la communauté Emarzona.',
    featured_image_url: 'https://www.emarzona.com/og-image.png',
    featured_image_alt: '',
    tags: [],
    is_featured: false,
    allow_comments: false,
    reading_time_minutes: 1,
    published_at: null,
    scheduled_at: null,
    seo_title: '',
    seo_description: '',
    seo_keywords: '',
    canonical_url: '',
    og_image_url: '',
    noindex: false,
    translations: {},
  };
}

function postToDraft(post: AdminBlogPost): BlogPostInput {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    category_id: post.category_id,
    author_name: post.author_name,
    author_bio: post.author_bio,
    featured_image_url: post.featured_image_url,
    featured_image_alt: post.featured_image_alt,
    tags: post.tags,
    is_featured: post.is_featured,
    allow_comments: post.allow_comments,
    reading_time_minutes: post.reading_time_minutes,
    published_at: post.published_at,
    scheduled_at: post.scheduled_at,
    seo_title: post.seo_title ?? '',
    seo_description: post.seo_description ?? '',
    seo_keywords: post.seo_keywords ?? '',
    canonical_url: post.canonical_url ?? '',
    og_image_url: post.og_image_url ?? '',
    noindex: post.noindex,
    translations: post.translations ?? {},
  };
}

export default function AdminPlatformBlog() {
  const { toast } = useToast();
  const { data: categories = [] } = useAdminBlogCategories();
  const { data: posts = [], isLoading, isError, refetch, isFetching } = useAdminBlogPosts();
  const upsertPost = useUpsertBlogPost();
  const deletePost = useDeleteBlogPost();

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<BlogPostInput>(emptyPost());
  const [tagsText, setTagsText] = useState('');
  const [enTitle, setEnTitle] = useState('');
  const [enExcerpt, setEnExcerpt] = useState('');
  const [enContent, setEnContent] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return [p.title, p.slug, p.excerpt].join(' ').toLowerCase().includes(q);
    });
  }, [posts, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      draft: posts.filter(p => p.status === 'draft').length,
      featured: posts.filter(p => p.is_featured).length,
    }),
    [posts]
  );

  const openNew = () => {
    setEditingId('new');
    setDraft(emptyPost());
    setTagsText('');
    setEnTitle('');
    setEnExcerpt('');
    setEnContent('');
  };

  const openEdit = (post: AdminBlogPost) => {
    setEditingId(post.id);
    setDraft(postToDraft(post));
    setTagsText(post.tags.join(', '));
    setEnTitle(post.translations?.en?.title ?? '');
    setEnExcerpt(post.translations?.en?.excerpt ?? '');
    setEnContent(post.translations?.en?.content ?? '');
  };

  const closeEditor = () => {
    setEditingId(null);
    setDraft(emptyPost());
  };

  const handleAiGenerated = ({
    draft: aiDraft,
    postId,
    en,
    tagsText: aiTags,
  }: {
    draft: BlogPostInput;
    postId: string | null;
    en: { title: string; excerpt: string; content: string };
    tagsText: string;
  }) => {
    if (postId) {
      setEditingId(postId);
    } else {
      setEditingId('new');
    }
    setDraft(aiDraft);
    setTagsText(aiTags);
    setEnTitle(en.title);
    setEnExcerpt(en.excerpt);
    setEnContent(en.content);
    void refetch();
  };

  useEffect(() => {
    const minutes = estimateReadingTimeMinutes(draft.content);
    setDraft(prev =>
      prev.reading_time_minutes === minutes ? prev : { ...prev, reading_time_minutes: minutes }
    );
  }, [draft.content]);

  const savePost = async () => {
    if (!draft.title.trim()) {
      toast({ title: 'Titre requis', variant: 'destructive' });
      return;
    }
    const slug = draft.slug.trim() || slugifyBlog(draft.title);
    const tags = parseTagsInput(tagsText);
    const translations = {
      ...(editingId && editingId !== 'new'
        ? posts.find(p => p.id === editingId)?.translations
        : {}),
      en: { title: enTitle.trim(), excerpt: enExcerpt.trim(), content: enContent.trim() },
    };

    let publishedAt = draft.published_at;
    if (draft.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString();
    }

    const payload: BlogPostInput & { id?: string } = {
      ...draft,
      id: editingId !== 'new' && editingId ? editingId : undefined,
      slug,
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim(),
      tags,
      translations,
      published_at: publishedAt,
      seo_title: draft.seo_title?.trim() || `${draft.title.trim()} | Blog Emarzona`,
      seo_description: draft.seo_description?.trim() || draft.excerpt.trim(),
      canonical_url: draft.canonical_url?.trim() || null,
      og_image_url: draft.og_image_url?.trim() || draft.featured_image_url,
    };

    try {
      await upsertPost.mutateAsync(payload);
      toast({ title: editingId === 'new' ? 'Article créé' : 'Article mis à jour' });
      closeEditor();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Échec de la sauvegarde',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (post: AdminBlogPost) => {
    if (!window.confirm(`Supprimer « ${post.title} » ?`)) return;
    try {
      await deletePost.mutateAsync(post.id);
      toast({ title: 'Article supprimé' });
      if (editingId === post.id) closeEditor();
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  if (editingId) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-5xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" onClick={closeEditor}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-1" />
                IA
              </Button>
              {draft.slug && draft.status === 'published' ? (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`${PLATFORM_BLOG_ROUTE}/${draft.slug}`} target="_blank">
                    <Eye className="h-4 w-4 mr-1" />
                    Aperçu
                  </Link>
                </Button>
              ) : null}
              <Button onClick={savePost} disabled={upsertPost.isPending}>
                <Save className="h-4 w-4 mr-1" />
                Enregistrer
              </Button>
            </div>
          </div>

          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="seo">SEO premium</TabsTrigger>
              <TabsTrigger value="publish">Publication</TabsTrigger>
              <TabsTrigger value="en">Traduction EN</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Article</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre (FR)</Label>
                    <Input
                      value={draft.title}
                      onChange={e => setDraft({ ...draft, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Slug URL</Label>
                      <Input
                        value={draft.slug}
                        placeholder={slugifyBlog(draft.title)}
                        onChange={e => setDraft({ ...draft, slug: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={draft.category_id ?? 'none'}
                        onValueChange={v =>
                          setDraft({ ...draft, category_id: v === 'none' ? null : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucune</SelectItem>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Extrait / chapô</Label>
                    <Textarea
                      rows={3}
                      value={draft.excerpt}
                      onChange={e => setDraft({ ...draft, excerpt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenu (éditeur riche)</Label>
                    <RichTextEditorPro
                      content={draft.content}
                      onChange={content => setDraft({ ...draft, content })}
                      maxHeight="560px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (séparés par des virgules)</Label>
                    <Input value={tagsText} onChange={e => setTagsText(e.target.value)} />
                  </div>
                  <PlatformBlogImageField
                    label="Image à la une"
                    value={draft.featured_image_url ?? ''}
                    onChange={featured_image_url => setDraft({ ...draft, featured_image_url })}
                    slug={draft.slug || slugifyBlog(draft.title)}
                    purpose="featured"
                  />
                  <div className="space-y-2">
                    <Label>Alt image à la une</Label>
                    <Input
                      value={draft.featured_image_alt ?? ''}
                      onChange={e => setDraft({ ...draft, featured_image_alt: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Référencement Google</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre SEO</Label>
                    <Input
                      value={draft.seo_title ?? ''}
                      placeholder={`${draft.title || 'Titre'} | Blog Emarzona`}
                      onChange={e => setDraft({ ...draft, seo_title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta description (max ~160 car.)</Label>
                    <Textarea
                      rows={3}
                      value={draft.seo_description ?? ''}
                      onChange={e => setDraft({ ...draft, seo_description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mots-clés</Label>
                    <Input
                      value={draft.seo_keywords ?? ''}
                      onChange={e => setDraft({ ...draft, seo_keywords: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL canonique (optionnel)</Label>
                    <Input
                      placeholder={`https://www.emarzona.com/blog/${draft.slug || 'slug'}`}
                      value={draft.canonical_url ?? ''}
                      onChange={e => setDraft({ ...draft, canonical_url: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <PlatformBlogImageField
                      label="Image Open Graph"
                      value={draft.og_image_url ?? ''}
                      onChange={og_image_url => setDraft({ ...draft, og_image_url })}
                      slug={draft.slug || slugifyBlog(draft.title)}
                      purpose="og"
                    />
                    <div className="space-y-2">
                      <Label className="invisible sm:visible">Copie</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:mt-8"
                        disabled={!draft.featured_image_url}
                        onClick={() =>
                          setDraft({ ...draft, og_image_url: draft.featured_image_url ?? '' })
                        }
                      >
                        Utiliser l&apos;image à la une
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={draft.noindex}
                      onCheckedChange={noindex => setDraft({ ...draft, noindex })}
                    />
                    <Label>Noindex (masquer des moteurs de recherche)</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select
                        value={draft.status}
                        onValueChange={v => setDraft({ ...draft, status: v as BlogPostStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Temps de lecture (min)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={draft.reading_time_minutes}
                        onChange={e =>
                          setDraft({
                            ...draft,
                            reading_time_minutes: Number(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date de publication</Label>
                      <Input
                        type="datetime-local"
                        value={draft.published_at ? draft.published_at.slice(0, 16) : ''}
                        onChange={e =>
                          setDraft({
                            ...draft,
                            published_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Programmation (optionnel)</Label>
                      <Input
                        type="datetime-local"
                        value={draft.scheduled_at ? draft.scheduled_at.slice(0, 16) : ''}
                        onChange={e =>
                          setDraft({
                            ...draft,
                            scheduled_at: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : null,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Auteur affiché</Label>
                    <Input
                      value={draft.author_name}
                      onChange={e => setDraft({ ...draft, author_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio auteur</Label>
                    <Textarea
                      rows={2}
                      value={draft.author_bio ?? ''}
                      onChange={e => setDraft({ ...draft, author_bio: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={draft.is_featured}
                        onCheckedChange={is_featured => setDraft({ ...draft, is_featured })}
                      />
                      <Label>Article à la une</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={draft.allow_comments}
                        onCheckedChange={allow_comments => setDraft({ ...draft, allow_comments })}
                      />
                      <Label>Commentaires (futur)</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="en" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Traduction anglaise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Titre EN</Label>
                    <Input value={enTitle} onChange={e => setEnTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Extrait EN</Label>
                    <Textarea
                      rows={3}
                      value={enExcerpt}
                      onChange={e => setEnExcerpt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenu EN</Label>
                    <RichTextEditorPro
                      content={enContent}
                      onChange={setEnContent}
                      maxHeight="480px"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <BlogAIGeneratorDialog
          open={aiDialogOpen}
          onOpenChange={setAiDialogOpen}
          categories={categories}
          onGenerated={handleAiGenerated}
          onSaved={() => void refetch()}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Newspaper className="h-7 w-7" />
              Blog plateforme
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Articles publics sur{' '}
              <Link to={PLATFORM_BLOG_ROUTE} className="underline inline-flex items-center gap-1">
                {PLATFORM_BLOG_ROUTE}
                <ExternalLink className="h-3 w-3" />
              </Link>
              . SEO index dans Personnalisation &gt; Pages.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAiDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-1" />
              Générer avec IA
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" />
              Nouvel article
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Publiés', value: stats.published },
            { label: 'Brouillons', value: stats.draft },
            { label: 'À la une', value: stats.featured },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Rechercher un article…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={v => setStatusFilter(v as BlogPostStatus | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Appliquez la migration blog (`platform_blog_*`) puis réessayez.
            </CardContent>
          </Card>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Aucun article.</p>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" />
                Créer un article
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium truncate">{post.title}</p>
                    <Badge variant="outline">{post.status}</Badge>
                    {post.is_featured ? <Badge>À la une</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    /blog/{post.slug}
                    {post.published_at
                      ? ` · ${format(new Date(post.published_at), 'PPP', { locale: fr })}`
                      : ''}
                    · {post.reading_time_minutes} min
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {post.status === 'published' ? (
                    <Button size="icon" variant="ghost" asChild>
                      <Link to={`${PLATFORM_BLOG_ROUTE}/${post.slug}`} target="_blank">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null}
                  <Button size="icon" variant="ghost" onClick={() => openEdit(post)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(post)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BlogAIGeneratorDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        categories={categories}
        onGenerated={handleAiGenerated}
        onSaved={() => void refetch()}
      />
    </AdminLayout>
  );
}
