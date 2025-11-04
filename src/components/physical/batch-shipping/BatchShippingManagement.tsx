/**
 * Batch Shipping Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion complète des expéditions par lots
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBatchShipments, useCreateBatchShipment, useProcessBatchShipment, useUpdateBatchStatus, BatchShipment } from '@/hooks/physical/useBatchShipping';
import { useStore } from '@/hooks/useStore';
import { Package, Plus, RefreshCw, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import BatchShipmentDetails from './BatchShipmentDetails';

const BATCH_STATUSES: { value: BatchShipment['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'En attente', color: 'bg-yellow-500' },
  { value: 'processing', label: 'En traitement', color: 'bg-blue-500' },
  { value: 'label_generated', label: 'Étiquettes générées', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Expédié', color: 'bg-green-500' },
  { value: 'completed', label: 'Complété', color: 'bg-green-600' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' },
];

export default function BatchShippingManagement() {
  const { store } = useStore();
  const { data: batches, isLoading } = useBatchShipments(store?.id);
  const createBatch = useCreateBatchShipment();
  const processBatch = useProcessBatchShipment();
  const updateStatus = useUpdateBatchStatus();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchShipment | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [batchName, setBatchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Récupérer les commandes prêtes à expédier
  const fetchReadyOrders = async () => {
    if (!store?.id) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, status')
      .eq('store_id', store.id)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Error fetching ready orders', { error });
      return [];
    }

    return data || [];
  };

  const handleCreateBatch = async () => {
    if (!store?.id || selectedOrderIds.length === 0) return;

    try {
      await createBatch.mutateAsync({
        storeId: store.id,
        orderIds: selectedOrderIds,
        batchName: batchName || undefined,
      });
      setIsCreateDialogOpen(false);
      setSelectedOrderIds([]);
      setBatchName('');
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleProcessBatch = async (batchId: string) => {
    try {
      await processBatch.mutateAsync({
        batchId,
      });
    } catch (error: any) {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de traiter le lot',
        variant: 'destructive',
      });
    }
  };

  const filteredBatches = batches?.filter(batch =>
    statusFilter === 'all' || batch.status === statusFilter
  ) || [];

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
          <h2 className="text-2xl font-bold tracking-tight">Gestion des Expéditions Batch</h2>
          <p className="text-muted-foreground">
            Traitez plusieurs commandes simultanément et générez des étiquettes en masse
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un lot
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lots totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En traitement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {batches?.filter(b => b.status === 'processing').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Étiquettes générées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {batches?.filter(b => b.status === 'label_generated').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Complétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {batches?.filter(b => b.status === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="batches">Lots d'expédition</TabsTrigger>
          {selectedBatch && (
            <TabsTrigger value="details">Détails du lot</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="batches" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lots d'expédition</CardTitle>
                  <CardDescription>
                    {filteredBatches.length} lot{filteredBatches.length > 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {BATCH_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro de lot</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Commandes</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Transporteur</TableHead>
                      <TableHead>Date création</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Aucun lot trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBatches.map((batch) => {
                        const status = BATCH_STATUSES.find(s => s.value === batch.status);
                        return (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">{batch.batch_number}</TableCell>
                            <TableCell>{batch.batch_name || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>{batch.processed_orders}/{batch.total_orders}</span>
                                {batch.failed_orders > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {batch.failed_orders} erreur{batch.failed_orders > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                batch.status === 'completed' ? 'default' :
                                batch.status === 'shipped' ? 'default' :
                                batch.status === 'label_generated' ? 'secondary' :
                                batch.status === 'processing' ? 'secondary' :
                                'outline'
                              }>
                                {status?.label || batch.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {batch.carrier_name || '-'}
                            </TableCell>
                            <TableCell>
                              {format(new Date(batch.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {batch.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleProcessBatch(batch.id)}
                                    disabled={processBatch.isPending}
                                  >
                                    <RefreshCw className={`h-4 w-4 mr-1 ${processBatch.isPending ? 'animate-spin' : ''}`} />
                                    Traiter
                                  </Button>
                                )}
                                {batch.status === 'label_generated' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Télécharger
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedBatch(batch)}
                                >
                                  Voir détails
                                </Button>
                              </div>
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
        </TabsContent>

        {selectedBatch && (
          <TabsContent value="details">
            <BatchShipmentDetails batchId={selectedBatch.id} />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Create Batch */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau lot</DialogTitle>
            <DialogDescription>
              Sélectionnez les commandes à inclure dans ce lot d'expédition
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch_name">Nom du lot (optionnel)</Label>
              <Input
                id="batch_name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Ex: Expédition du 27 janvier"
              />
            </div>
            <div className="space-y-2">
              <Label>Commandes sélectionnées: {selectedOrderIds.length}</Label>
              <div className="h-64 border rounded-md p-4 overflow-y-auto">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité de sélection des commandes à implémenter
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateBatch} disabled={selectedOrderIds.length === 0 || createBatch.isPending}>
              {createBatch.isPending ? 'Création...' : 'Créer le lot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

