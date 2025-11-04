/**
 * Warehouse Transfers Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des transferts entre entrepôts
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
import { useWarehouses, useWarehouseTransfers, useCreateWarehouseTransfer, useUpdateTransferStatus } from '@/hooks/physical/useWarehouses';
import { useStore } from '@/hooks/useStore';
import { Plus, Truck, ArrowRight, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const TRANSFER_STATUSES: { value: any; label: string; color: string }[] = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'approved', label: 'Approuvé', color: 'bg-blue-500' },
  { value: 'in_transit', label: 'En transit', color: 'bg-purple-500' },
  { value: 'received', label: 'Reçu', color: 'bg-green-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-emerald-600' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' },
];

export default function WarehouseTransfers() {
  const { store } = useStore();
  const { data: warehouses } = useWarehouses(store?.id);
  const { data: transfers, isLoading } = useWarehouseTransfers(store?.id);
  const createTransfer = useCreateWarehouseTransfer();
  const updateStatus = useUpdateTransferStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromWarehouse, setFromWarehouse] = useState<string>('');
  const [toWarehouse, setToWarehouse] = useState<string>('');
  const [transferItems, setTransferItems] = useState<Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    from_location_id?: string;
    to_location_id?: string;
  }>>([{ product_id: '', quantity: 1 }]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddItem = () => {
    setTransferItems([...transferItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...transferItems];
    updated[index] = { ...updated[index], [field]: value };
    setTransferItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id || !fromWarehouse || !toWarehouse) {
      toast({
        title: '❌ Erreur',
        description: 'Veuillez sélectionner les entrepôts source et destination',
        variant: 'destructive',
      });
      return;
    }

    if (fromWarehouse === toWarehouse) {
      toast({
        title: '❌ Erreur',
        description: 'Les entrepôts source et destination doivent être différents',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTransfer.mutateAsync({
        storeId: store.id,
        fromWarehouseId: fromWarehouse,
        toWarehouseId: toWarehouse,
        items: transferItems.filter(item => item.product_id && item.quantity > 0),
        reason,
        notes,
      });
      setIsDialogOpen(false);
      setTransferItems([{ product_id: '', quantity: 1 }]);
      setReason('');
      setNotes('');
      setFromWarehouse('');
      setToWarehouse('');
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer le transfert',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (transferId: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await updateStatus.mutateAsync({
      transferId,
      status: newStatus as any,
      userId: user?.id,
    });
  };

  const filteredTransfers = transfers?.filter(transfer => {
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
    const matchesSearch = 
      transfer.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transfer.from_warehouse as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transfer.to_warehouse as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h2 className="text-2xl font-bold tracking-tight">Transferts entre Entrepôts</h2>
          <p className="text-muted-foreground">
            Gérez les transferts de stock entre vos entrepôts
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau transfert
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste des transferts</CardTitle>
              <CardDescription>
                {filteredTransfers.length} transfert{filteredTransfers.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {TRANSFER_STATUSES.map((status) => (
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
                  <TableHead>De</TableHead>
                  <TableHead>Vers</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucun transfert trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransfers.map((transfer) => {
                    const status = TRANSFER_STATUSES.find(s => s.value === transfer.status);
                    return (
                      <TableRow key={transfer.id}>
                        <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                        <TableCell>
                          {(transfer.from_warehouse as any)?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            {(transfer.to_warehouse as any)?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(transfer.requested_date), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transfer.status}
                            onValueChange={(value) => handleStatusUpdate(transfer.id, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRANSFER_STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>
                                  {s.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {transfer.expected_delivery_date ? (
                            format(new Date(transfer.expected_delivery_date), 'dd MMM yyyy', { locale: fr })
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

      {/* Dialog Create Transfer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau transfert entrepôt</DialogTitle>
            <DialogDescription>
              Créez un transfert de stock entre deux entrepôts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_warehouse">Entrepôt source *</Label>
                  <Select value={fromWarehouse} onValueChange={setFromWarehouse} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_warehouse">Entrepôt destination *</Label>
                  <Select value={toWarehouse} onValueChange={setToWarehouse} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.filter(w => w.id !== fromWarehouse).map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Articles</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un article
                  </Button>
                </div>

                {transferItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label>ID Produit *</Label>
                      <Input
                        placeholder="UUID du produit"
                        value={item.product_id}
                        onChange={(e) => handleUpdateItem(index, 'product_id', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantité *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="col-span-4">
                      <Label>ID Variante (optionnel)</Label>
                      <Input
                        placeholder="UUID variante"
                        value={item.variant_id || ''}
                        onChange={(e) => handleUpdateItem(index, 'variant_id', e.target.value || undefined)}
                      />
                    </div>
                    <div className="col-span-1">
                      {transferItems.length > 1 && (
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison du transfert</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Réapprovisionnement, réorganisation..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createTransfer.isPending}>
                Créer le transfert
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

