import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type BackorderStatus =
  | 'pending' // En attente de réapprovisionnement
  | 'ordered' // Commande passée au fournisseur
  | 'in_transit' // En cours de livraison
  | 'partially_received' // Partiellement reçu
  | 'received' // Reçu complet
  | 'fulfilled'; // Toutes les commandes clients honorées

export type BackorderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Backorder {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  status: BackorderStatus;
  priority: BackorderPriority;
  is_enabled: boolean;
  
  // Quantities
  customer_demand: number; // Demande totale clients
  ordered_quantity: number; // Quantité commandée au fournisseur
  received_quantity: number; // Quantité reçue
  pending_quantity: number; // Quantité en attente
  
  // Dates
  first_request_date: string;
  expected_restock_date?: string;
  supplier_order_date?: string;
  last_received_date?: string;
  
  // Supplier info
  supplier_id?: string;
  supplier_name?: string;
  purchase_order_id?: string;
  
  // Customer management
  total_customers: number;
  notified_customers: number;
  auto_fulfill_on_arrival: boolean;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BackorderCustomer {
  id: string;
  backorder_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  order_number: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  is_notified: boolean;
  is_fulfilled: boolean;
  requested_at: string;
  fulfilled_at?: string;
}

export interface BackorderManagerProps {
  productId?: string;
  storeId: string;
  className?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_BACKORDERS: Backorder[] = [
  {
    id: 'bo_1',
    product_id: 'prod_1',
    product_name: 'Gaming Laptop RTX 4080',
    variant_label: '32GB RAM / 1TB SSD',
    sku: 'GMLP-RTX4080-32-1TB',
    status: 'ordered',
    priority: 'urgent',
    is_enabled: true,
    customer_demand: 15,
    ordered_quantity: 20,
    received_quantity: 0,
    pending_quantity: 15,
    first_request_date: new Date('2025-10-20').toISOString(),
    expected_restock_date: new Date('2025-11-10').toISOString(),
    supplier_order_date: new Date('2025-10-25').toISOString(),
    supplier_name: 'Tech Wholesale Inc.',
    purchase_order_id: 'PO-2025-001',
    total_customers: 8,
    notified_customers: 8,
    auto_fulfill_on_arrival: true,
    notes: 'Forte demande - Priorité haute',
    created_at: new Date('2025-10-20').toISOString(),
    updated_at: new Date('2025-10-29').toISOString(),
  },
  {
    id: 'bo_2',
    product_id: 'prod_2',
    product_name: 'Wireless Mouse Pro',
    sku: 'MSE-PRO-BLK',
    status: 'in_transit',
    priority: 'medium',
    is_enabled: true,
    customer_demand: 50,
    ordered_quantity: 100,
    received_quantity: 0,
    pending_quantity: 50,
    first_request_date: new Date('2025-10-15').toISOString(),
    expected_restock_date: new Date('2025-11-05').toISOString(),
    supplier_order_date: new Date('2025-10-18').toISOString(),
    supplier_name: 'Peripheral Distributor Ltd',
    purchase_order_id: 'PO-2025-002',
    total_customers: 22,
    notified_customers: 22,
    auto_fulfill_on_arrival: false,
    created_at: new Date('2025-10-15').toISOString(),
    updated_at: new Date('2025-10-28').toISOString(),
  },
  {
    id: 'bo_3',
    product_id: 'prod_3',
    product_name: 'Mechanical Keyboard RGB',
    variant_label: 'Cherry MX Red / FR Layout',
    sku: 'KBD-RGB-RED-FR',
    status: 'partially_received',
    priority: 'high',
    is_enabled: true,
    customer_demand: 30,
    ordered_quantity: 50,
    received_quantity: 25,
    pending_quantity: 5,
    first_request_date: new Date('2025-10-10').toISOString(),
    expected_restock_date: new Date('2025-11-01').toISOString(),
    supplier_order_date: new Date('2025-10-12').toISOString(),
    last_received_date: new Date('2025-10-27').toISOString(),
    supplier_name: 'KeyTech Supplies',
    purchase_order_id: 'PO-2025-003',
    total_customers: 18,
    notified_customers: 13,
    auto_fulfill_on_arrival: true,
    notes: '25 unités reçues, 5 clients honorés',
    created_at: new Date('2025-10-10').toISOString(),
    updated_at: new Date('2025-10-29').toISOString(),
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function BackorderStatusBadge({ status }: { status: BackorderStatus }) {
  const config: Record<
    BackorderStatus,
    { label: string; icon: typeof Clock; className: string }
  > = {
    pending: { label: 'En attente', icon: Clock, className: 'bg-orange-600' },
    ordered: { label: 'Commandé', icon: ShoppingCart, className: 'bg-blue-600' },
    in_transit: { label: 'En transit', icon: Package, className: 'bg-indigo-600' },
    partially_received: { label: 'Partiel', icon: AlertCircle, className: 'bg-yellow-600' },
    received: { label: 'Reçu', icon: CheckCircle2, className: 'bg-green-600' },
    fulfilled: { label: 'Complété', icon: CheckCircle2, className: 'bg-gray-600' },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: BackorderPriority }) {
  const config: Record<BackorderPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    low: { label: 'Basse', variant: 'secondary' },
    medium: { label: 'Moyenne', variant: 'default' },
    high: { label: 'Haute', variant: 'default' },
    urgent: { label: 'Urgente', variant: 'destructive' },
  };

  const { label, variant } = config[priority];

  return <Badge variant={variant}>{label}</Badge>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BackorderManager({ productId, storeId, className }: BackorderManagerProps) {
  const [backorders, setBackorders] = useState<Backorder[]>(
    productId ? MOCK_BACKORDERS.filter((bo) => bo.product_id === productId) : MOCK_BACKORDERS
  );
  const [selectedBackorder, setSelectedBackorder] = useState<Backorder | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);

  // Stats
  const stats = {
    total: backorders.length,
    active: backorders.filter((bo) => bo.status !== 'fulfilled').length,
    urgent: backorders.filter((bo) => bo.priority === 'urgent' && bo.status !== 'fulfilled').length,
    total_customers: backorders.reduce((sum, bo) => sum + bo.total_customers, 0),
    pending_units: backorders.reduce((sum, bo) => sum + bo.pending_quantity, 0),
    in_transit_units: backorders
      .filter((bo) => bo.status === 'in_transit' || bo.status === 'ordered')
      .reduce((sum, bo) => sum + bo.ordered_quantity, 0),
  };

  const handleViewCustomers = (backorder: Backorder) => {
    setSelectedBackorder(backorder);
    setShowCustomers(true);
  };

  const handleReceiveStock = (backorderId: string, quantity: number) => {
    setBackorders((prev) =>
      prev.map((bo) => {
        if (bo.id !== backorderId) return bo;

        const newReceived = bo.received_quantity + quantity;
        const newPending = Math.max(0, bo.customer_demand - newReceived);
        const newStatus: BackorderStatus =
          newPending === 0
            ? 'received'
            : newReceived > 0
            ? 'partially_received'
            : bo.status;

        return {
          ...bo,
          received_quantity: newReceived,
          pending_quantity: newPending,
          status: newStatus,
          last_received_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const getFulfillmentProgress = (backorder: Backorder) => {
    if (backorder.customer_demand === 0) return 100;
    return Math.round((backorder.received_quantity / backorder.customer_demand) * 100);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backorders</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgents</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.urgent}</div>
            <p className="text-xs text-muted-foreground">Priorité haute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_customers}</div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending_units}</div>
            <p className="text-xs text-muted-foreground">Unités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En transit</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.in_transit_units}</div>
            <p className="text-xs text-muted-foreground">Unités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Notif.</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backorders.length > 0
                ? Math.round(
                    (backorders.reduce((sum, bo) => sum + bo.notified_customers, 0) /
                      stats.total_customers) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Clients informés</p>
          </CardContent>
        </Card>
      </div>

      {/* Backorders List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Gestion des Backorders (Ruptures)</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les produits en rupture et le réapprovisionnement
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {backorders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600 opacity-50" />
              <p className="text-lg font-medium">Aucun backorder actif</p>
              <p className="text-sm">Tous vos produits sont disponibles !</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Demande / Commandé</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date attendue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backorders.map((backorder) => {
                    const progress = getFulfillmentProgress(backorder);
                    const daysUntil = backorder.expected_restock_date
                      ? Math.ceil(
                          (new Date(backorder.expected_restock_date).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;

                    return (
                      <TableRow key={backorder.id}>
                        {/* Product */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {backorder.product_image_url ? (
                              <img
                                src={backorder.product_image_url}
                                alt={backorder.product_name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{backorder.product_name}</p>
                              {backorder.variant_label && (
                                <p className="text-xs text-muted-foreground">
                                  {backorder.variant_label}
                                </p>
                              )}
                              {backorder.sku && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {backorder.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <BackorderStatusBadge status={backorder.status} />
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <PriorityBadge priority={backorder.priority} />
                        </TableCell>

                        {/* Quantities */}
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="font-bold text-orange-600">
                                {backorder.customer_demand}
                              </span>
                              <span className="text-muted-foreground"> demandées</span>
                            </div>
                            <div>
                              <span className="font-bold text-blue-600">
                                {backorder.ordered_quantity}
                              </span>
                              <span className="text-muted-foreground"> commandées</span>
                            </div>
                            {backorder.received_quantity > 0 && (
                              <div>
                                <span className="font-bold text-green-600">
                                  {backorder.received_quantity}
                                </span>
                                <span className="text-muted-foreground"> reçues</span>
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Progress */}
                        <TableCell>
                          <div className="space-y-2 min-w-[120px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium">{progress}%</span>
                              <span className="text-muted-foreground">
                                {backorder.received_quantity}/{backorder.customer_demand}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className={cn(
                                  'h-2 rounded-full transition-all',
                                  progress === 100
                                    ? 'bg-green-600'
                                    : progress >= 50
                                    ? 'bg-blue-600'
                                    : 'bg-orange-600'
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Supplier */}
                        <TableCell>
                          {backorder.supplier_name ? (
                            <div className="text-sm">
                              <p className="font-medium">{backorder.supplier_name}</p>
                              {backorder.purchase_order_id && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {backorder.purchase_order_id}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Expected Date */}
                        <TableCell>
                          {backorder.expected_restock_date ? (
                            <div className="text-sm">
                              <p className="font-medium">
                                {format(
                                  new Date(backorder.expected_restock_date),
                                  'dd MMM yyyy',
                                  { locale: fr }
                                )}
                              </p>
                              {daysUntil !== null && (
                                <p
                                  className={cn(
                                    'text-xs',
                                    daysUntil < 0
                                      ? 'text-red-600'
                                      : daysUntil <= 3
                                      ? 'text-orange-600'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {daysUntil < 0
                                    ? `Retard ${Math.abs(daysUntil)}j`
                                    : `Dans ${daysUntil}j`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Non définie</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCustomers(backorder)}
                              className="gap-1"
                            >
                              <Users className="h-3 w-3" />
                              {backorder.total_customers}
                            </Button>
                            {backorder.status !== 'fulfilled' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  const qty = prompt('Quantité reçue:', '0');
                                  if (qty) handleReceiveStock(backorder.id, Number(qty));
                                }}
                                className="gap-1"
                              >
                                <Package className="h-3 w-3" />
                                Recevoir
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customers Dialog */}
      {selectedBackorder && (
        <Dialog open={showCustomers} onOpenChange={setShowCustomers}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Clients en Backorder</DialogTitle>
              <DialogDescription>
                {selectedBackorder.product_name}
                {selectedBackorder.variant_label && ` - ${selectedBackorder.variant_label}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">{selectedBackorder.total_customers}</p>
                    <p className="text-sm text-muted-foreground">Clients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {selectedBackorder.pending_quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedBackorder.received_quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">Reçues</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-2xl font-bold">
                      {getFulfillmentProgress(selectedBackorder)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Complété</p>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Liste détaillée des clients disponible via l'API useBackorderCustomers
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomers(false)}>
                Fermer
              </Button>
              <Button className="gap-2">
                <Bell className="h-4 w-4" />
                Notifier tous les clients
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

