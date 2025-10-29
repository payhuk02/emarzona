import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Calendar,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
  Users,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type PreOrderStatus =
  | 'active' // Pré-commande active
  | 'pending_arrival' // En attente de réception du stock
  | 'arrived' // Stock reçu, prêt à expédier
  | 'fulfilled' // Toutes les pré-commandes expédiées
  | 'cancelled'; // Annulée

export interface PreOrder {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  variant_id?: string;
  variant_label?: string;
  sku?: string;
  status: PreOrderStatus;
  is_enabled: boolean;
  expected_availability_date?: string;
  pre_order_limit?: number; // Max pre-orders allowed
  current_pre_orders: number; // Current number of pre-orders
  reserved_quantity: number; // Total quantity reserved
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_percentage?: number;
  auto_charge_on_arrival: boolean;
  notification_sent: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PreOrderCustomer {
  id: string;
  pre_order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  quantity: number;
  order_id?: string;
  deposit_paid: boolean;
  deposit_amount?: number;
  notified: boolean;
  created_at: string;
}

export interface PreOrderManagerProps {
  productId?: string;
  storeId: string;
  className?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PRE_ORDERS: PreOrder[] = [
  {
    id: 'po_1',
    product_id: 'prod_1',
    product_name: 'iPhone 16 Pro Max',
    variant_label: '256GB / Titane Noir',
    sku: 'IPHONE16-256-TBK',
    status: 'active',
    is_enabled: true,
    expected_availability_date: new Date('2025-11-15').toISOString(),
    pre_order_limit: 100,
    current_pre_orders: 47,
    reserved_quantity: 52,
    deposit_required: true,
    deposit_amount: 200000,
    auto_charge_on_arrival: true,
    notification_sent: false,
    notes: 'Nouvelle génération - Forte demande attendue',
    created_at: new Date('2025-10-20').toISOString(),
    updated_at: new Date('2025-10-29').toISOString(),
  },
  {
    id: 'po_2',
    product_id: 'prod_2',
    product_name: 'PlayStation 5 Pro',
    sku: 'PS5PRO-STD',
    status: 'pending_arrival',
    is_enabled: true,
    expected_availability_date: new Date('2025-11-25').toISOString(),
    pre_order_limit: 50,
    current_pre_orders: 50,
    reserved_quantity: 55,
    deposit_required: true,
    deposit_percentage: 30,
    auto_charge_on_arrival: false,
    notification_sent: true,
    created_at: new Date('2025-10-15').toISOString(),
    updated_at: new Date('2025-10-28').toISOString(),
  },
  {
    id: 'po_3',
    product_id: 'prod_3',
    product_name: 'MacBook Pro M4',
    variant_label: '16" / 1TB / Space Black',
    sku: 'MBP-M4-16-1TB-SB',
    status: 'arrived',
    is_enabled: false,
    expected_availability_date: new Date('2025-10-28').toISOString(),
    pre_order_limit: 30,
    current_pre_orders: 28,
    reserved_quantity: 30,
    deposit_required: false,
    auto_charge_on_arrival: true,
    notification_sent: true,
    notes: 'Stock reçu le 28/10 - En cours de traitement des commandes',
    created_at: new Date('2025-10-01').toISOString(),
    updated_at: new Date('2025-10-29').toISOString(),
  },
];

const MOCK_CUSTOMERS: PreOrderCustomer[] = [
  {
    id: 'poc_1',
    pre_order_id: 'po_1',
    customer_id: 'cust_1',
    customer_name: 'Amadou Traoré',
    customer_email: 'amadou.traore@example.com',
    quantity: 2,
    deposit_paid: true,
    deposit_amount: 400000,
    notified: false,
    created_at: new Date('2025-10-22T10:30:00').toISOString(),
  },
  {
    id: 'poc_2',
    pre_order_id: 'po_1',
    customer_id: 'cust_2',
    customer_name: 'Fatou Sow',
    customer_email: 'fatou.sow@example.com',
    quantity: 1,
    deposit_paid: true,
    deposit_amount: 200000,
    notified: false,
    created_at: new Date('2025-10-23T14:15:00').toISOString(),
  },
  {
    id: 'poc_3',
    pre_order_id: 'po_1',
    customer_id: 'cust_3',
    customer_name: 'Moussa Kone',
    customer_email: 'moussa.kone@example.com',
    quantity: 1,
    deposit_paid: false,
    notified: false,
    created_at: new Date('2025-10-25T09:00:00').toISOString(),
  },
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PreOrderStatusBadge({ status }: { status: PreOrderStatus }) {
  const config: Record<
    PreOrderStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
  > = {
    active: { label: 'Actif', variant: 'default', className: 'bg-blue-600' },
    pending_arrival: { label: 'En attente', variant: 'secondary', className: 'bg-orange-600' },
    arrived: { label: 'Reçu', variant: 'default', className: 'bg-green-600' },
    fulfilled: { label: 'Complété', variant: 'outline', className: '' },
    cancelled: { label: 'Annulé', variant: 'destructive', className: '' },
  };

  const { label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={cn(className)}>
      {label}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PreOrderManager({ productId, storeId, className }: PreOrderManagerProps) {
  const [preOrders, setPreOrders] = useState<PreOrder[]>(
    productId ? MOCK_PRE_ORDERS.filter((po) => po.product_id === productId) : MOCK_PRE_ORDERS
  );
  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPreOrder, setEditingPreOrder] = useState<Partial<PreOrder> | null>(null);

  // Stats
  const stats = {
    total: preOrders.length,
    active: preOrders.filter((po) => po.status === 'active').length,
    total_customers: preOrders.reduce((sum, po) => sum + po.current_pre_orders, 0),
    total_reserved: preOrders.reduce((sum, po) => sum + po.reserved_quantity, 0),
    deposit_collected: preOrders
      .filter((po) => po.deposit_required)
      .reduce((sum, po) => sum + (po.deposit_amount || 0) * po.current_pre_orders, 0),
  };

  const handleCreatePreOrder = () => {
    setEditingPreOrder({
      status: 'active',
      is_enabled: true,
      deposit_required: false,
      auto_charge_on_arrival: true,
      current_pre_orders: 0,
      reserved_quantity: 0,
      notification_sent: false,
    });
    setShowEditDialog(true);
  };

  const handleSavePreOrder = () => {
    // TODO: API call to save
    setShowEditDialog(false);
    setEditingPreOrder(null);
  };

  const handleViewCustomers = (preOrder: PreOrder) => {
    setSelectedPreOrder(preOrder);
    setShowCustomers(true);
  };

  const getCustomersForPreOrder = (preOrderId: string) => {
    return MOCK_CUSTOMERS.filter((c) => c.pre_order_id === preOrderId);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pré-commandes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.active} actives</p>
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
            <CardTitle className="text-sm font-medium">Stock Réservé</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.total_reserved}</div>
            <p className="text-xs text-muted-foreground">Unités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acomptes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.deposit_collected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">XOF collectés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibilité</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {preOrders.filter((po) => po.expected_availability_date).length}
            </div>
            <p className="text-xs text-muted-foreground">Dates planifiées</p>
          </CardContent>
        </Card>
      </div>

      {/* Pre-Orders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestion des Pré-commandes</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gérez les pré-commandes et les clients en attente
            </p>
          </div>
          <Button onClick={handleCreatePreOrder} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Pré-commande
          </Button>
        </CardHeader>
        <CardContent>
          {preOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucune pré-commande</p>
              <p className="text-sm">Créez votre première pré-commande pour commencer</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Disponibilité</TableHead>
                    <TableHead>Limite / Actuel</TableHead>
                    <TableHead>Réservé</TableHead>
                    <TableHead>Acompte</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preOrders.map((preOrder) => {
                    const daysUntil = preOrder.expected_availability_date
                      ? Math.ceil(
                          (new Date(preOrder.expected_availability_date).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;

                    const fillPercentage =
                      preOrder.pre_order_limit && preOrder.pre_order_limit > 0
                        ? (preOrder.current_pre_orders / preOrder.pre_order_limit) * 100
                        : 0;

                    return (
                      <TableRow key={preOrder.id}>
                        {/* Product */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {preOrder.product_image_url ? (
                              <img
                                src={preOrder.product_image_url}
                                alt={preOrder.product_name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{preOrder.product_name}</p>
                              {preOrder.variant_label && (
                                <p className="text-xs text-muted-foreground">
                                  {preOrder.variant_label}
                                </p>
                              )}
                              {preOrder.sku && (
                                <p className="text-xs text-muted-foreground font-mono">
                                  {preOrder.sku}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <div className="space-y-2">
                            <PreOrderStatusBadge status={preOrder.status} />
                            {!preOrder.is_enabled && (
                              <Badge variant="secondary" className="text-xs">
                                Désactivé
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Availability */}
                        <TableCell>
                          {preOrder.expected_availability_date ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(
                                    new Date(preOrder.expected_availability_date),
                                    'dd MMM yyyy',
                                    { locale: fr }
                                  )}
                                </span>
                              </div>
                              {daysUntil !== null && (
                                <p
                                  className={cn(
                                    'text-xs mt-1',
                                    daysUntil < 0
                                      ? 'text-red-600'
                                      : daysUntil <= 7
                                      ? 'text-orange-600'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {daysUntil < 0
                                    ? 'En retard'
                                    : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Non définie</span>
                          )}
                        </TableCell>

                        {/* Limit / Current */}
                        <TableCell>
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="font-bold">{preOrder.current_pre_orders}</span>
                              {preOrder.pre_order_limit && (
                                <>
                                  {' / '}
                                  <span className="text-muted-foreground">
                                    {preOrder.pre_order_limit}
                                  </span>
                                </>
                              )}
                            </div>
                            {preOrder.pre_order_limit && preOrder.pre_order_limit > 0 && (
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className={cn(
                                    'h-2 rounded-full transition-all',
                                    fillPercentage >= 100
                                      ? 'bg-red-600'
                                      : fillPercentage >= 80
                                      ? 'bg-orange-600'
                                      : 'bg-green-600'
                                  )}
                                  style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Reserved */}
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {preOrder.reserved_quantity}
                          </Badge>
                        </TableCell>

                        {/* Deposit */}
                        <TableCell>
                          {preOrder.deposit_required ? (
                            <div className="text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600 inline mr-1" />
                              {preOrder.deposit_amount
                                ? `${preOrder.deposit_amount.toLocaleString()} XOF`
                                : `${preOrder.deposit_percentage}%`}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Non requis</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCustomers(preOrder)}
                              className="gap-2"
                            >
                              <Users className="h-4 w-4" />
                              {preOrder.current_pre_orders}
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
      {selectedPreOrder && (
        <Dialog open={showCustomers} onOpenChange={setShowCustomers}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Clients en Pré-commande</DialogTitle>
              <DialogDescription>{selectedPreOrder.product_name}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedPreOrder.current_pre_orders}</p>
                      <p className="text-sm text-muted-foreground">Clients</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{selectedPreOrder.reserved_quantity}</p>
                      <p className="text-sm text-muted-foreground">Unités réservées</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {getCustomersForPreOrder(selectedPreOrder.id).filter((c) => c.deposit_paid)
                          .length}
                      </p>
                      <p className="text-sm text-muted-foreground">Acomptes payés</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Acompte</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notifié</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCustomersForPreOrder(selectedPreOrder.id).map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {customer.customer_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          {customer.deposit_paid ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              {customer.deposit_amount?.toLocaleString()} XOF
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              En attente
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(customer.created_at), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.notified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomers(false)}>
                Fermer
              </Button>
              <Button>Envoyer Notification à tous</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

