/**
 * Gestionnaire de numéros de série
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Hash,
  Plus,
  Edit,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
  X,
  Eye,
  CheckCircle2,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import {
  useProductSerialNumbers,
  useSerialNumberByNumber,
} from '@/hooks/physical/useSerialTracking';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SerialNumberForm } from './SerialNumberForm';
import { SerialTraceabilityView } from './SerialTraceabilityView';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface SerialNumbersManagerProps {
  physicalProductId: string;
  variantId?: string;
}

export function SerialNumbersManager({ physicalProductId, variantId }: SerialNumbersManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSerial, setEditingSerial] = useState<string | null>(null);
  const [viewingTraceability, setViewingTraceability] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: serials, isLoading } = useProductSerialNumbers(physicalProductId, {
    variantId,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  });

  const deleteSerial = useMutation({
    mutationFn: async (serialNumberId: string) => {
      const { error } = await supabase
        .from('serial_numbers')
        .delete()
        .eq('id', serialNumberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serial-numbers', physicalProductId] });
    },
  });

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const serialsRef = useScrollAnimation<HTMLDivElement>();

  const filteredSerials = useMemo(() => {
    if (!serials) return [];
    return serials.filter((serial) => {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        serial.serial_number.toLowerCase().includes(searchLower) ||
        serial.imei?.toLowerCase().includes(searchLower) ||
        serial.mac_address?.toLowerCase().includes(searchLower)
      );
    });
  }, [serials, debouncedSearch]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!serials) return { total: 0, inStock: 0, sold: 0, inRepair: 0 };
    const total = serials.length;
    const inStock = serials.filter(s => s.status === 'in_stock').length;
    const sold = serials.filter(s => s.status === 'sold').length;
    const inRepair = serials.filter(s => s.status === 'warranty_repair').length;
    return { total, inStock, sold, inRepair };
  }, [serials]);

  const getStatusBadge = (status: string) => {
    const  badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      manufactured: { label: 'Fabriqué', variant: 'secondary' },
      in_stock: { label: 'En Stock', variant: 'default', className: 'bg-green-500' },
      reserved: { label: 'Réservé', variant: 'default', className: 'bg-yellow-500' },
      sold: { label: 'Vendu', variant: 'default', className: 'bg-blue-500' },
      shipped: { label: 'Expédié', variant: 'default', className: 'bg-purple-500' },
      delivered: { label: 'Livré', variant: 'default', className: 'bg-indigo-500' },
      returned: { label: 'Retourné', variant: 'secondary' },
      refurbished: { label: 'Reconditionné', variant: 'secondary' },
      warranty_repair: { label: 'Réparation Garantie', variant: 'default', className: 'bg-orange-500' },
      damaged: { label: 'Endommagé', variant: 'destructive' },
      scrapped: { label: 'Mis au Rebut', variant: 'destructive' },
    };

    const badge = badges[status] || { label: status, variant: 'secondary' };
    return (
      <Badge variant={badge.variant} className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  const handleClearSearch = () => {
    setSearchInput('');
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
          <h3 className="text-xl sm:text-2xl font-bold">Gestion des Numéros de Série</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gérez les numéros de série et suivez la traçabilité complète
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Ajouter Numéro de Série</span>
              <span className="sm:hidden">Ajouter</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Ajouter un Numéro de Série</DialogTitle>
            </DialogHeader>
            <SerialNumberForm
              physicalProductId={physicalProductId}
              variantId={variantId}
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards - Responsive */}
      {serials && serials.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total', value: stats.total, icon: Hash, color: 'from-purple-600 to-pink-600' },
            { label: 'En Stock', value: stats.inStock, icon: Package, color: 'from-green-600 to-emerald-600' },
            { label: 'Vendu', value: stats.sold, icon: ShoppingCart, color: 'from-blue-600 to-cyan-600' },
            { label: 'En Réparation', value: stats.inRepair, icon: AlertCircle, color: 'from-orange-600 to-red-600' },
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
      )}

      {/* Search & Filters - Responsive */}
      {serials && serials.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro de série, IMEI, MAC..."
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
                <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="in_stock">En Stock</SelectItem>
                  <SelectItem value="sold">Vendu</SelectItem>
                  <SelectItem value="shipped">Expédié</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                  <SelectItem value="warranty_repair">Réparation Garantie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Serial Numbers List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Numéros de Série</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Liste de tous les numéros de série pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSerials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <Hash className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground">
                {searchInput || statusFilter !== 'all' ? 'Aucun numéro de série trouvé' : 'Aucun numéro de série enregistré'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {filteredSerials.map((serial, index) => (
                  <SerialCard
                    key={serial.id}
                    serial={serial}
                    getStatusBadge={getStatusBadge}
                    onViewTraceability={() => setViewingTraceability(serial.id)}
                    onEdit={() => setEditingSerial(serial.id)}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Numéro de Série</TableHead>
                      <TableHead className="min-w-[150px]">IMEI / MAC</TableHead>
                      <TableHead className="min-w-[120px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Client</TableHead>
                      <TableHead className="min-w-[150px]">Garantie</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSerials.map((serial) => (
                      <TableRow key={serial.id}>
                        <TableCell className="font-medium font-mono">{serial.serial_number}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {serial.imei && <div>IMEI: {serial.imei}</div>}
                            {serial.mac_address && <div>MAC: {serial.mac_address}</div>}
                            {!serial.imei && !serial.mac_address && <span className="text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(serial.status)}</TableCell>
                        <TableCell>
                          {serial.customer_id ? (
                            <span className="text-sm truncate block">Client #{serial.customer_id.slice(0, 8)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {serial.warranty_end_date ? (
                            <div className="text-sm truncate">
                              Jusqu'au {new Date(serial.warranty_end_date).toLocaleDateString('fr-FR')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingTraceability(serial.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSerial(serial.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSerial && (
        <Dialog open={!!editingSerial} onOpenChange={() => setEditingSerial(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le Numéro de Série</DialogTitle>
            </DialogHeader>
            <SerialNumberForm
              serialNumberId={editingSerial}
              physicalProductId={physicalProductId}
              variantId={variantId}
              onSuccess={() => setEditingSerial(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Traceability Dialog */}
      {viewingTraceability && (
        <Dialog open={!!viewingTraceability} onOpenChange={() => setViewingTraceability(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Traçabilité Complète</DialogTitle>
            </DialogHeader>
            <SerialTraceabilityView serialNumberId={viewingTraceability} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Serial Card Component for Mobile View
interface SerialCardProps {
  serial: SerialNumber;
  getStatusBadge: (status: string) => JSX.Element;
  onViewTraceability: () => void;
  onEdit: () => void;
  animationDelay?: number;
}

function SerialCard({ serial, getStatusBadge, onViewTraceability, onEdit, animationDelay = 0 }: SerialCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1 font-mono">
                {serial.serial_number}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {serial.imei && `IMEI: ${serial.imei}`}
                {serial.mac_address && `MAC: ${serial.mac_address}`}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(serial.status)}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          {serial.customer_id && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Client: #{serial.customer_id.slice(0, 8)}</span>
            </div>
          )}
          {serial.warranty_end_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Garantie jusqu'au: {new Date(serial.warranty_end_date).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            onClick={onViewTraceability}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Traçabilité</span>
          </Button>
          <Button
            onClick={onEdit}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Modifier</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Delete mutation hook
function useDeleteSerialNumber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumberId: string) => {
      const { error } = await supabase
        .from('serial_numbers')
        .delete()
        .eq('id', serialNumberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serial-numbers'] });
    },
  });
}






