/**
 * Stock Adjustment Dialog
 * Date: 28 octobre 2025
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdjustStock } from '@/hooks/physical/useInventory';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus } from 'lucide-react';

interface StockAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  item,
}: StockAdjustmentDialogProps) {
  const { toast } = useToast();
  const adjustStock = useAdjustStock();

  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!item || !quantity) return;

    const adjustmentQuantity = adjustmentType === 'add' ? parseInt(quantity) : -parseInt(quantity);

    try {
      await adjustStock.mutateAsync({
        inventoryItemId: item.id,
        quantity: adjustmentQuantity,
        reason,
        notes,
      });

      toast({
        title: '✅ Ajustement enregistré',
        description: `Stock ${adjustmentType === 'add' ? 'ajouté' : 'retiré'} avec succès`,
      });

      // Reset form
      setQuantity('');
      setReason('');
      setNotes('');
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajuster le stock',
        variant: 'destructive',
      });
    }
  };

  if (!item) return null;

  const productName =
    item.physical_product?.product?.name ||
    item.variant?.physical_product?.product?.name ||
    'N/A';

  const variantInfo = item.variant
    ? ` (${item.variant.option1_value}${
        item.variant.option2_value ? ' / ' + item.variant.option2_value : ''
      })`
    : '';

  const newQuantity =
    adjustmentType === 'add'
      ? item.quantity_available + (parseInt(quantity) || 0)
      : item.quantity_available - (parseInt(quantity) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuster le Stock</DialogTitle>
          <DialogDescription>
            {productName}
            {variantInfo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Stock */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock Actuel</p>
                <p className="text-2xl font-bold">{item.quantity_available}</p>
                <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>
              </div>
              {quantity && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Nouveau Stock</p>
                  <p
                    className={`text-2xl font-bold ${
                      newQuantity < 0
                        ? 'text-red-600'
                        : newQuantity > item.quantity_available
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {newQuantity}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <Label>Type d'Ajustement</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Button
                type="button"
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('add')}
                className="justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('remove')}
                className="justify-start"
              >
                <Minus className="h-4 w-4 mr-2" />
                Retirer
              </Button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantité *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="mt-2"
            />
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Raison</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Réception fournisseur, Inventaire physique..."
              className="mt-2"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Commentaires additionnels..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Warning if negative */}
          {newQuantity < 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-900 dark:text-red-100">
              ⚠️ Attention : Cette action résultera en un stock négatif
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!quantity || adjustStock.isPending}
            >
              {adjustStock.isPending ? 'Enregistrement...' : 'Confirmer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

