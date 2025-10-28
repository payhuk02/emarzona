/**
 * Digital Product - Basic Info Form (Step 1)
 * Date: 27 octobre 2025
 */

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencySelect } from '@/components/ui/currency-select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, X } from 'lucide-react';
import { generateSlug } from '@/lib/store-utils';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface DigitalBasicInfoFormProps {
  formData: any;
  updateFormData: (updates: any) => void;
  storeSlug: string;
}

const DIGITAL_CATEGORIES = [
  { value: 'ebook', label: 'Ebook / Livre numérique' },
  { value: 'template', label: 'Template / Modèle' },
  { value: 'logiciel', label: 'Logiciel / Application' },
  { value: 'plugin', label: 'Plugin / Extension' },
  { value: 'guide', label: 'Guide / Tutoriel' },
  { value: 'audio', label: 'Fichier audio / Musique' },
  { value: 'video', label: 'Vidéo' },
  { value: 'graphic', label: 'Graphisme / Design' },
  { value: 'photo', label: 'Photo / Image' },
  { value: 'autre', label: 'Autre' },
];

export const DigitalBasicInfoForm = ({
  formData,
  updateFormData,
  storeSlug,
}: DigitalBasicInfoFormProps) => {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  /**
   * Auto-generate slug from name
   */
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const newSlug = generateSlug(formData.name);
      updateFormData({ slug: newSlug });
    }
  }, [formData.name]);

  /**
   * Check slug availability
   */
  const checkSlug = async (slug: string) => {
    if (!slug) return;
    
    setSlugChecking(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .eq('store_id', formData.store_id || '');

      if (error) throw error;
      
      setSlugAvailable(data.length === 0);
    } catch (error) {
      console.error('Error checking slug:', error);
    } finally {
      setSlugChecking(false);
    }
  };

  /**
   * Regenerate slug
   */
  const regenerateSlug = () => {
    if (formData.name) {
      const newSlug = generateSlug(formData.name);
      updateFormData({ slug: newSlug });
      checkSlug(newSlug);
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du produit <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ex: Ebook - Guide complet du Marketing Digital"
          value={formData.name || ''}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
        />
        <p className="text-sm text-muted-foreground">
          Donnez un nom clair et descriptif à votre produit
        </p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          URL du produit
        </Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="slug"
              value={formData.slug || ''}
              onChange={(e) => {
                updateFormData({ slug: e.target.value });
                checkSlug(e.target.value);
              }}
              onBlur={() => checkSlug(formData.slug)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={regenerateSlug}
            disabled={!formData.name}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {storeSlug}/products/{formData.slug || '...'}
          </span>
          {slugChecking && <span className="text-muted-foreground">Vérification...</span>}
          {slugAvailable === true && (
            <span className="flex items-center text-green-600">
              <Check className="h-4 w-4 mr-1" />
              Disponible
            </span>
          )}
          {slugAvailable === false && (
            <span className="flex items-center text-destructive">
              <X className="h-4 w-4 mr-1" />
              Déjà utilisé
            </span>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Catégorie <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.category || 'ebook'}
          onValueChange={(value) => updateFormData({ category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {DIGITAL_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">
          Description courte
        </Label>
        <Textarea
          id="short_description"
          placeholder="Une brève description de votre produit (1-2 phrases)"
          value={formData.short_description || ''}
          onChange={(e) => updateFormData({ short_description: e.target.value })}
          rows={2}
          maxLength={160}
        />
        <p className="text-sm text-muted-foreground">
          {formData.short_description?.length || 0} / 160 caractères
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description complète
        </Label>
        <Textarea
          id="description"
          placeholder="Décrivez votre produit en détail : contenu, bénéfices, utilisation..."
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={6}
        />
      </div>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tarification</CardTitle>
          <CardDescription>
            Définissez le prix de votre produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                Prix <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.price || ''}
                onChange={(e) => updateFormData({ price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <CurrencySelect
                value={formData.currency || 'XOF'}
                onValueChange={(value) => updateFormData({ currency: value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promotional_price">Prix promotionnel (optionnel)</Label>
            <Input
              id="promotional_price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.promotional_price || ''}
              onChange={(e) => updateFormData({ promotional_price: parseFloat(e.target.value) || undefined })}
            />
            {formData.promotional_price && formData.promotional_price < formData.price && (
              <p className="text-sm text-green-600">
                Réduction de {Math.round(((formData.price - formData.promotional_price) / formData.price) * 100)}%
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image_url">Image du produit (URL)</Label>
        <Input
          id="image_url"
          type="url"
          placeholder="https://exemple.com/image.jpg"
          value={formData.image_url || ''}
          onChange={(e) => updateFormData({ image_url: e.target.value })}
        />
        {formData.image_url && (
          <div className="mt-2">
            <img
              src={formData.image_url}
              alt="Preview"
              className="h-32 w-32 object-cover rounded-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};


