/**
 * Composant amélioré de gestion des backorders
 * Date: 28 Janvier 2025
 * Avec alertes automatiques, priorisation, suivi fournisseurs
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Loader2,
  Calendar,
  Users,
  AlertCircle,
  TrendingUp,
  Truck,
  Factory,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import {
  useBackorders,
  useBackorderCustomers,
  useUpdateBackorder,
  useReceiveBackorderStock,
  useNotifyBackorderCustomers,
  useMarkBackorderOrdered,
  Backorder,
  BackorderStatus,
  BackorderPriority,
} from '@/hooks/physical/useBackorders';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

export function BackordersManager() {
  const { store } = useStore();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<BackorderStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<BackorderPriority | 'all'>('all');
  const [selectedBackorder, setSelectedBackorder] = useState<Backorder | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [receiveQuantity, setReceiveQuantity] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [purchaseOrderId, setPurchaseOrderId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'quantity'>('priority');

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const backordersRef = useScrollAnimation<HTMLDivElement>();

  const filters = useMemo(() => {
    const f: any = {};
    if (statusFilter !== 'all') f.status = statusFilter;
    if (priorityFilter !== 'all') f.priority = priorityFilter;
    return f;
  }, [statusFilter, priorityFilter]);

  const { data: backorders, isLoading } = useBackorders(store?.id || null, filters);
  const { data: customers } = useBackorderCustomers(showCustomers ? selectedBackorder?.id || null : null);
  const updateBackorder = useUpdateBackorder();
  const receiveStock = useReceiveBackorderStock();
  const notifyCustomers = useNotifyBackorderCustomers();
  const markOrdered = useMarkBackorderOrdered();

  // Stats calculées
  const stats = useMemo(() => {
    if (!backorders) return { total: 0, urgent: 0, totalCustomers: 0, pendingUnits: 0 };
    return {
      total: backorders.length,
      urgent: backorders.filter((b) => b.priority === 'urgent' && b.status !== 'fulfilled').length,
      totalCustomers: backorders.reduce((sum, b) => sum + b.total_customers, 0),
      pendingUnits: backorders.reduce((sum, b) => sum + b.pending_quantity, 0),
    };
  }, [backorders]);

  // Backorders triés
  const sortedBackorders = useMemo(() => {
    if (!backorders) return [];
    const sorted = [...backorders];
    switch (sortBy) {
      case 'priority': {
        const priorityOrder: Record<BackorderPriority, number> = {
          urgent: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      }
      case 'date':
        sorted.sort((a, b) => new Date(b.first_request_date).getTime() - new Date(a.first_request_date).getTime());
        break;
      case 'quantity':
        sorted.sort((a, b) => b.pending_quantity - a.pending_quantity);
        break;
    }
    return sorted;
  }, [backorders, sortBy]);

  const getStatusBadge = (status: BackorderStatus) => {
    const config: Record<BackorderStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any; className?: string }> = {
      pending: { variant: 'secondary', label: 'En attente', icon: Clock },
      ordered: { variant: 'outline', label: 'Commandé', icon: Package, className: 'bg-blue-500' },
      in_transit: { variant: 'outline', label: 'En transit', icon: Truck, className: 'bg-purple-500' },
      partially_received: { variant: 'default', label: 'Partiellement reçu', icon: TrendingUp, className: 'bg-yellow-500' },
      received: { variant: 'default', label: 'Reçu', icon: CheckCircle2, className: 'bg-green-500' },
      fulfilled: { variant: 'default', label: 'Rempli', icon: CheckCircle2, className: 'bg-green-500' },
    };
    const { variant, label, icon: Icon, className } = config[status];
    return (
      <Badge variant={variant} className={cn("flex items-center gap-1", className)}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: BackorderPriority) => {
    const config: Record<BackorderPriority, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      low: { variant: 'outline', label: 'Basse' },
      medium: { variant: 'default', label: 'Moyenne', className: 'bg-yellow-500' },
      high: { variant: 'default', label: 'Haute', className: 'bg-orange-500' },
      urgent: { variant: 'destructive', label: 'Urgente' },
    };
    const { variant, label, className } = config[priority];
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const handleReceiveStock = async () => {
    if (!selectedBackorder || receiveQuantity <= 0) return;
    await receiveStock.mutateAsync({
      backorderId: selectedBackorder.id,
      quantity: receiveQuantity,
    });
    setShowReceiveDialog(false);
    setReceiveQuantity(0);
    setSelectedBackorder(null);
  };

  const handleMarkOrdered = async () => {
    if (!selectedBackorder || orderQuantity <= 0) return;
    await markOrdered.mutateAsync({
      backorderId: selectedBackorder.id,
      orderedQuantity: orderQuantity,
      purchaseOrderId: purchaseOrderId || undefined,
      supplierName: supplierName || undefined,
    });
    setShowOrderDialog(false);
    setOrderQuantity(0);
    setPurchaseOrderId('');
    setSupplierName('');
    setSelectedBackorder(null);
  };

  const handleNotifyCustomers = async () => {
    if (!selectedBackorder) return;
    await notifyCustomers.mutateAsync(selectedBackorder.id);
    setShowNotifyDialog(false);
    setSelectedBackorder(null);
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
      {/* Stats Cards - Responsive */}
      {backorders && backorders.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Backorders', value: stats.total, icon: Package, color: 'from-purple-600 to-pink-600' },
            { label: 'Urgents', value: stats.urgent, icon: AlertCircle, color: 'from-red-600 to-orange-600' },
            { label: 'Total Clients', value: stats.totalCustomers, icon: Users, color: 'from-blue-600 to-cyan-600' },
            { label: 'Unités en attente', value: stats.pendingUnits, icon: Clock, color: 'from-yellow-600 to-orange-600' },
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

      {/* Filtres - Responsive */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            Gestion des Backorders
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Gérez les commandes en rupture de stock avec priorisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
              <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <Label className="text-xs sm:text-sm whitespace-nowrap">Statut:</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="ordered">Commandé</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="partially_received">Partiellement reçu</SelectItem>
                  <SelectItem value="received">Reçu</SelectItem>
                  <SelectItem value="fulfilled">Rempli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
              <Label className="text-xs sm:text-sm whitespace-nowrap">Priorité:</Label>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
              <ArrowUpDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <Label className="text-xs sm:text-sm whitespace-nowrap">Trier par:</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priorité</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="quantity">Quantité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {!sortedBackorders || sortedBackorders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucun backorder trouvé avec ces filtres</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {sortedBackorders.map((backorder, index) => (
                  <BackorderCard
                    key={backorder.id}
                    backorder={backorder}
                    getStatusBadge={getStatusBadge}
                    getPriorityBadge={getPriorityBadge}
                    onViewCustomers={() => {
                      setSelectedBackorder(backorder);
                      setShowCustomers(true);
                    }}
                    onMarkOrdered={() => {
                      setSelectedBackorder(backorder);
                      setOrderQuantity(backorder.pending_quantity);
                      setShowOrderDialog(true);
                    }}
                    onReceiveStock={() => {
                      setSelectedBackorder(backorder);
                      setReceiveQuantity(0);
                      setShowReceiveDialog(true);
                    }}
                    onNotify={() => {
                      setSelectedBackorder(backorder);
                      setShowNotifyDialog(true);
                    }}
                    animationDelay={index * 50}
                  />
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Produit</TableHead>
                      <TableHead className="min-w-[100px]">Priorité</TableHead>
                      <TableHead className="min-w-[130px]">Statut</TableHead>
                      <TableHead className="min-w-[100px]">Demande</TableHead>
                      <TableHead className="min-w-[100px]">Commandé</TableHead>
                      <TableHead className="min-w-[100px]">Reçu</TableHead>
                      <TableHead className="min-w-[100px]">En attente</TableHead>
                      <TableHead className="min-w-[150px]">Fournisseur</TableHead>
                      <TableHead className="min-w-[120px]">Date prévue</TableHead>
                      <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBackorders.map((backorder) => (
                      <TableRow key={backorder.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate">
                              {backorder.product?.name || 'N/A'}
                            </p>
                            {backorder.variant && (
                              <p className="text-xs text-muted-foreground truncate">
                                {backorder.variant.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getPriorityBadge(backorder.priority)}</TableCell>
                        <TableCell>{getStatusBadge(backorder.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            {backorder.customer_demand}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{backorder.ordered_quantity}</TableCell>
                        <TableCell className="text-sm">{backorder.received_quantity}</TableCell>
                        <TableCell>
                          <span className={cn("text-sm", backorder.pending_quantity > 0 && 'font-semibold text-orange-500')}>
                            {backorder.pending_quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          {backorder.supplier_name ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Factory className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{backorder.supplier_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {backorder.expected_restock_date ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(backorder.expected_restock_date), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBackorder(backorder);
                                setShowCustomers(true);
                              }}
                              className="h-8 text-xs"
                            >
                              Clients
                            </Button>
                            {backorder.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackorder(backorder);
                                  setOrderQuantity(backorder.pending_quantity);
                                  setShowOrderDialog(true);
                                }}
                                className="h-8 text-xs"
                              >
                                Marquer commandé
                              </Button>
                            )}
                            {(backorder.status === 'ordered' || backorder.status === 'in_transit' || backorder.status === 'partially_received') && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackorder(backorder);
                                  setReceiveQuantity(0);
                                  setShowReceiveDialog(true);
                                }}
                                className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                Recevoir stock
                              </Button>
                            )}
                            {backorder.status === 'received' && !backorder.auto_fulfill_on_arrival && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBackorder(backorder);
                                  setShowNotifyDialog(true);
                                }}
                                className="h-8 text-xs"
                              >
                                <Bell className="h-3.5 w-3.5 mr-1.5" />
                                Notifier
                              </Button>
                            )}
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

      {/* Dialog Clients */}
      <Dialog open={showCustomers} onOpenChange={setShowCustomers}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clients - {selectedBackorder?.product?.name}</DialogTitle>
            <DialogDescription>
              Liste des clients en attente pour ce backorder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {customers && customers.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Client</TableHead>
                      <TableHead className="min-w-[120px]">Commande</TableHead>
                      <TableHead className="min-w-[120px]">Quantité demandée</TableHead>
                      <TableHead className="min-w-[120px]">Quantité remplie</TableHead>
                      <TableHead className="min-w-[100px]">Notifié</TableHead>
                      <TableHead className="min-w-[100px]">Rempli</TableHead>
                      <TableHead className="min-w-[120px]">Date demande</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {customer.customer?.full_name || 'Client'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {customer.customer?.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {customer.order?.order_number || customer.order_id}
                        </TableCell>
                        <TableCell className="text-sm">{customer.quantity_requested}</TableCell>
                        <TableCell className="text-sm">{customer.quantity_fulfilled}</TableCell>
                        <TableCell>
                          {customer.is_notified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.is_fulfilled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(customer.requested_at), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">
                  Aucun client pour ce backorder
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Recevoir Stock */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recevoir du Stock</DialogTitle>
            <DialogDescription>
              Enregistrer une réception de stock pour {selectedBackorder?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantité reçue</Label>
              <Input
                type="number"
                value={receiveQuantity}
                onChange={(e) => setReceiveQuantity(Number(e.target.value))}
                min="1"
                max={selectedBackorder?.pending_quantity || 0}
              />
              <p className="text-xs text-muted-foreground">
                Quantité en attente: {selectedBackorder?.pending_quantity || 0}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleReceiveStock}
              disabled={receiveStock.isPending || receiveQuantity <= 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {receiveStock.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Marquer Commandé */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marquer comme Commandé</DialogTitle>
            <DialogDescription>
              Enregistrer la commande au fournisseur pour {selectedBackorder?.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantité commandée</Label>
              <Input
                type="number"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Number(e.target.value))}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Nom du fournisseur (optionnel)</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="space-y-2">
              <Label>Numéro de commande (optionnel)</Label>
              <Input
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                placeholder="PO-12345"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleMarkOrdered}
              disabled={markOrdered.isPending || orderQuantity <= 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {markOrdered.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Notification */}
      <AlertDialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notifier les clients</AlertDialogTitle>
            <AlertDialogDescription>
              Envoyer une notification à tous les clients de ce backorder pour les informer de la disponibilité du produit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleNotifyCustomers}
              disabled={notifyCustomers.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {notifyCustomers.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Notifier
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Backorder Card Component for Mobile View
interface BackorderCardProps {
  backorder: Backorder;
  getStatusBadge: (status: BackorderStatus) => JSX.Element;
  getPriorityBadge: (priority: BackorderPriority) => JSX.Element;
  onViewCustomers: () => void;
  onMarkOrdered: () => void;
  onReceiveStock: () => void;
  onNotify: () => void;
  animationDelay?: number;
}

function BackorderCard({ 
  backorder, 
  getStatusBadge, 
  getPriorityBadge, 
  onViewCustomers, 
  onMarkOrdered, 
  onReceiveStock, 
  onNotify,
  animationDelay = 0 
}: BackorderCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
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
                {backorder.product?.name || 'N/A'}
              </CardTitle>
              {backorder.variant && (
                <CardDescription className="text-xs sm:text-sm line-clamp-1">
                  {backorder.variant.name}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            {getPriorityBadge(backorder.priority)}
            {getStatusBadge(backorder.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Demande: {backorder.customer_demand}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Commandé: {backorder.ordered_quantity} | Reçu: {backorder.received_quantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-orange-500">En attente: {backorder.pending_quantity}</span>
          </div>
          {backorder.supplier_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Factory className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">{backorder.supplier_name}</span>
            </div>
          )}
          {backorder.expected_restock_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Date prévue: {format(new Date(backorder.expected_restock_date), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={onViewCustomers}
            size="sm"
            variant="outline"
            className="flex-1 min-w-[100px]"
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm">Clients</span>
          </Button>
          {backorder.status === 'pending' && (
            <Button
              onClick={onMarkOrdered}
              size="sm"
              variant="outline"
              className="flex-1 min-w-[100px]"
            >
              <span className="text-xs sm:text-sm">Marquer commandé</span>
            </Button>
          )}
          {(backorder.status === 'ordered' || backorder.status === 'in_transit' || backorder.status === 'partially_received') && (
            <Button
              onClick={onReceiveStock}
              size="sm"
              variant="default"
              className="flex-1 min-w-[100px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <span className="text-xs sm:text-sm">Recevoir stock</span>
            </Button>
          )}
          {backorder.status === 'received' && !backorder.auto_fulfill_on_arrival && (
            <Button
              onClick={onNotify}
              size="sm"
              variant="outline"
              className="flex-1 min-w-[100px]"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">Notifier</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
