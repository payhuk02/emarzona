/**
 * Gestion vendeur des collections d'œuvres d'artiste
 */

import { useMemo, useState } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Boxes, ExternalLink, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  useStoreCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  type ArtistCollection,
  type CreateCollectionData,
} from '@/hooks/artist/useCollections';
import { generateSlug } from '@/lib/validation-utils';

type CollectionFormState = {
  collection_name: string;
  collection_slug: string;
  collection_description: string;
  collection_type: CreateCollectionData['collection_type'];
  is_public: boolean;
  is_featured: boolean;
};

const EMPTY_FORM: CollectionFormState = {
  collection_name: '',
  collection_slug: '',
  collection_description: '',
  collection_type: 'thematic',
  is_public: true,
  is_featured: false,
};

const TYPE_LABELS: Record<CreateCollectionData['collection_type'], string> = {
  thematic: 'Thématique',
  chronological: 'Chronologique',
  series: 'Série',
  exhibition: 'Exposition',
  custom: 'Personnalisée',
};

export default function ArtistCollectionsManagement() {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ArtistCollection | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<CollectionFormState>(EMPTY_FORM);

  const { data: collections = [], isLoading } = useStoreCollections(store?.id, true);
  const createMutation = useCreateCollection();
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter(
      c =>
        c.collection_name.toLowerCase().includes(q) ||
        c.collection_slug.toLowerCase().includes(q) ||
        (c.collection_description || '').toLowerCase().includes(q)
    );
  }, [collections, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (collection: ArtistCollection) => {
    setEditing(collection);
    setForm({
      collection_name: collection.collection_name,
      collection_slug: collection.collection_slug,
      collection_description: collection.collection_description || '',
      collection_type: collection.collection_type,
      is_public: collection.is_public,
      is_featured: collection.is_featured,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      collection_name: name,
      collection_slug: editing ? prev.collection_slug : generateSlug(name),
    }));
  };

  const handleSave = async () => {
    if (!store?.id || !form.collection_name.trim() || !form.collection_slug.trim()) return;

    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        collection_name: form.collection_name.trim(),
        collection_slug: form.collection_slug.trim(),
        collection_description: form.collection_description.trim() || undefined,
        collection_type: form.collection_type,
        is_public: form.is_public,
        is_featured: form.is_featured,
      });
    } else {
      await createMutation.mutateAsync({
        store_id: store.id,
        collection_name: form.collection_name.trim(),
        collection_slug: form.collection_slug.trim(),
        collection_description: form.collection_description.trim() || undefined,
        collection_type: form.collection_type,
        is_public: form.is_public,
        is_featured: form.is_featured,
      });
    }
    setDialogOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMutation.mutateAsync(deletingId);
    setDeletingId(null);
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  if (storeLoading) {
    return (
      <AppPageShell mainClassName="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AppPageShell>
    );
  }

  if (!store) {
    return (
      <AppPageShell mainClassName="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Sélectionnez une boutique artiste pour gérer vos collections.
            </p>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Boxes className="h-6 w-6 md:h-8 md:w-8 text-amber-700" />
              Collections d&apos;œuvres
            </h1>
            <p className="text-muted-foreground mt-1">
              Créez et gérez vos collections thématiques, séries et expositions.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle collection
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une collection…"
            className="max-w-md"
          />
          <Button variant="outline" onClick={() => navigate('/collections')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir le catalogue public
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="h-5 w-5" />
                Aucune collection
              </CardTitle>
              <CardDescription>
                Créez votre première collection pour regrouper des œuvres (série, exposition,
                thématique…).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(collection => (
              <Card key={collection.id} className="flex flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {collection.collection_name}
                    </CardTitle>
                    <div className="flex gap-1 shrink-0">
                      {collection.is_public ? (
                        <Badge variant="secondary">Public</Badge>
                      ) : (
                        <Badge variant="outline">Privé</Badge>
                      )}
                      {collection.is_featured && <Badge>Vedette</Badge>}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {collection.collection_description || TYPE_LABELS[collection.collection_type]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/collections/${collection.collection_slug}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Voir
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(collection)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Éditer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => setDeletingId(collection.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Supprimer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la collection' : 'Nouvelle collection'}</DialogTitle>
            <DialogDescription>
              Les collections publiques apparaissent sur /collections pour les visiteurs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Nom *</Label>
              <Input
                id="collection-name"
                value={form.collection_name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ex. Série Bleue 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-slug">Slug *</Label>
              <Input
                id="collection-slug"
                value={form.collection_slug}
                onChange={e => setForm(prev => ({ ...prev, collection_slug: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.collection_type}
                onValueChange={value =>
                  setForm(prev => ({
                    ...prev,
                    collection_type: value as CreateCollectionData['collection_type'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map(key => (
                    <SelectItem key={key} value={key}>
                      {TYPE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-desc">Description</Label>
              <Textarea
                id="collection-desc"
                value={form.collection_description}
                onChange={e =>
                  setForm(prev => ({ ...prev, collection_description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="collection-public">Visible publiquement</Label>
              <Switch
                id="collection-public"
                checked={form.is_public}
                onCheckedChange={checked => setForm(prev => ({ ...prev, is_public: checked }))}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="collection-featured">Mettre en vedette</Label>
              <Switch
                id="collection-featured"
                checked={form.is_featured}
                onCheckedChange={checked => setForm(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || !form.collection_name.trim() || !form.collection_slug.trim()}
            >
              {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette collection ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les œuvres ne seront pas supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPageShell>
  );
}
