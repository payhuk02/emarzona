/**
 * Batch Shipping Management Component
 * Date: 27 Janvier 2025
 * 
 * Gestion complète des expéditions par lots
 * Design responsive avec cards sur mobile et table sur desktop
 */

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBatchShipments, useCreateBatchShipment, useProcessBatchShipment, BatchShipment } from '@/hooks/physical/useBatchShipping';
import { useStore } from '@/hooks/useStore';
import { Package, Plus, RefreshCw, Download, Search, X } from '@/components/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
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
  const { data: batches = [], isLoading } = useBatchShipments(store?.id);
  const createBatch = useCreateBatchShipment();
  const processBatch = useProcessBatchShipment();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchShipment | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [batchName, setBatchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

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

  // Filtrer les batches par statut et recherche
  const filteredBatches = useMemo(() => {
    return batches.filter((batch) => {
      const matchesStatus = statusFilter === 'all' || batch.status === statusFilter;
      const matchesSearch = !debouncedSearch || 
        batch.batch_number?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        batch.batch_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        batch.carrier_name?.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [batches, statusFilter, debouncedSearch]);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search Bar and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Rechercher par numéro, nom ou transporteur..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9 min-h-[44px] h-11 sm:h-12 text-sm"
            aria-label="Rechercher par numéro, nom ou transporteur"
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px] h-11 w-11 p-0"
              onClick={() => setSearchInput('')}
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center gap-1.5 pointer-events-none">
            <Badge variant="outline" className="text-xs font-mono">
              ⌘K
            </Badge>
          </div>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="min-h-[44px] h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          aria-label="Créer un nouveau lot d'expédition"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Créer un lot</span>
          <span className="sm:hidden">Créer</span>
        </Button>
      </div>

      {/* Status Filters as Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-3 sm:flex overflow-x-auto">
          <TabsTrigger
            value="all"
            className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            Tous
          </TabsTrigger>
          <TabsTrigger
            value="processing"
            className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            En traitement
          </TabsTrigger>
          <TabsTrigger
            value="label_generated"
            className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            Étiquettes
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
          >
            Complétés
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Batches List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Lots d'expédition</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredBatches.length} lot{filteredBatches.length > 1 ? 's' : ''}
            {debouncedSearch && ` trouvé${filteredBatches.length > 1 ? 's' : ''} pour "${debouncedSearch}"`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {filteredBatches.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground mb-2">
                {debouncedSearch ? 'Aucun lot trouvé' : 'Aucun lot trouvé'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {debouncedSearch
                  ? `Aucun résultat pour "${debouncedSearch}". Essayez un autre terme de recherche.`
                  : 'Créez votre premier lot d\'expédition pour commencer'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                    {filteredBatches.map((batch) => {
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
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredBatches.map((batch) => {
                  const status = BATCH_STATUSES.find(s => s.value === batch.status);
                  return (
                    <Card
                      key={batch.id}
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm sm:text-base truncate">
                                {batch.batch_number}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {batch.batch_name || 'Sans nom'}
                              </p>
                            </div>
                            <Badge variant={
                              batch.status === 'completed' ? 'default' :
                              batch.status === 'shipped' ? 'default' :
                              batch.status === 'label_generated' ? 'secondary' :
                              batch.status === 'processing' ? 'secondary' :
                              'outline'
                            } className="text-xs">
                              {status?.label || batch.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {batch.processed_orders}/{batch.total_orders} commandes
                            </span>
                            {batch.failed_orders > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {batch.failed_orders} erreur{batch.failed_orders > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          {batch.carrier_name && (
                            <div className="text-xs text-muted-foreground">
                              Transporteur: {batch.carrier_name}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {format(new Date(batch.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                            {batch.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessBatch(batch.id)}
                                disabled={processBatch.isPending}
                                className="text-xs min-h-[44px] h-11"
                              >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${processBatch.isPending ? 'animate-spin' : ''}`} />
                                Traiter
                              </Button>
                            )}
                            {batch.status === 'label_generated' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs min-h-[44px] h-11"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Télécharger
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBatch(batch)}
                              className="text-xs min-h-[44px] h-11 ml-auto"
                            >
                              Voir détails
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Tab */}
      {selectedBatch && (
        <Tabs defaultValue="batches" className="w-full">
          <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto">
            <TabsTrigger
              value="batches"
              onClick={() => setSelectedBatch(null)}
              className="gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              Lots d'expédition
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              Détails du lot
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4 sm:mt-6">
            <BatchShipmentDetails batchId={selectedBatch.id} />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog Create Batch */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Créer un nouveau lot</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Sélectionnez les commandes à inclure dans ce lot d'expédition
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch_name" className="text-xs sm:text-sm">Nom du lot (optionnel)</Label>
              <Input
                id="batch_name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Ex: Expédition du 27 janvier"
                className="text-sm min-h-[44px] h-11 sm:h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Commandes sélectionnées: {selectedOrderIds.length}</Label>
              <div className="h-48 sm:h-64 border rounded-md p-3 sm:p-4 overflow-y-auto">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Fonctionnalité de sélection des commandes à implémenter
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              className="w-full sm:w-auto min-h-[44px] h-11 sm:h-12 text-sm"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCreateBatch} 
              disabled={selectedOrderIds.length === 0 || createBatch.isPending}
              className="w-full sm:w-auto min-h-[44px] h-11 sm:h-12 text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {createBatch.isPending ? 'Création...' : 'Créer le lot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

