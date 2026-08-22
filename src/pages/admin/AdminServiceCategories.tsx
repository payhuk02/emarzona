/**
 * Admin — taxonomie Services (catégories / sous-catégories)
 */

import { useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Layers, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useDeleteServiceCategory,
  useReorderServiceCategories,
  useServiceCategoryTree,
  useSetServiceCategoryActive,
  useUpsertServiceCategory,
  type ServiceCategoryRow,
} from '@/hooks/useServiceCategories';
import { slugifyCategoryName } from '@/lib/services/service-categories';
import { SERVICE_FAMILY_LEAVES } from '@/lib/services/service-form-profiles';

type FormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = (parentId: string | null = null): FormState => ({
  name: '',
  slug: '',
  description: '',
  icon: '',
  parent_id: parentId,
  sort_order: 0,
  is_active: true,
});

export default function AdminServiceCategories() {
  const { toast } = useToast();
  const { tree, isLoading, isError, refetch, isFetching } = useServiceCategoryTree({
    includeInactive: true,
  });
  const upsert = useUpsertServiceCategory();
  const setActive = useSetServiceCategoryActive();
  const remove = useDeleteServiceCategory();
  const reorder = useReorderServiceCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const parents = useMemo(() => tree, [tree]);

  const openCreate = (parentId: string | null = null) => {
    const siblings = parentId == null ? tree : (tree.find(p => p.id === parentId)?.children ?? []);
    setForm({
      ...emptyForm(parentId),
      sort_order: siblings.length + 1,
    });
    setDialogOpen(true);
  };

  const openEdit = (row: ServiceCategoryRow) => {
    setForm({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      icon: row.icon ?? '',
      parent_id: row.parent_id,
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast({
        title: 'Champs requis',
        description: 'Nom et slug sont obligatoires',
        variant: 'destructive',
      });
      return;
    }
    try {
      await upsert.mutateAsync({
        id: form.id,
        name: form.name,
        slug: form.slug.startsWith('svc-') ? form.slug : slugifyCategoryName(form.slug),
        description: form.description || null,
        icon: form.icon || null,
        parent_id: form.parent_id,
        sort_order: form.sort_order,
        is_active: form.is_active,
      });
      toast({ title: form.id ? 'Catégorie mise à jour' : 'Catégorie créée' });
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Enregistrement impossible',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (row: ServiceCategoryRow) => {
    try {
      await setActive.mutateAsync({ id: row.id, isActive: !(row.is_active ?? true) });
      toast({
        title: row.is_active ? 'Catégorie désactivée' : 'Catégorie activée',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Action impossible',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (row: ServiceCategoryRow) => {
    try {
      const result = await remove.mutateAsync(row.id);
      toast({
        title: result === 'deleted' ? 'Catégorie supprimée' : 'Catégorie désactivée',
        description:
          result === 'deactivated'
            ? 'Des produits y sont liés — désactivation à la place de la suppression.'
            : undefined,
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  const moveSibling = async (
    siblings: ServiceCategoryRow[],
    id: string,
    direction: 'up' | 'down'
  ) => {
    const sorted = [...siblings].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const index = sorted.findIndex(s => s.id === id);
    if (index < 0) return;
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[swapWith];
    try {
      await reorder.mutateAsync([
        { id: a.id, sort_order: b.sort_order ?? swapWith },
        { id: b.id, sort_order: a.sort_order ?? index },
      ]);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Réordonnancement impossible',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-7 w-7 text-primary" aria-hidden />
              Catégories Services
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Taxonomie plateforme : catégorie → sous-catégorie (
              {Object.keys(SERVICE_FAMILY_LEAVES).length} familles)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button onClick={() => openCreate(null)} className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Catégorie
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arborescence</CardTitle>
            <CardDescription>
              Les vendeurs choisissent une sous-catégorie à la publication d&apos;un service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isError ? (
              <p className="text-sm text-destructive">Impossible de charger les catégories.</p>
            ) : parents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune catégorie service.</p>
            ) : (
              <Accordion type="multiple" className="w-full">
                {parents.map(parent => (
                  <AccordionItem key={parent.id} value={parent.id}>
                    <div className="flex items-center gap-2 pr-2">
                      <AccordionTrigger className="flex-1 hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-medium">{parent.name}</span>
                          <Badge variant="outline">{parent.children.length} sous-cat.</Badge>
                          {!(parent.is_active ?? true) && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => openCreate(parent.id)}
                          aria-label="Ajouter sous-catégorie"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => openEdit(parent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={parent.is_active ?? true}
                          onCheckedChange={() => void handleToggle(parent)}
                          aria-label="Activer catégorie"
                        />
                      </div>
                    </div>
                    <AccordionContent>
                      <ul className="space-y-2 pl-2 border-l ml-2">
                        {parent.children.map(child => (
                          <li
                            key={child.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2"
                          >
                            <div>
                              <p className="font-medium text-sm">{child.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {child.slug}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[40px]"
                                onClick={() => void moveSibling(parent.children, child.id, 'up')}
                              >
                                ↑
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="min-h-[40px]"
                                onClick={() => void moveSibling(parent.children, child.id, 'down')}
                              >
                                ↓
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9"
                                onClick={() => openEdit(child)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Switch
                                checked={child.is_active ?? true}
                                onCheckedChange={() => void handleToggle(child)}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-destructive"
                                onClick={() => void handleDelete(child)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                        {parent.children.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">
                            Aucune sous-catégorie
                          </p>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {form.id
                  ? 'Modifier la catégorie'
                  : form.parent_id
                    ? 'Nouvelle sous-catégorie'
                    : 'Nouvelle catégorie'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nom</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={e => {
                    const name = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      name,
                      slug: prev.id ? prev.slug : slugifyCategoryName(name),
                    }));
                  }}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  className="min-h-[44px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icône (clé)</Label>
                <Input
                  id="cat-icon"
                  value={form.icon}
                  onChange={e => setForm(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="ex. Code, Palette"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Parent</Label>
                <Select
                  value={form.parent_id ?? 'none'}
                  onValueChange={v =>
                    setForm(prev => ({ ...prev, parent_id: v === 'none' ? null : v }))
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Aucune (catégorie racine)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (catégorie racine)</SelectItem>
                    {parents.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-order">Ordre</Label>
                <Input
                  id="cat-order"
                  type="number"
                  value={form.sort_order}
                  onChange={e =>
                    setForm(prev => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
                  }
                  className="min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={v => setForm(prev => ({ ...prev, is_active: v }))}
                  id="cat-active"
                />
                <Label htmlFor="cat-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => void handleSave()} disabled={upsert.isPending}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
