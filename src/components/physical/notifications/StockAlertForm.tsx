/**
 * StockAlertForm - Formulaire de création d'alerte de stock
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateStockAlert } from '@/hooks/physical/usePhysicalNotifications';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/components/icons';

interface StockAlertFormProps {
  productId?: string;
  variantId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StockAlertForm = ({
  productId: initialProductId,
  variantId: initialVariantId,
  onSuccess,
  onCancel,
}: StockAlertFormProps) => {
  const { toast } = useToast();
  const createAlert = useCreateStockAlert();

  const [formData, setFormData] = useState({
    product_id: initialProductId || '',
    variant_id: initialVariantId || '',
    min_quantity_required: '1',
    notify_on_back_in_stock: true,
    notify_on_low_stock: false,
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
        min_quantity_required: parseInt(formData.min_quantity_required) || 1,
        notify_on_back_in_stock: formData.notify_on_back_in_stock,
        notify_on_low_stock: formData.notify_on_low_stock,
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

      <div className="space-y-2">
        <Label htmlFor="min_quantity_required">Quantité minimum requise</Label>
        <Input
          id="min_quantity_required"
          type="number"
          min="1"
          value={formData.min_quantity_required}
          onChange={(e) => setFormData({ ...formData, min_quantity_required: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Alerte déclenchée lorsque le stock atteint cette quantité
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifier retour en stock</Label>
            <div className="text-sm text-muted-foreground">
              Recevoir une alerte quand le produit revient en stock
            </div>
          </div>
          <Switch
            checked={formData.notify_on_back_in_stock}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, notify_on_back_in_stock: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Notifier stock faible</Label>
            <div className="text-sm text-muted-foreground">
              Recevoir une alerte quand le stock devient faible
            </div>
          </div>
          <Switch
            checked={formData.notify_on_low_stock}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, notify_on_low_stock: checked })
            }
          />
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







