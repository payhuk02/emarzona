import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  storeId: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export const CreateOrderDialog = ({ open, onOpenChange, onSuccess, storeId }: CreateOrderDialogProps) => {
  const { toast } = useToast();
  const { customers } = useCustomers(storeId);
  const { products } = useProducts(storeId);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

  const handleAddItem = () => {
    if (!products || products.length === 0) {
      toast({
        title: "Attention",
        description: "Aucun produit disponible",
        variant: "destructive",
      });
      return;
    }

    const firstActiveProduct = products.find(p => p.is_active);
    if (!firstActiveProduct) {
      toast({
        title: "Attention",
        description: "Aucun produit actif disponible",
        variant: "destructive",
      });
      return;
    }

    setItems([
      ...items,
      {
        productId: firstActiveProduct.id,
        productName: firstActiveProduct.name,
        quantity: 1,
        unitPrice: Number(firstActiveProduct.price),
        currency: firstActiveProduct.currency || 'FCFA',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Si on change le produit, mettre à jour le prix et le nom
    if (field === 'productId') {
      const selectedProduct = products?.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].productName = selectedProduct.name;
        newItems[index].unitPrice = Number(selectedProduct.price);
        newItems[index].currency = selectedProduct.currency || 'FCFA';
      }
    }

    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast({
        title: "Erreur",
        description: "Ajoutez au moins un produit à la commande",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalAmount = calculateTotal();
      const currency = items[0]?.currency || 'FCFA';

      // Generate order number
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId || null,
          order_number: orderNumber,
          total_amount: totalAmount,
          currency: currency,
          payment_method: paymentMethod,
          payment_status: 'pending',
          status: 'pending',
          notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Succès",
        description: `Commande ${orderNumber} créée avec succès`,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCustomerId("");
    setItems([]);
    setNotes("");
    setPaymentMethod("cash");
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle commande</DialogTitle>
          <DialogDescription>
            Créez une nouvelle commande pour votre boutique
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="customer">Client (optionnel)</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Produits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Produits *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>

            {items.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <p className="text-muted-foreground">
                  Aucun produit ajouté. Cliquez sur "Ajouter un produit" pour commencer.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* Produit */}
                      <div className="col-span-12 md:col-span-5">
                        <Label className="text-xs">Produit</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => handleItemChange(index, 'productId', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.filter(p => p.is_active).map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {formatPrice(Number(product.price))} {product.currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantité */}
                      <div className="col-span-6 md:col-span-2">
                        <Label className="text-xs">Qté</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>

                      {/* Prix unitaire */}
                      <div className="col-span-6 md:col-span-2">
                        <Label className="text-xs">Prix unit.</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-10 md:col-span-2">
                        <Label className="text-xs">Total</Label>
                        <div className="h-9 flex items-center font-semibold">
                          {formatPrice(item.quantity * item.unitPrice)} {item.currency}
                        </div>
                      </div>

                      {/* Supprimer */}
                      <div className="col-span-2 md:col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-9 w-9 text-destructive hover:text-destructive"
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

          {/* Total commande */}
          {items.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total de la commande</span>
                <span className="text-2xl font-bold">
                  {formatPrice(calculateTotal())} {items[0]?.currency || 'FCFA'}
                </span>
              </div>
            </Card>
          )}

          {/* Mode de paiement */}
          <div className="space-y-2">
            <Label htmlFor="payment">Mode de paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Espèces</SelectItem>
                <SelectItem value="card">Carte bancaire</SelectItem>
                <SelectItem value="mobile">Paiement mobile</SelectItem>
                <SelectItem value="transfer">Virement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur la commande..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? "Création..." : "Créer la commande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
