/**
 * Dialog — génération IA d'article blog premium (brouillon)
 */
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, Image as ImageIcon, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBlogArticleWithAI, type BlogAIGenerateResponse } from '@/lib/ai-blog-generator';
import type { AdminBlogCategory } from '@/hooks/admin/useAdminPlatformBlog';
import type { BlogPostInput } from '@/hooks/admin/useAdminPlatformBlog';

interface BlogAIGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: AdminBlogCategory[];
  onGenerated: (result: {
    draft: BlogPostInput;
    postId: string | null;
    en: { title: string; excerpt: string; content: string };
    tagsText: string;
  }) => void;
  onSaved?: (postId: string) => void;
}

type Step = 'form' | 'generating' | 'done';

export function BlogAIGeneratorDialog({
  open,
  onOpenChange,
  categories,
  onGenerated,
  onSaved,
}: BlogAIGeneratorDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('form');
  const [topic, setTopic] = useState('');
  const [brief, setBrief] = useState('');
  const [keywords, setKeywords] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [tone, setTone] = useState<'premium' | 'expert' | 'friendly' | 'educational'>('premium');
  const [generateImage, setGenerateImage] = useState(false);
  const [generateEn, setGenerateEn] = useState(true);
  const [saveAsDraft, setSaveAsDraft] = useState(true);
  const [result, setResult] = useState<BlogAIGenerateResponse | null>(null);
  const [progress, setProgress] = useState('');

  const reset = () => {
    setStep('form');
    setResult(null);
    setProgress('');
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Sujet requis', variant: 'destructive' });
      return;
    }

    setStep('generating');
    setProgress('Analyse de la plateforme (RAG) et rédaction…');

    try {
      const kw = keywords
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (generateImage) {
        setTimeout(() => setProgress('Rédaction terminée — génération image premium…'), 8000);
      }

      const data = await generateBlogArticleWithAI({
        topic: topic.trim(),
        brief: brief.trim() || topic.trim(),
        targetKeywords: kw,
        categoryId: categoryId === 'none' ? null : categoryId,
        tone,
        generateImage,
        generateEnTranslation: generateEn,
        saveAsDraft,
      });

      setResult(data);
      setStep('done');
      toast({
        title: saveAsDraft && data.postId ? 'Brouillon créé' : 'Article généré',
        description: `« ${data.article.title} » — modèle ${data.model}`,
      });

      if (data.postId) onSaved?.(data.postId);
    } catch (e) {
      setStep('form');
      toast({
        title: 'Échec génération IA',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const applyToEditor = () => {
    if (!result) return;
    const a = result.article;
    const draft: BlogPostInput = {
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      status: 'draft',
      category_id: categoryId === 'none' ? null : categoryId,
      author_name: a.author_name,
      author_bio: a.author_bio,
      featured_image_url: a.featured_image_url,
      featured_image_alt: a.featured_image_alt,
      tags: a.tags,
      is_featured: false,
      allow_comments: a.allow_comments,
      reading_time_minutes: a.reading_time_minutes,
      published_at: null,
      scheduled_at: null,
      seo_title: a.seo_title,
      seo_description: a.seo_description,
      seo_keywords: a.seo_keywords,
      canonical_url: '',
      og_image_url: a.og_image_url ?? a.featured_image_url,
      noindex: false,
      translations: a.translations ?? {},
    };

    onGenerated({
      draft,
      postId: result.postId,
      en: {
        title: a.translations?.en?.title ?? '',
        excerpt: a.translations?.en?.excerpt ?? '',
        content: a.translations?.en?.content ?? '',
      },
      tagsText: a.tags.join(', '),
    });
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Générer un article premium avec l&apos;IA
          </DialogTitle>
          <DialogDescription>
            L&apos;IA analyse Emarzona (RAG), rédige un article complet, optimise le SEO et génère
            une image hero. Sauvegarde en brouillon par défaut.
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Sujet / titre envisagé *</Label>
              <Input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ex. Comment lancer sa boutique en ligne en 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Brief éditorial</Label>
              <Textarea
                rows={3}
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="Angle, public cible, points à couvrir…"
              />
            </div>
            <div className="space-y-2">
              <Label>Mots-clés SEO (virgules)</Label>
              <Input
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e-commerce, marketplace, Afrique, vente en ligne"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-2">
                <Label>Ton</Label>
                <Select value={tone} onValueChange={v => setTone(v as typeof tone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                    <SelectItem value="friendly">Accessible</SelectItem>
                    <SelectItem value="educational">Pédagogique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Image hero premium
                </Label>
                <Switch checked={generateImage} onCheckedChange={setGenerateImage} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Traduction anglaise</Label>
                <Switch checked={generateEn} onCheckedChange={setGenerateEn} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Sauver en brouillon
                </Label>
                <Switch checked={saveAsDraft} onCheckedChange={setSaveAsDraft} />
              </div>
            </div>
          </div>
        ) : null}

        {step === 'generating' ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">{progress}</p>
            <p className="text-xs text-muted-foreground">Cela peut prendre 30–90 secondes</p>
          </div>
        ) : null}

        {step === 'done' && result ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{result.article.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {result.article.excerpt}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.article.tags.slice(0, 5).map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {result.article.featured_image_url ? (
              <img
                src={result.article.featured_image_url}
                alt={result.article.featured_image_alt}
                className="w-full rounded-lg aspect-video object-cover"
              />
            ) : null}
            <p className="text-xs text-muted-foreground">
              SEO : {result.article.seo_keywords?.slice(0, 80)}…
            </p>
            {result.postId ? (
              <Badge variant="outline">
                Brouillon enregistré (ID: {result.postId.slice(0, 8)}…)
              </Badge>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'form' ? (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Annuler
              </Button>
              <Button onClick={handleGenerate} disabled={!topic.trim()}>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </>
          ) : null}
          {step === 'done' ? (
            <>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Fermer
              </Button>
              <Button onClick={applyToEditor}>Ouvrir dans l&apos;éditeur</Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
