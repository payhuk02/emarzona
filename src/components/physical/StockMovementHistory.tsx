import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  FileEdit,
  Package,
  TrendingDown,
  TrendingUp,
  Calendar,
  User,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type MovementType =
  | 'purchase' // Achat/Approvisionnement
  | 'sale' // Vente
  | 'return' // Retour client
  | 'adjustment' // Ajustement manuel
  | 'transfer' // Transfert entre entrepôts
  | 'damage' // Produit endommagé
  | 'theft'; // Vol/Perte

export type MovementDirection = 'in' | 'out';

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  type: MovementType;
  direction: MovementDirection;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason?: string;
  reference_id?: string; // Order ID, Purchase ID, etc.
  reference_type?: string; // 'order', 'purchase', 'manual', etc.
  user_id?: string;
  user_name?: string;
  location_from?: string;
  location_to?: string;
  created_at: string;
}

export interface StockMovementHistoryProps {
  productId?: string; // Optional: filter by product
  variantId?: string; // Optional: filter by variant
  storeId: string;
  maxHeight?: string;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const MOVEMENT_CONFIG: Record<
  MovementType,
  {
    label: string;
    icon: typeof ArrowUpCircle;
    color: string;
    description: string;
  }
> = {
  purchase: {
    label: 'Achat',
    icon: ArrowDownCircle,
    color: 'text-blue-600',
    description: 'Approvisionnement fournisseur',
  },
  sale: {
    label: 'Vente',
    icon: ArrowUpCircle,
    color: 'text-green-600',
    description: 'Vente client',
  },
  return: {
    label: 'Retour',
    icon: ArrowDownCircle,
    color: 'text-purple-600',
    description: 'Retour client',
  },
  adjustment: {
    label: 'Ajustement',
    icon: FileEdit,
    color: 'text-orange-600',
    description: 'Correction manuelle',
  },
  transfer: {
    label: 'Transfert',
    icon: Package,
    color: 'text-indigo-600',
    description: 'Transfert entre entrepôts',
  },
  damage: {
    label: 'Dommage',
    icon: TrendingDown,
    color: 'text-red-600',
    description: 'Produit endommagé',
  },
  theft: {
    label: 'Perte',
    icon: TrendingDown,
    color: 'text-destructive',
    description: 'Vol ou perte',
  },
};

// ============================================================================
// MOCK DATA (Replace with actual hook/API call)
// ============================================================================

const MOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov_1',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Rouge / M',
    sku: 'TSH-RED-M',
    type: 'sale',
    direction: 'out',
    quantity: 3,
    quantity_before: 50,
    quantity_after: 47,
    reason: 'Vente commande #12345',
    reference_id: 'order_12345',
    reference_type: 'order',
    user_name: 'Client: Marie Diallo',
    created_at: new Date('2025-10-29T10:30:00').toISOString(),
  },
  {
    id: 'mov_2',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Bleu / L',
    sku: 'TSH-BLU-L',
    type: 'purchase',
    direction: 'in',
    quantity: 100,
    quantity_before: 5,
    quantity_after: 105,
    reason: 'Réapprovisionnement fournisseur XYZ',
    reference_id: 'purchase_456',
    reference_type: 'purchase',
    user_name: 'Admin: Jean Kouadio',
    location_to: 'Entrepôt Abidjan',
    created_at: new Date('2025-10-28T14:15:00').toISOString(),
  },
  {
    id: 'mov_3',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Vert / S',
    sku: 'TSH-GRN-S',
    type: 'adjustment',
    direction: 'out',
    quantity: 2,
    quantity_before: 30,
    quantity_after: 28,
    reason: 'Inventaire physique - correction',
    reference_type: 'manual',
    user_name: 'Admin: Jean Kouadio',
    created_at: new Date('2025-10-27T16:45:00').toISOString(),
  },
  {
    id: 'mov_4',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Rouge / M',
    sku: 'TSH-RED-M',
    type: 'return',
    direction: 'in',
    quantity: 1,
    quantity_before: 47,
    quantity_after: 48,
    reason: 'Retour client - taille incorrecte',
    reference_id: 'order_12340',
    reference_type: 'return',
    user_name: 'Client: Amadou Traoré',
    created_at: new Date('2025-10-26T11:20:00').toISOString(),
  },
  {
    id: 'mov_5',
    product_id: 'prod_1',
    product_name: 'T-Shirt Premium',
    variant_label: 'Noir / XL',
    sku: 'TSH-BLK-XL',
    type: 'damage',
    direction: 'out',
    quantity: 5,
    quantity_before: 80,
    quantity_after: 75,
    reason: 'Produits endommagés lors du transport',
    reference_type: 'manual',
    user_name: 'Admin: Fatou Sow',
    created_at: new Date('2025-10-25T09:00:00').toISOString(),
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StockMovementHistory({
  productId,
  variantId,
  storeId,
  maxHeight = '600px',
  className,
}: StockMovementHistoryProps) {
  const [movements] = useState<StockMovement[]>(MOCK_MOVEMENTS);
  const [filterType, setFilterType] = useState<MovementType | 'all'>('all');
  const [filterDirection, setFilterDirection] = useState<MovementDirection | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  // Filter movements
  const filteredMovements = React.useMemo(() => {
    let filtered = [...movements];

    // Product/Variant filter
    if (productId) {
      filtered = filtered.filter((m) => m.product_id === productId);
    }
    if (variantId) {
      filtered = filtered.filter((m) => m.variant_id === variantId);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((m) => m.type === filterType);
    }

    // Direction filter
    if (filterDirection !== 'all') {
      filtered = filtered.filter((m) => m.direction === filterDirection);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.product_name.toLowerCase().includes(query) ||
          m.variant_label?.toLowerCase().includes(query) ||
          m.sku?.toLowerCase().includes(query) ||
          m.reason?.toLowerCase().includes(query) ||
          m.reference_id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [movements, productId, variantId, filterType, filterDirection, searchQuery]);

  // Stats
  const stats = React.useMemo(() => {
    const totalIn = filteredMovements
      .filter((m) => m.direction === 'in')
      .reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = filteredMovements
      .filter((m) => m.direction === 'out')
      .reduce((sum, m) => sum + m.quantity, 0);

    return {
      totalMovements: filteredMovements.length,
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
    };
  }, [filteredMovements]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mouvements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMovements}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{stats.totalIn}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{stats.totalOut}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variation Nette</CardTitle>
            {stats.netChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {stats.netChange >= 0 ? '+' : ''}
              {stats.netChange}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Mouvements de Stock</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Suivez tous les changements de stock en temps réel
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <Input
              placeholder="Rechercher par produit, SKU, raison..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />

            {/* Type Filter */}
            <Select value={filterType} onValueChange={(value: MovementType | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="purchase">Achats</SelectItem>
                <SelectItem value="sale">Ventes</SelectItem>
                <SelectItem value="return">Retours</SelectItem>
                <SelectItem value="adjustment">Ajustements</SelectItem>
                <SelectItem value="transfer">Transferts</SelectItem>
                <SelectItem value="damage">Dommages</SelectItem>
                <SelectItem value="theft">Pertes</SelectItem>
              </SelectContent>
            </Select>

            {/* Direction Filter */}
            <Select value={filterDirection} onValueChange={(value: MovementDirection | 'all') => setFilterDirection(value)}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="in">Entrées</SelectItem>
                <SelectItem value="out">Sorties</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>

          {/* Table */}
          <ScrollArea style={{ maxHeight }}>
            {filteredMovements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucun mouvement trouvé</p>
                <p className="text-sm">
                  {searchQuery || filterType !== 'all' || filterDirection !== 'all'
                    ? 'Essayez de modifier vos filtres'
                    : 'Aucune activité de stock pour le moment'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => {
                      const config = MOVEMENT_CONFIG[movement.type];
                      const Icon = config.icon;

                      return (
                        <TableRow key={movement.id}>
                          {/* Date */}
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  {format(new Date(movement.created_at), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(movement.created_at), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Product */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {movement.product_image_url ? (
                                <img
                                  src={movement.product_image_url}
                                  alt={movement.product_name}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{movement.product_name}</p>
                                {movement.variant_label && (
                                  <p className="text-xs text-muted-foreground">
                                    {movement.variant_label}
                                  </p>
                                )}
                                {movement.sku && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {movement.sku}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <Badge variant="outline" className="gap-2">
                              <Icon className={cn('h-3 w-3', config.color)} />
                              {config.label}
                            </Badge>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell>
                            <div
                              className={cn(
                                'font-bold',
                                movement.direction === 'in'
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              )}
                            >
                              {movement.direction === 'in' ? '+' : '-'}
                              {movement.quantity}
                            </div>
                          </TableCell>

                          {/* Stock */}
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                {movement.quantity_before} →{' '}
                                <span className="font-medium text-foreground">
                                  {movement.quantity_after}
                                </span>
                              </p>
                            </div>
                          </TableCell>

                          {/* Reason */}
                          <TableCell>
                            <p className="text-sm max-w-[200px] truncate">
                              {movement.reason || '-'}
                            </p>
                          </TableCell>

                          {/* User */}
                          <TableCell>
                            {movement.user_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">
                                  {movement.user_name}
                                </span>
                              </div>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedMovement(movement)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Movement Details Dialog */}
      {selectedMovement && (
        <Dialog open={!!selectedMovement} onOpenChange={() => setSelectedMovement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => {
                  const config = MOVEMENT_CONFIG[selectedMovement.type];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={cn('h-5 w-5', config.color)} />
                      Détails du Mouvement
                    </>
                  );
                })()}
              </DialogTitle>
              <DialogDescription>
                {format(new Date(selectedMovement.created_at), "dd MMMM yyyy 'à' HH:mm", {
                  locale: fr,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Produit</Label>
                  <p className="text-sm text-muted-foreground">{selectedMovement.product_name}</p>
                </div>
                {selectedMovement.variant_label && (
                  <div>
                    <Label className="text-sm font-medium">Variante</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedMovement.variant_label}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type de mouvement</Label>
                  <p className="text-sm text-muted-foreground">
                    {MOVEMENT_CONFIG[selectedMovement.type].label} -{' '}
                    {MOVEMENT_CONFIG[selectedMovement.type].description}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Quantité</Label>
                  <p
                    className={cn(
                      'text-2xl font-bold',
                      selectedMovement.direction === 'in' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {selectedMovement.direction === 'in' ? '+' : '-'}
                    {selectedMovement.quantity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Stock avant</Label>
                  <p className="text-xl font-medium">{selectedMovement.quantity_before}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stock après</Label>
                  <p className="text-xl font-medium text-primary">
                    {selectedMovement.quantity_after}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Variation</Label>
                  <p
                    className={cn(
                      'text-xl font-bold',
                      selectedMovement.direction === 'in' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {selectedMovement.direction === 'in' ? '+' : '-'}
                    {selectedMovement.quantity}
                  </p>
                </div>
              </div>

              {selectedMovement.reason && (
                <div>
                  <Label className="text-sm font-medium">Raison</Label>
                  <p className="text-sm text-muted-foreground">{selectedMovement.reason}</p>
                </div>
              )}

              {selectedMovement.user_name && (
                <div>
                  <Label className="text-sm font-medium">Utilisateur</Label>
                  <p className="text-sm text-muted-foreground">{selectedMovement.user_name}</p>
                </div>
              )}

              {(selectedMovement.location_from || selectedMovement.location_to) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedMovement.location_from && (
                    <div>
                      <Label className="text-sm font-medium">Depuis</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedMovement.location_from}
                      </p>
                    </div>
                  )}
                  {selectedMovement.location_to && (
                    <div>
                      <Label className="text-sm font-medium">Vers</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedMovement.location_to}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedMovement.reference_id && (
                <div>
                  <Label className="text-sm font-medium">Référence</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedMovement.reference_id} ({selectedMovement.reference_type})
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Missing Label component
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('text-sm font-medium', className)}>{children}</div>;
}

