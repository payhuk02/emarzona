import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProductsOptimized } from '@/hooks/useProductsOptimized';
import { Plus, Trash2 } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { Order } from '@/hooks/useOrders';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  order: Order | null;
  storeId: string;
}

interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

const OrderEditDialogComponent = ({
  open,
  onOpenChange,
  onSuccess,
  order,
  storeId,
}: OrderEditDialogProps) => {
  const { toast } = useToast();
  // ✅ PERFORMANCE: Utiliser useProductsOptimized avec pagination pour éviter de charger tous les produits
  const { products } = useProductsOptimized(storeId, {
    page: 1,
    itemsPerPage: 100, // Limiter à 100 produits pour la sélection
    status: 'active', // Seulement les produits actifs
  });

  // ✅ PHASE 4: Mémoriser les produits actifs pour éviter recalculs à chaque render
  const activeProducts = useMemo(() => {
    return products?.filter(p => p.is_active) || [];
  }, [products]);

  const { useBottomSheet } = useResponsiveModal();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [status, setStatus] = useState<string>('pending');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');

  useEffect(() => {
    const loadOrderData = async () => {
      if (!order || !open) return;

      setNotes(order.notes || '');
      setPaymentMethod(order.payment_method || 'cash');
      setStatus(order.status);
      setPaymentStatus(order.payment_status);

      // Load order items
      try {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (error) throw error;

        const loadedItems: OrderItem[] = (data || []).map(item => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          currency: order.currency,
        }));

        setItems(loadedItems);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Une erreur est survenue lors du chargement';
        toast({
          title: 'Erreur',
          description: errorMessage || 'Impossible de charger les articles',
          variant: 'destructive',
        });
      }
    };

    loadOrderData();
  }, [order, open]);

  const handleAddItem = useCallback(() => {
    if (!products || products.length === 0) {
      toast({
        title: 'Attention',
        description: 'Aucun produit disponible',
        variant: 'destructive',
      });
      return;
    }

    const firstActiveProduct = products.find(p => p.is_active);
    if (!firstActiveProduct) {
      toast({
        title: 'Attention',
        description: 'Aucun produit actif disponible',
        variant: 'destructive',
      });
      return;
    }

    setItems(prev => [
      ...prev,
      {
        productId: firstActiveProduct.id,
        productName: firstActiveProduct.name,
        quantity: 1,
        unitPrice: Number(firstActiveProduct.price),
        currency: order?.currency || 'FCFA',
      },
    ]);
  }, [products, order?.currency]); // Note: toast est stable

  const handleRemoveItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: keyof OrderItem, value: string | number) => {
      setItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'productId') {
          const selectedProduct = products?.find(p => p.id === value);
          if (selectedProduct) {
            newItems[index].productName = selectedProduct.name;
            newItems[index].unitPrice = Number(selectedProduct.price);
            newItems[index].currency = selectedProduct.currency || 'FCFA';
          }
        }

        return newItems;
      });
    },
    [products]
  );

  // ✅ PHASE 5: Mémoriser le calcul du total pour éviter recalculs à chaque render
  const calculateTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [items]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!order) return;

      if (items.length === 0) {
        toast({
          title: 'Erreur',
          description: 'Ajoutez au moins un produit à la commande',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      try {
        const totalAmount = calculateTotal();

        // Update order
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            total_amount: totalAmount,
            payment_method: paymentMethod,
            status: status,
            payment_status: paymentStatus,
            notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        if (orderError) throw orderError;

        // Delete existing order items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);

        if (deleteError) throw deleteError;

        // Create new order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.quantity * item.unitPrice,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) throw itemsError;

        toast({
          title: 'Succès',
          description: `Commande ${order.order_number} modifiée avec succès`,
        });

        onSuccess();
        onOpenChange(false);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [order, items, paymentMethod, status, paymentStatus, notes, onSuccess, onOpenChange]
  ); // Note: toast est stable

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!order) return null;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Statuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MobileFormField
          label="Statut commande"
          name="status"
          type="select"
          value={status}
          onChange={value => setStatus(value)}
          selectOptions={[
            { value: 'pending', label: 'En attente' },
            { value: 'processing', label: 'En cours' },
            { value: 'completed', label: 'Terminée' },
            { value: 'cancelled', label: 'Annulée' },
          ]}
        />

        <MobileFormField
          label="Statut paiement"
          name="paymentStatus"
          type="select"
          value={paymentStatus}
          onChange={value => setPaymentStatus(value)}
          selectOptions={[
            { value: 'pending', label: 'En attente' },
            { value: 'paid', label: 'Payée' },
            { value: 'failed', label: 'Échouée' },
          ]}
        />
      </div>

      {/* Produits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Produits *</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">
              Aucun produit. Cliquez sur "Ajouter un produit".
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 md:col-span-5">
                    <Label className="text-xs">Produit</Label>
                    <Select
                      value={item.productId}
                      onValueChange={value => handleItemChange(index, 'productId', value)}
                    >
                      <SelectTrigger className="min-h-[44px] h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProducts.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {formatPrice(Number(product.price))} {product.currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-xs">Qté</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                      className="h-9"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <Label className="text-xs">Prix unit.</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={e => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                      className="h-9"
                    />
                  </div>

                  <div className="col-span-10 md:col-span-2">
                    <Label className="text-xs">Total</Label>
                    <div className="h-9 flex items-center font-semibold">
                      {formatPrice(item.quantity * item.unitPrice)} {item.currency}
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      aria-label={`Supprimer l'article ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      {items.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total de la commande</span>
            <span className="text-2xl font-bold">
              {formatPrice(calculateTotal())} {order.currency}
            </span>
          </div>
        </Card>
      )}

      {/* Mode de paiement */}
      <MobileFormField
        label="Mode de paiement"
        name="paymentMethod"
        type="select"
        value={paymentMethod}
        onChange={value => setPaymentMethod(value)}
        selectOptions={[
          { value: 'cash', label: 'Espèces' },
          { value: 'card', label: 'Carte bancaire' },
          { value: 'mobile', label: 'Paiement mobile' },
          { value: 'transfer', label: 'Virement' },
        ]}
      />

      {/* Notes */}
      <MobileFormField
        label="Notes"
        name="notes"
        type="textarea"
        value={notes}
        onChange={setNotes}
        fieldProps={{
          placeholder: 'Notes sur la commande...',
          rows: 3,
        }}
      />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading || items.length === 0} className="w-full sm:w-auto">
          {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title={`Modifier commande ${order.order_number}`}
            description="Modifiez les détails de cette commande"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier commande {order.order_number}</DialogTitle>
              <DialogDescription>Modifiez les détails de cette commande</DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

OrderEditDialogComponent.displayName = 'OrderEditDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrderEditDialog = React.memo(OrderEditDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onSuccess === nextProps.onSuccess &&
    prevProps.storeId === nextProps.storeId &&
    prevProps.order?.id === nextProps.order?.id &&
    prevProps.order?.status === nextProps.order?.status &&
    prevProps.order?.total === nextProps.order?.total
  );
});

OrderEditDialog.displayName = 'OrderEditDialog';
