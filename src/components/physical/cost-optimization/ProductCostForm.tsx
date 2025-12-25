/**
 * Product Cost Form Component
 * Date: 27 Janvier 2025
 * 
 * Formulaire pour saisir/modifier les coûts d'un produit
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateOrUpdateProductCost, ProductCost } from '@/hooks/physical/useCostOptimization';
import { useStore } from '@/hooks/useStore';
import { DollarSign, Save } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

interface ProductCostFormProps {
  productId: string;
  variantId?: string;
  existingCost?: ProductCost;
  onClose?: () => void;
}

export default function ProductCostForm({ productId, variantId, existingCost, onClose }: ProductCostFormProps) {
  const { store } = useStore();
  const createOrUpdateCost = useCreateOrUpdateProductCost();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<ProductCost>>({
    cost_of_goods_sold: existingCost?.cost_of_goods_sold || 0,
    manufacturing_cost: existingCost?.manufacturing_cost || 0,
    material_cost: existingCost?.material_cost || 0,
    labor_cost: existingCost?.labor_cost || 0,
    packaging_cost: existingCost?.packaging_cost || 0,
    overhead_cost: existingCost?.overhead_cost || 0,
    shipping_cost_per_unit: existingCost?.shipping_cost_per_unit || 0,
    storage_cost_per_unit: existingCost?.storage_cost_per_unit || 0,
    marketing_cost_per_unit: existingCost?.marketing_cost_per_unit || 0,
    platform_fees_percentage: existingCost?.platform_fees_percentage || 0,
    payment_processing_fees_percentage: existingCost?.payment_processing_fees_percentage || 0,
    tax_rate: existingCost?.tax_rate || 0,
    cost_basis_date: existingCost?.cost_basis_date || new Date().toISOString().split('T')[0],
    cost_source: existingCost?.cost_source || 'manual',
    notes: existingCost?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    try {
      await createOrUpdateCost.mutateAsync({
        ...formData,
        store_id: store.id,
        product_id: productId,
        variant_id: variantId,
      });
      onClose?.();
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const totalCost = 
    (formData.cost_of_goods_sold || 0) +
    (formData.manufacturing_cost || 0) +
    (formData.material_cost || 0) +
    (formData.labor_cost || 0) +
    (formData.packaging_cost || 0) +
    (formData.overhead_cost || 0) +
    (formData.shipping_cost_per_unit || 0) +
    (formData.storage_cost_per_unit || 0) +
    (formData.marketing_cost_per_unit || 0);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cost_of_goods_sold">Coût des marchandises vendues (COGS) *</Label>
            <Input
              id="cost_of_goods_sold"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_of_goods_sold || 0}
              onChange={(e) => setFormData({ ...formData, cost_of_goods_sold: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manufacturing_cost">Coût de fabrication</Label>
            <Input
              id="manufacturing_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.manufacturing_cost || 0}
              onChange={(e) => setFormData({ ...formData, manufacturing_cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material_cost">Coût des matières premières</Label>
            <Input
              id="material_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.material_cost || 0}
              onChange={(e) => setFormData({ ...formData, material_cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labor_cost">Coût de la main d'œuvre</Label>
            <Input
              id="labor_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.labor_cost || 0}
              onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="packaging_cost">Coût d'emballage</Label>
            <Input
              id="packaging_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.packaging_cost || 0}
              onChange={(e) => setFormData({ ...formData, packaging_cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping_cost_per_unit">Coût expédition/unité</Label>
            <Input
              id="shipping_cost_per_unit"
              type="number"
              step="0.01"
              min="0"
              value={formData.shipping_cost_per_unit || 0}
              onChange={(e) => setFormData({ ...formData, shipping_cost_per_unit: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage_cost_per_unit">Coût stockage/unité</Label>
            <Input
              id="storage_cost_per_unit"
              type="number"
              step="0.01"
              min="0"
              value={formData.storage_cost_per_unit || 0}
              onChange={(e) => setFormData({ ...formData, storage_cost_per_unit: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marketing_cost_per_unit">Coût marketing/unité</Label>
            <Input
              id="marketing_cost_per_unit"
              type="number"
              step="0.01"
              min="0"
              value={formData.marketing_cost_per_unit || 0}
              onChange={(e) => setFormData({ ...formData, marketing_cost_per_unit: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="overhead_cost">Frais généraux</Label>
            <Input
              id="overhead_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.overhead_cost || 0}
              onChange={(e) => setFormData({ ...formData, overhead_cost: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost_basis_date">Date de référence</Label>
            <Input
              id="cost_basis_date"
              type="date"
              value={formData.cost_basis_date || ''}
              onChange={(e) => setFormData({ ...formData, cost_basis_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform_fees_percentage">Frais plateforme (%)</Label>
            <Input
              id="platform_fees_percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.platform_fees_percentage || 0}
              onChange={(e) => setFormData({ ...formData, platform_fees_percentage: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_processing_fees_percentage">Frais paiement (%)</Label>
            <Input
              id="payment_processing_fees_percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.payment_processing_fees_percentage || 0}
              onChange={(e) => setFormData({ ...formData, payment_processing_fees_percentage: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_rate">Taux de taxe (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.tax_rate || 0}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <Card className="bg-muted">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">Coût total par unité</span>
              </div>
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                }).format(totalCost)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end gap-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={createOrUpdateCost.isPending}>
          <Save className="mr-2 h-4 w-4" />
          {createOrUpdateCost.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>
    </form>
  );
}

