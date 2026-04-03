/**
 * FileCategoryForm - Formulaire de création/édition de catégorie
 * Date: 2025-01-27
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useFileCategories,
  useCreateFileCategory,
  FileCategory,
} from '@/hooks/digital/useAdvancedFileManagement';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';

interface FileCategoryFormProps {
  category?: FileCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

export const FileCategoryForm = ({ category, onSuccess, onCancel }: FileCategoryFormProps) => {
  const { toast } = useToast();
  const { data: categories } = useFileCategories();
  const createCategory = useCreateFileCategory();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '',
    parent_category_id: '',
    order_index: 0,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '',
        parent_category_id: category.parent_category_id || '',
        order_index: category.order_index,
      });
    }
  }, [category]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Récupérer le store_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('Aucune boutique trouvée');
      }

      await createCategory.mutateAsync({
        store_id: stores[0].id,
        ...formData,
        parent_category_id: formData.parent_category_id || undefined,
      });
      onSuccess();
    } catch ( _error: any) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la catégorie *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Documentation"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
          placeholder="documentation"
          required
        />
        <p className="text-sm text-muted-foreground">
          Identifiant unique (généré automatiquement)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de la catégorie"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon">Icône (emoji)</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            placeholder="📁"
            maxLength={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Couleur (hex)</Label>
          <Input
            id="color"
            type="color"
            value={formData.color || '#000000'}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent_category_id">Catégorie parente</Label>
        <Select
          value={formData.parent_category_id || '__none__'}
          onValueChange={(value) => setFormData({ ...formData, parent_category_id: value === '__none__' ? '' : value })}
        >
          <SelectTrigger id="parent_category_id">
            <SelectValue placeholder="Aucune (catégorie racine)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Aucune (catégorie racine)</SelectItem>
            {categories
              ?.filter(c => !c.parent_category_id && c.id !== category?.id)
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order_index">Ordre d'affichage</Label>
        <Input
          id="order_index"
          type="number"
          min="0"
          value={formData.order_index}
          onChange={(e) =>
            setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
          }
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={createCategory.isPending}>
          {createCategory.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {category ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};







