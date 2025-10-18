import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onPaymentCreated: () => void;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  customer_id: string | null;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

export const CreatePaymentDialog = ({
  open,
  onOpenChange,
  storeId,
  onPaymentCreated,
}: CreatePaymentDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState({
    order_id: "",
    customer_id: "",
    payment_method: "cash",
    amount: "",
    currency: "XOF",
    status: "completed",
    transaction_id: "",
    notes: "",
  });

  useEffect(() => {
    if (open && storeId) {
      fetchOrders();
      fetchCustomers();
    }
  }, [open, storeId]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, customer_id")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    
    setOrders(data || []);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("id, name, email")
      .eq("store_id", storeId)
      .order("name");
    
    setCustomers(data || []);
  };

  const handleOrderChange = (orderId: string) => {
    setFormData({ ...formData, order_id: orderId });
    
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setFormData({
        ...formData,
        order_id: orderId,
        customer_id: order.customer_id || "",
        amount: order.total_amount.toString(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("payments").insert({
        store_id: storeId,
        order_id: formData.order_id || null,
        customer_id: formData.customer_id || null,
        payment_method: formData.payment_method,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        status: formData.status,
        transaction_id: formData.transaction_id || null,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Paiement créé avec succès",
      });

      onPaymentCreated();
      onOpenChange(false);
      setFormData({
        order_id: "",
        customer_id: "",
        payment_method: "cash",
        amount: "",
        currency: "XOF",
        status: "completed",
        transaction_id: "",
        notes: "",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_id">Commande (optionnel)</Label>
              <Select value={formData.order_id} onValueChange={handleOrderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une commande" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - {order.total_amount} XOF
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Client (optionnel)</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Méthode de paiement *</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Espèces</SelectItem>
                  <SelectItem value="card">Carte bancaire</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                  <SelectItem value="check">Chèque</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              {formData.amount && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Commission plateforme (10%): {(parseFloat(formData.amount) * 0.10).toFixed(2)} {formData.currency}</p>
                  <p>Reversement vendeur (90%): {(parseFloat(formData.amount) * 0.90).toFixed(2)} {formData.currency}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_id">ID de transaction</Label>
              <Input
                id="transaction_id"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                placeholder="Ex: TRX123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer le paiement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
