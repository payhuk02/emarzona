/**
 * Supplier Orders Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des commandes fournisseurs (création, suivi, réception)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupplierOrders, useCreateSupplierOrder, useSuppliers, SupplierOrder } from '@/hooks/physical/useSuppliers';
import { useStore } from '@/hooks/useStore';
import { Plus, Package, Calendar, DollarSign, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const ORDER_STATUSES: { value: SupplierOrder['status']; label: string; color: string }[] = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-500' },
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'sent', label: 'Envoyée', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmée', color: 'bg-green-500' },
  { value: 'processing', label: 'En traitement', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Expédiée', color: 'bg-indigo-500' },
  { value: 'partially_received', label: 'Partiellement reçue', color: 'bg-orange-500' },
  { value: 'received', label: 'Reçue', color: 'bg-green-600' },
  { value: 'cancelled', label: 'Annulée', color: 'bg-red-500' },
  { value: 'completed', label: 'Terminée', color: 'bg-emerald-600' },
];

export default function SupplierOrders() {
  const { store } = useStore();
  const { data: orders, isLoading } = useSupplierOrders(store?.id);
  const { data: suppliers } = useSuppliers(store?.id);
  const createOrder = useCreateSupplierOrder();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SupplierOrder['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [orderItems, setOrderItems] = useState<Array<{
    supplier_product_id?: string;
    product_id?: string;
    variant_id?: string;
    quantity: number;
    unit_cost: number;
  }>>([{ quantity: 1, unit_cost: 0 }]);
  const [notes, setNotes] = useState('');

  const handleAddItem = () => {
    setOrderItems([...orderItems, { quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !selectedSupplier) {
      toast({
        title: '❌ Erreur',
        description: 'Veuillez sélectionner un fournisseur',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createOrder.mutateAsync({
        storeId: store.id,
        supplierId: selectedSupplier,
        items: orderItems.filter(item => item.quantity > 0 && item.unit_cost > 0),
        notes,
      });
      setIsDialogOpen(false);
      setOrderItems([{ quantity: 1, unit_cost: 0 }]);
      setNotes('');
      setSelectedSupplier('');
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: SupplierOrder['status']) => {
    try {
      const { error } = await supabase
        .from('supplier_orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['supplier-orders'] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de la commande a été mis à jour',
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.supplier as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commandes Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gérez vos commandes auprès des fournisseurs
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des commandes</CardTitle>
              <CardDescription>
                {filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Livraison prévue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucune commande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const status = ORDER_STATUSES.find(s => s.value === order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {(order.supplier as any)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.order_date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: order.currency || 'XOF',
                            }).format(order.total_amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(value: SupplierOrder['status']) =>
                              handleStatusUpdate(order.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {order.expected_delivery_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: fr })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Non définie</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Voir détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Create Order */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle commande fournisseur</DialogTitle>
            <DialogDescription>
              Créez une nouvelle commande auprès d'un fournisseur
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Fournisseur *</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} {supplier.company_name && `(${supplier.company_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Articles</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un article
                  </Button>
                </div>

                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Produit / SKU</Label>
                      <Input
                        placeholder="ID produit ou SKU"
                        value={item.product_id || item.supplier_product_id || ''}
                        onChange={(e) =>
                          handleUpdateItem(index, item.product_id ? 'product_id' : 'supplier_product_id', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantité</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Coût unitaire</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={(e) =>
                          handleUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        value={(item.quantity * item.unit_cost).toFixed(2)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-1">
                      {orderItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-2 border-t">
                  <div className="text-lg font-semibold">
                    Total: {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                    }).format(
                      orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes supplémentaires sur la commande..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createOrder.isPending}>
                Créer la commande
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

