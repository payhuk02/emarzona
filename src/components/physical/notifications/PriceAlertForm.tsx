/**
 * PriceAlertForm - Formulaire de création d'alerte de prix
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePriceAlert } from '@/hooks/physical/usePhysicalNotifications';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/components/icons';

interface PriceAlertFormProps {
  productId?: string;
  variantId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PriceAlertForm = ({
  productId: initialProductId,
  variantId: initialVariantId,
  onSuccess,
  onCancel,
}: PriceAlertFormProps) => {
  const { toast } = useToast();
  const createAlert = useCreatePriceAlert();

  const [formData, setFormData] = useState({
    product_id: initialProductId || '',
    variant_id: initialVariantId || '',
    target_price: '',
    price_drop_threshold: '',
  });

  // Récupérer les produits physiques disponibles
  const { data: products } = useQuery({
    queryKey: ['physicalProductsForAlerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name')
        .eq('product_type', 'physical')
        .eq('is_active', true)
        .order('name');

      return data || [];
    },
  });

  // Récupérer les variants d'un produit
  const { data: variants } = useQuery({
    queryKey: ['productVariants', formData.product_id],
    queryFn: async () => {
      if (!formData.product_id) return [];

      const { data: physicalProduct } = await supabase
        .from('physical_products')
        .select('id')
        .eq('product_id', formData.product_id)
        .single();

      if (!physicalProduct) return [];

      const { data } = await supabase
        .from('physical_product_variants')
        .select('id, name')
        .eq('physical_product_id', physicalProduct.id)
        .order('name');

      return data || [];
    },
    enabled: !!formData.product_id,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez sélectionner un produit',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAlert.mutateAsync({
        product_id: formData.product_id,
        variant_id: formData.variant_id || undefined,
        target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
        price_drop_threshold: formData.price_drop_threshold
          ? parseFloat(formData.price_drop_threshold)
          : undefined,
      });
      onSuccess();
    } catch ( _error: any) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product_id">Produit *</Label>
        <Select
          value={formData.product_id}
          onValueChange={(value) => setFormData({ ...formData, product_id: value, variant_id: '' })}
          required
        >
          <SelectTrigger id="product_id">
            <SelectValue placeholder="Sélectionner un produit" />
          </SelectTrigger>
          <SelectContent>
            {products?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {variants && variants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="variant_id">Variante (optionnel)</Label>
          <Select
            value={formData.variant_id || '__none__'}
            onValueChange={(value) => setFormData({ ...formData, variant_id: value === '__none__' ? '' : value })}
          >
            <SelectTrigger id="variant_id">
              <SelectValue placeholder="Toutes les variantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Toutes les variantes</SelectItem>
              {variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target_price">Prix cible (optionnel)</Label>
          <Input
            id="target_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.target_price}
            onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
            placeholder="Ex: 5000"
          />
          <p className="text-xs text-muted-foreground">
            Alerte déclenchée si le prix atteint ce montant
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price_drop_threshold">Seuil de baisse % (optionnel)</Label>
          <Input
            id="price_drop_threshold"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.price_drop_threshold}
            onChange={(e) => setFormData({ ...formData, price_drop_threshold: e.target.value })}
            placeholder="Ex: 10"
          />
          <p className="text-xs text-muted-foreground">
            Alerte déclenchée si le prix baisse de ce pourcentage
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={createAlert.isPending}>
          {createAlert.isPending && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          Créer l'alerte
        </Button>
      </div>
    </form>
  );
};







