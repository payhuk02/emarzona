/**
 * Warehouse Inventory Component
 * Date: 27 Janvier 2025
 * 
 * Gestion de l'inventaire par entrepôt
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWarehouses, useWarehouseInventory } from '@/hooks/physical/useWarehouses';
import { useStore } from '@/hooks/useStore';
import { Package, Search, AlertTriangle, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function WarehouseInventory() {
  const { store } = useStore();
  const { data: warehouses } = useWarehouses(store?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: inventory, isLoading } = useWarehouseInventory(selectedWarehouse);

  const filteredInventory = inventory?.filter(item => {
    const productName = (item.product as any)?.name || '';
    const variantInfo = item.variant_id ? (item.variant as any)?.option1_value || '' : '';
    return (
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      variantInfo.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
          <h2 className="text-2xl font-bold tracking-tight">Inventaire Entrepôts</h2>
          <p className="text-muted-foreground">
            Consultez et gérez l'inventaire par entrepôt
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-64">
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
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Sélectionnez un entrepôt pour voir son inventaire
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventaire</CardTitle>
                <CardDescription>
                  {filteredInventory.length} produit{filteredInventory.length > 1 ? 's' : ''} en stock
                </CardDescription>
              </div>
              <Input
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead>Réservé</TableHead>
                    <TableHead>Alloué</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Seuil</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        Aucun produit en stock
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => {
                      const isLowStock = item.quantity_available <= item.reorder_point;
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">
                                  {(item.product as any)?.name || 'N/A'}
                                </div>
                                {item.variant_id && (
                                  <div className="text-sm text-muted-foreground">
                                    {(item.variant as any)?.option1_value || 'Variante'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(item.location as any)?.location_code ? (
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {(item.location as any)?.location_code}
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
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF',
                            }).format(item.total_value)}
                          </TableCell>
                          <TableCell>
                            {isLowStock && (
                              <div className="flex items-center gap-1 text-destructive">
                                <AlertTriangle className="h-3 w-3" />
                                <span className="text-xs">{item.reorder_point}</span>
                              </div>
                            )}
                            {!isLowStock && (
                              <span className="text-muted-foreground text-xs">{item.reorder_point}</span>
                            )}
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
      )}
    </div>
  );
}

