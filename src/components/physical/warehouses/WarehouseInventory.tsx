/**
 * Warehouse Inventory Component
 * Date: 27 Janvier 2025
 * 
 * Gestion de l'inventaire par entrepôt
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouses, useWarehouseInventory, WarehouseInventory as WarehouseInventoryType } from '@/hooks/physical/useWarehouses';
import { useStore } from '@/hooks/useStore';
import { Package, Search, AlertTriangle, MapPin, X, RefreshCw, Warehouse as WarehouseIcon, DollarSign, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export default function WarehouseInventory() {
  const { store } = useStore();
  const { data: warehouses } = useWarehouses(store?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const { data: inventory, isLoading } = useWarehouseInventory(selectedWarehouse);

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const inventoryRef = useScrollAnimation<HTMLDivElement>();

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter(item => {
      const searchLower = debouncedSearch.toLowerCase();
      const productName = (item.product as any)?.name || '';
      const variantInfo = item.variant_id ? (item.variant as any)?.option1_value || '' : '';
      return (
        productName.toLowerCase().includes(searchLower) ||
        variantInfo.toLowerCase().includes(searchLower)
      );
    });
  }, [inventory, debouncedSearch]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!filteredInventory.length) return { total: 0, available: 0, reserved: 0, totalValue: 0 };
    const total = filteredInventory.length;
    const available = filteredInventory.reduce((sum, item) => sum + item.quantity_available, 0);
    const reserved = filteredInventory.reduce((sum, item) => sum + item.quantity_reserved, 0);
    const totalValue = filteredInventory.reduce((sum, item) => sum + item.total_value, 0);
    return { total, available, reserved, totalValue };
  }, [filteredInventory]);

  const handleClearSearch = () => {
    setSearchInput('');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['warehouse-inventory', selectedWarehouse] });
    toast({
      title: 'Actualisé',
      description: 'L\'inventaire a été actualisé',
    });
  };

  const selectedWarehouseData = warehouses?.find(w => w.id === selectedWarehouse);

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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Inventaire Entrepôts</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Consultez et gérez l'inventaire par entrepôt
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-full sm:w-64 h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Sélectionner un entrepôt" />
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
      </div>

      {!selectedWarehouse ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <CardContent className="py-8 sm:py-12 text-center">
            <WarehouseIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Sélectionnez un entrepôt pour voir son inventaire
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards - Responsive */}
          <div 
            ref={statsRef}
            className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {[
              { label: 'Total Produits', value: stats.total, icon: Package, color: 'from-purple-600 to-pink-600' },
              { label: 'Disponible', value: stats.available, icon: TrendingUp, color: 'from-green-600 to-emerald-600' },
              { label: 'Réservé', value: stats.reserved, icon: AlertTriangle, color: 'from-yellow-600 to-orange-600' },
              { label: 'Valeur Totale', value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalValue), icon: DollarSign, color: 'from-blue-600 to-cyan-600', isCurrency: true },
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
                    {stat.isCurrency ? (
                      <div className={`text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    ) : (
                      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search & Actions - Responsive */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
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

          {/* Inventory List */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Inventaire</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {selectedWarehouseData?.name} • {filteredInventory.length} produit{filteredInventory.length > 1 ? 's' : ''} en stock
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {searchInput ? 'Aucun produit trouvé' : 'Aucun produit en stock dans cet entrepôt'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="block md:hidden space-y-3 sm:space-y-4">
                    {filteredInventory.map((item, index) => {
                      const isLowStock = item.quantity_available <= item.reorder_point;
                      return (
                        <InventoryCard
                          key={item.id}
                          item={item}
                          isLowStock={isLowStock}
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
                          <TableHead className="min-w-[200px]">Produit</TableHead>
                          <TableHead className="min-w-[120px]">Localisation</TableHead>
                          <TableHead className="min-w-[100px]">Disponible</TableHead>
                          <TableHead className="min-w-[100px]">Réservé</TableHead>
                          <TableHead className="min-w-[100px]">Alloué</TableHead>
                          <TableHead className="min-w-[100px]">Total</TableHead>
                          <TableHead className="min-w-[120px]">Valeur</TableHead>
                          <TableHead className="min-w-[100px]">Seuil</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInventory.map((item) => {
                          const isLowStock = item.quantity_available <= item.reorder_point;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <div className="min-w-0">
                                    <div className="font-medium truncate">
                                      {(item.product as any)?.name || 'N/A'}
                                    </div>
                                    {item.variant_id && (
                                      <div className="text-sm text-muted-foreground truncate">
                                        {(item.variant as any)?.option1_value || 'Variante'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(item.location as any)?.location_code ? (
                                  <div className="flex items-center gap-1 text-sm">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{(item.location as any)?.location_code}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Non assigné</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={isLowStock ? 'destructive' : 'default'}>
                                  {item.quantity_available}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{item.quantity_reserved}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.quantity_allocated}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">{item.quantity_on_hand}</span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm truncate">
                                  {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'XOF',
                                  }).format(item.total_value)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {isLowStock ? (
                                  <div className="flex items-center gap-1 text-destructive">
                                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                    <span className="text-xs">{item.reorder_point}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">{item.reorder_point}</span>
                                )}
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
        </>
      )}
    </div>
  );
}

// Inventory Card Component for Mobile View
interface InventoryCardProps {
  item: WarehouseInventoryType;
  isLowStock: boolean;
  animationDelay?: number;
}

function InventoryCard({ item, isLowStock, animationDelay = 0 }: InventoryCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation",
        isLowStock && "border-destructive/50"
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold line-clamp-1">
                {(item.product as any)?.name || 'N/A'}
              </CardTitle>
              {item.variant_id && (
                <CardDescription className="text-xs sm:text-sm">
                  {(item.variant as any)?.option1_value || 'Variante'}
                </CardDescription>
              )}
            </div>
          </div>
          {isLowStock && (
            <Badge variant="destructive" className="flex-shrink-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Stock faible
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          {(item.location as any)?.location_code && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{(item.location as any)?.location_code}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={isLowStock ? 'destructive' : 'default'} className="text-xs">
                Disponible: {item.quantity_available}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Réservé: {item.quantity_reserved}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Alloué: {item.quantity_allocated}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs sm:text-sm">
                Total: {item.quantity_on_hand}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                }).format(item.total_value)}
              </span>
            </div>
            {isLowStock && (
              <div className="flex items-center gap-1 text-destructive text-xs">
                <AlertTriangle className="h-3 w-3" />
                <span>Seuil: {item.reorder_point}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}






