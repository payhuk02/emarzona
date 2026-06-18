/**
 * Admin — gestion des FAQ plateforme (catégories + questions)
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CircleHelp, Download, ExternalLink, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadPlatformFaqJson } from '@/lib/platform/platformFaqExport';
import {
  useAdminPlatformFaqCategories,
  useAdminPlatformFaqItems,
  useDeletePlatformFaqCategory,
  useDeletePlatformFaqItem,
  useUpsertPlatformFaqCategory,
  useUpsertPlatformFaqItem,
  type AdminPlatformFaqCategory,
  type AdminPlatformFaqItem,
} from '@/hooks/admin/useAdminPlatformFaq';
import type { PlatformFaqAudience } from '@/hooks/platform/usePublicPlatformFaq';
import { PLATFORM_FAQ_ROUTE } from '@/lib/admin/platformFaqPageConfig';

const AUDIENCE_OPTIONS: { value: PlatformFaqAudience; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'seller', label: 'Vendeurs' },
  { value: 'buyer', label: 'Acheteurs' },
];

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

const emptyCategory = (): Omit<AdminPlatformFaqCategory, 'id' | 'created_at' | 'updated_at'> => ({
  slug: '',
  title: '',
  description: '',
  audience: 'all',
  sort_order: 0,
  is_active: true,
  translations: {},
});

const emptyItem = (
  categoryId: string
): Omit<AdminPlatformFaqItem, 'id' | 'created_at' | 'updated_at'> => ({
  category_id: categoryId,
  question: '',
  answer: '',
  keywords: [],
  sort_order: 0,
  is_active: true,
  translations: {},
});

export default function AdminPlatformFaq() {
  const { toast } = useToast();
  const {
    data: categories = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAdminPlatformFaqCategories();
  const { data: allItems = [] } = useAdminPlatformFaqItems();

  const upsertCategory = useUpsertPlatformFaqCategory();
  const upsertItem = useUpsertPlatformFaqItem();
  const deleteCategory = useDeletePlatformFaqCategory();
  const deleteItem = useDeletePlatformFaqItem();

  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    editing?: AdminPlatformFaqCategory;
    draft: ReturnType<typeof emptyCategory>;
    enTitle: string;
    enDescription: string;
  }>({ open: false, draft: emptyCategory(), enTitle: '', enDescription: '' });

  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    editing?: AdminPlatformFaqItem;
    draft: ReturnType<typeof emptyItem>;
    keywordsText: string;
    enQuestion: string;
    enAnswer: string;
  }>({
    open: false,
    draft: emptyItem(''),
    keywordsText: '',
    enQuestion: '',
    enAnswer: '',
  });

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, AdminPlatformFaqItem[]>();
    for (const item of allItems) {
      const list = map.get(item.category_id) ?? [];
      list.push(item);
      map.set(item.category_id, list);
    }
    return map;
  }, [allItems]);

  const stats = useMemo(
    () => ({
      categories: categories.length,
      activeCategories: categories.filter(c => c.is_active).length,
      items: allItems.length,
      activeItems: allItems.filter(i => i.is_active).length,
    }),
    [categories, allItems]
  );

  const openNewCategory = () => {
    const nextOrder =
      categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 10 : 10;
    setCategoryDialog({
      open: true,
      draft: { ...emptyCategory(), sort_order: nextOrder },
      enTitle: '',
      enDescription: '',
    });
  };

  const openEditCategory = (cat: AdminPlatformFaqCategory) => {
    setCategoryDialog({
      open: true,
      editing: cat,
      draft: {
        slug: cat.slug,
        title: cat.title,
        description: cat.description ?? '',
        audience: cat.audience,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
        translations: cat.translations ?? {},
      },
      enTitle: cat.translations?.en?.title ?? '',
      enDescription: cat.translations?.en?.description ?? '',
    });
  };

  const openNewItem = (categoryId: string) => {
    const catItems = itemsByCategory.get(categoryId) ?? [];
    const nextOrder = catItems.length > 0 ? Math.max(...catItems.map(i => i.sort_order)) + 10 : 10;
    setItemDialog({
      open: true,
      draft: { ...emptyItem(categoryId), sort_order: nextOrder },
      keywordsText: '',
      enQuestion: '',
      enAnswer: '',
    });
  };

  const openEditItem = (item: AdminPlatformFaqItem) => {
    setItemDialog({
      open: true,
      editing: item,
      draft: {
        category_id: item.category_id,
        question: item.question,
        answer: item.answer,
        keywords: item.keywords,
        sort_order: item.sort_order,
        is_active: item.is_active,
        translations: item.translations ?? {},
      },
      keywordsText: item.keywords.join(', '),
      enQuestion: item.translations?.en?.question ?? '',
      enAnswer: item.translations?.en?.answer ?? '',
    });
  };

  const saveCategory = async () => {
    const { draft, editing, enTitle, enDescription } = categoryDialog;
    if (!draft.title.trim()) {
      toast({ title: 'Titre requis', variant: 'destructive' });
      return;
    }
    const slug = draft.slug.trim() || slugify(draft.title);
    const translations = {
      ...(editing?.translations ?? {}),
      en: {
        title: enTitle.trim(),
        description: enDescription.trim(),
      },
    };
    try {
      await upsertCategory.mutateAsync({
        id: editing?.id,
        slug,
        title: draft.title.trim(),
        description: draft.description?.trim() || null,
        audience: draft.audience,
        sort_order: draft.sort_order,
        is_active: draft.is_active,
        translations,
      });
      toast({ title: editing ? 'Catégorie mise à jour' : 'Catégorie créée' });
      setCategoryDialog({ open: false, draft: emptyCategory(), enTitle: '', enDescription: '' });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Échec de la sauvegarde',
        variant: 'destructive',
      });
    }
  };

  const saveItem = async () => {
    const { draft, editing, keywordsText, enQuestion, enAnswer } = itemDialog;
    if (!draft.question.trim() || !draft.answer.trim()) {
      toast({ title: 'Question et réponse requises', variant: 'destructive' });
      return;
    }
    const keywords = keywordsText
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    const translations = {
      ...(editing?.translations ?? {}),
      en: {
        question: enQuestion.trim(),
        answer: enAnswer.trim(),
      },
    };
    try {
      await upsertItem.mutateAsync({
        id: editing?.id,
        category_id: draft.category_id,
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        keywords,
        sort_order: draft.sort_order,
        is_active: draft.is_active,
        translations,
      });
      toast({ title: editing ? 'Question mise à jour' : 'Question ajoutée' });
      setItemDialog({
        open: false,
        draft: emptyItem(''),
        keywordsText: '',
        enQuestion: '',
        enAnswer: '',
      });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Échec de la sauvegarde',
        variant: 'destructive',
      });
    }
  };

  const handleExportJson = () => {
    if (categories.length === 0) {
      toast({ title: 'Aucune donnée à exporter', variant: 'destructive' });
      return;
    }
    downloadPlatformFaqJson(categories, allItems);
    toast({ title: 'Export JSON téléchargé' });
  };

  const handleDeleteCategory = async (cat: AdminPlatformFaqCategory) => {
    if (!window.confirm(`Supprimer la catégorie « ${cat.title} » et toutes ses questions ?`)) {
      return;
    }
    try {
      await deleteCategory.mutateAsync(cat.id);
      toast({ title: 'Catégorie supprimée' });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (item: AdminPlatformFaqItem) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    try {
      await deleteItem.mutateAsync(item.id);
      toast({ title: 'Question supprimée' });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CircleHelp className="h-7 w-7" />
              FAQ plateforme
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gérez les questions affichées sur{' '}
              <Link to={PLATFORM_FAQ_ROUTE} className="underline inline-flex items-center gap-1">
                {PLATFORM_FAQ_ROUTE}
                <ExternalLink className="h-3 w-3" />
              </Link>
              . Le SEO de la page se personnalise dans Personnalisation &gt; Pages.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={categories.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </Button>
            <Button size="sm" onClick={openNewCategory}>
              <Plus className="h-4 w-4 mr-1" />
              Catégorie
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Catégories', value: stats.categories },
            { label: 'Catégories actives', value: stats.activeCategories },
            { label: 'Questions', value: stats.items },
            { label: 'Questions actives', value: stats.activeItems },
          ].map(stat => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Impossible de charger les FAQ. Vérifiez que la migration base de données est
              appliquée.
            </CardContent>
          </Card>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Aucune catégorie FAQ.</p>
              <Button onClick={openNewCategory}>
                <Plus className="h-4 w-4 mr-1" />
                Créer une catégorie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {categories.map(cat => {
              const items = itemsByCategory.get(cat.id) ?? [];
              return (
                <AccordionItem
                  key={cat.id}
                  value={cat.id}
                  className="border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-1 flex-wrap items-center gap-2 text-left">
                      <span className="font-semibold">{cat.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {cat.slug}
                      </Badge>
                      {!cat.is_active ? <Badge variant="secondary">Inactive</Badge> : null}
                      <Badge variant="secondary">{items.length} Q</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditCategory(cat)}>
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openNewItem(cat.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Question
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCategory(cat)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>

                    {cat.description ? (
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    ) : null}

                    <ul className="space-y-2">
                      {items.map(item => (
                        <li
                          key={item.id}
                          className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{item.question}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.answer}
                            </p>
                            {!item.is_active ? (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                Inactive
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditItem(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDeleteItem(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucune question dans cette catégorie.
                        </p>
                      ) : null}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      <Dialog
        open={categoryDialog.open}
        onOpenChange={open =>
          !open &&
          setCategoryDialog({ open: false, draft: emptyCategory(), enTitle: '', enDescription: '' })
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {categoryDialog.editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={categoryDialog.draft.title}
                onChange={e =>
                  setCategoryDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, title: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL ancre)</Label>
              <Input
                value={categoryDialog.draft.slug}
                placeholder={slugify(categoryDialog.draft.title) || 'ex: paiements'}
                onChange={e =>
                  setCategoryDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, slug: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description (FR)</Label>
              <Textarea
                value={categoryDialog.draft.description ?? ''}
                onChange={e =>
                  setCategoryDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, description: e.target.value },
                  }))
                }
              />
            </div>
            <div className="rounded-lg border border-dashed p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Traduction anglaise (EN)
              </p>
              <div className="space-y-2">
                <Label>Titre EN</Label>
                <Input
                  value={categoryDialog.enTitle}
                  onChange={e => setCategoryDialog(prev => ({ ...prev, enTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description EN</Label>
                <Textarea
                  value={categoryDialog.enDescription}
                  onChange={e =>
                    setCategoryDialog(prev => ({ ...prev, enDescription: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={categoryDialog.draft.audience}
                  onValueChange={v =>
                    setCategoryDialog(prev => ({
                      ...prev,
                      draft: { ...prev.draft, audience: v as PlatformFaqAudience },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input
                  type="number"
                  value={categoryDialog.draft.sort_order}
                  onChange={e =>
                    setCategoryDialog(prev => ({
                      ...prev,
                      draft: { ...prev.draft, sort_order: Number(e.target.value) || 0 },
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryDialog.draft.is_active}
                onCheckedChange={checked =>
                  setCategoryDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, is_active: checked },
                  }))
                }
              />
              <Label>Catégorie active (visible publiquement)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setCategoryDialog({
                  open: false,
                  draft: emptyCategory(),
                  enTitle: '',
                  enDescription: '',
                })
              }
            >
              Annuler
            </Button>
            <Button onClick={saveCategory} disabled={upsertCategory.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={itemDialog.open}
        onOpenChange={open =>
          !open &&
          setItemDialog({
            open: false,
            draft: emptyItem(''),
            keywordsText: '',
            enQuestion: '',
            enAnswer: '',
          })
        }
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {itemDialog.editing ? 'Modifier la question' : 'Nouvelle question'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={itemDialog.draft.category_id}
                onValueChange={v =>
                  setItemDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, category_id: v },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question (FR)</Label>
              <Input
                value={itemDialog.draft.question}
                onChange={e =>
                  setItemDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, question: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Réponse (FR)</Label>
              <Textarea
                rows={5}
                value={itemDialog.draft.answer}
                onChange={e =>
                  setItemDialog(prev => ({
                    ...prev,
                    draft: { ...prev.draft, answer: e.target.value },
                  }))
                }
              />
            </div>
            <div className="rounded-lg border border-dashed p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Traduction anglaise (EN)
              </p>
              <div className="space-y-2">
                <Label>Question EN</Label>
                <Input
                  value={itemDialog.enQuestion}
                  onChange={e => setItemDialog(prev => ({ ...prev, enQuestion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Réponse EN</Label>
                <Textarea
                  rows={4}
                  value={itemDialog.enAnswer}
                  onChange={e => setItemDialog(prev => ({ ...prev, enAnswer: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mots-clés (SEO interne, séparés par des virgules)</Label>
              <Input
                value={itemDialog.keywordsText}
                onChange={e =>
                  setItemDialog(prev => ({
                    ...prev,
                    keywordsText: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Input
                  type="number"
                  value={itemDialog.draft.sort_order}
                  onChange={e =>
                    setItemDialog(prev => ({
                      ...prev,
                      draft: { ...prev.draft, sort_order: Number(e.target.value) || 0 },
                    }))
                  }
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch
                  checked={itemDialog.draft.is_active}
                  onCheckedChange={checked =>
                    setItemDialog(prev => ({
                      ...prev,
                      draft: { ...prev.draft, is_active: checked },
                    }))
                  }
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setItemDialog({
                  open: false,
                  draft: emptyItem(''),
                  keywordsText: '',
                  enQuestion: '',
                  enAnswer: '',
                })
              }
            >
              Annuler
            </Button>
            <Button onClick={saveItem} disabled={upsertItem.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
