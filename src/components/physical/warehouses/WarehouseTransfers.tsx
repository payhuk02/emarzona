/**
 * Warehouse Transfers Component
 * Date: 27 Janvier 2025
 * 
 * Gestion des transferts entre entrepôts
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
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
import { useWarehouses, useWarehouseTransfers, useCreateWarehouseTransfer, useUpdateTransferStatus, WarehouseTransfer } from '@/hooks/physical/useWarehouses';

type TransferStatus = WarehouseTransfer['status'];
import { useStore } from '@/hooks/useStore';
import { Plus, Truck, ArrowRight, Calendar, Search, X, RefreshCw, Package, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const TRANSFER_STATUSES: { value: TransferStatus; label: string; color: string }[] = [
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
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
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

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const transfersRef = useScrollAnimation<HTMLDivElement>();

  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    return transfers.filter(transfer => {
      const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = 
        transfer.transfer_number.toLowerCase().includes(searchLower) ||
        (transfer.from_warehouse as { name?: string } | null)?.name?.toLowerCase().includes(searchLower) ||
        (transfer.to_warehouse as { name?: string } | null)?.name?.toLowerCase().includes(searchLower);
      return matchesStatus && matchesSearch;
    });
  }, [transfers, statusFilter, debouncedSearch]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!filteredTransfers.length) return { total: 0, pending: 0, inTransit: 0, completed: 0 };
    const total = filteredTransfers.length;
    const pending = filteredTransfers.filter(t => t.status === 'pending').length;
    const inTransit = filteredTransfers.filter(t => t.status === 'in_transit').length;
    const completed = filteredTransfers.filter(t => t.status === 'completed').length;
    return { total, pending, inTransit, completed };
  }, [filteredTransfers]);

  const handleAddItem = () => {
    setTransferItems([...transferItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: string | number) => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de créer le transfert',
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

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouse-transfers', store?.id] });
    toast({
      title: 'Actualisé',
      description: 'Les transferts ont été actualisés',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Transferts entre Entrepôts</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez les transferts de stock entre vos entrepôts
          </p>
        </div>
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden sm:inline">Nouveau transfert</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      {/* Stats Cards - Responsive */}
      <div 
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          { label: 'Total Transferts', value: stats.total, icon: Truck, color: 'from-purple-600 to-pink-600' },
          { label: 'En attente', value: stats.pending, icon: Clock, color: 'from-yellow-600 to-orange-600' },
          { label: 'En transit', value: stats.inTransit, icon: Package, color: 'from-blue-600 to-cyan-600' },
          { label: 'Terminés', value: stats.completed, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters - Responsive */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                aria-label="Rechercher"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                  onClick={handleClearSearch}
                  aria-label="Effacer"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10 text-xs sm:text-sm">
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

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-9 sm:h-10"
              aria-label="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transfers List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Liste des transferts</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredTransfers.length} transfert{filteredTransfers.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransfers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Truck className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchInput || statusFilter !== 'all' ? 'Aucun transfert trouvé' : 'Aucun transfert enregistré'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {filteredTransfers.map((transfer, index) => {
                  const status = TRANSFER_STATUSES.find(s => s.value === transfer.status);
                  return (
                    <TransferCard
                      key={transfer.id}
                      transfer={transfer}
                      status={status}
                      onStatusUpdate={handleStatusUpdate}
                      animationDelay={index * 50}
                    />
                  );
                })}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Numéro</TableHead>
                      <TableHead className="min-w-[150px]">De</TableHead>
                      <TableHead className="min-w-[150px]">Vers</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
                      <TableHead className="min-w-[130px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Date prévue</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer) => {
                      const status = TRANSFER_STATUSES.find(s => s.value === transfer.status);
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                          <TableCell>
                            <span className="truncate block">
                              {(transfer.from_warehouse as any)?.name || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">
                                {(transfer.to_warehouse as any)?.name || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(transfer.requested_date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={transfer.status}
                              onValueChange={(value) => handleStatusUpdate(transfer.id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-40 h-8 sm:h-9 text-xs sm:text-sm">
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
                              <span className="text-sm truncate block">
                                {format(new Date(transfer.expected_delivery_date), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">Non définie</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog Create Transfer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau transfert entrepôt</DialogTitle>
            <DialogDescription>
              Créez un transfert de stock entre deux entrepôts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                    <div className="col-span-1 sm:col-span-5">
                      <Label>ID Produit *</Label>
                      <Input
                        placeholder="UUID du produit"
                        value={item.product_id}
                        onChange={(e) => handleUpdateItem(index, 'product_id', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <Label>Quantité *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-4">
                      <Label>ID Variante (optionnel)</Label>
                      <Input
                        placeholder="UUID variante"
                        value={item.variant_id || ''}
                        onChange={(e) => handleUpdateItem(index, 'variant_id', e.target.value || undefined)}
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1">
                      {transferItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-10 w-full"
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

// Transfer Card Component for Mobile View
interface TransferCardProps {
  transfer: WarehouseTransfer & {
    from_warehouse?: { id: string; name: string; code: string } | null;
    to_warehouse?: { id: string; name: string; code: string } | null;
  };
  status: { value: TransferStatus; label: string; color: string } | undefined;
  onStatusUpdate: (transferId: string, newStatus: string) => void;
  animationDelay?: number;
}

function TransferCard({ transfer, status, onStatusUpdate, animationDelay = 0 }: TransferCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {transfer.transfer_number}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {format(new Date(transfer.requested_date), 'dd MMM yyyy', { locale: fr })}
              </CardDescription>
            </div>
          </div>
          {status && (
            <Badge 
              variant="outline" 
              className="flex-shrink-0"
              style={{ borderColor: status.color }}
            >
              {status.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-[60px]">De:</span>
            <span className="truncate">{(transfer.from_warehouse as any)?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground min-w-[60px]">Vers:</span>
            <span className="truncate">{(transfer.to_warehouse as any)?.name || 'N/A'}</span>
          </div>
          {transfer.expected_delivery_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Prévu: {format(new Date(transfer.expected_delivery_date), 'dd MMM yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Select
            value={transfer.status}
            onValueChange={(value) => onStatusUpdate(transfer.id, value)}
          >
            <SelectTrigger className="flex-1 h-9 text-xs sm:text-sm">
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
          <Button variant="outline" size="sm" className="h-9">
            Voir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
