/**
 * Composant de gestion des précommandes
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
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
  Search,
  X,
  TrendingUp,
} from 'lucide-react';
import {
  usePreOrders,
  usePreOrderCustomers,
  useUpdatePreOrder,
  useConvertPreOrderToOrders,
  useNotifyPreOrderCustomers,
  PreOrder,
} from '@/hooks/physical/usePreOrders';
import { useStore } from '@/hooks/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export function PreOrdersManager() {
  const { store } = useStore();
  const { data: preOrders, isLoading } = usePreOrders(store?.id || null);
  const updatePreOrder = useUpdatePreOrder();
  const convertToOrders = useConvertPreOrderToOrders();
  const notifyCustomers = useNotifyPreOrderCustomers();

  const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(null);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const preOrdersRef = useScrollAnimation<HTMLDivElement>();

  const { data: customers } = usePreOrderCustomers(showCustomers ? selectedPreOrder?.id || null : null);

  // Stats calculées
  const stats = useMemo(() => {
    if (!preOrders) return { total: 0, active: 0, arrived: 0, totalCustomers: 0 };
    const total = preOrders.length;
    const active = preOrders.filter(po => po.status === 'active').length;
    const arrived = preOrders.filter(po => po.status === 'arrived').length;
    const totalCustomers = preOrders.reduce((sum, po) => sum + po.current_pre_orders, 0);
    return { total, active, arrived, totalCustomers };
  }, [preOrders]);

  // Filtrage des précommandes
  const filteredPreOrders = useMemo(() => {
    if (!preOrders) return [];
    if (!debouncedSearch) return preOrders;
    const searchLower = debouncedSearch.toLowerCase();
    return preOrders.filter(po => 
      po.product?.name?.toLowerCase().includes(searchLower) ||
      po.variant?.name?.toLowerCase().includes(searchLower)
    );
  }, [preOrders, debouncedSearch]);

  const getStatusBadge = (status: PreOrder['status']) => {
    const variants: Record<PreOrder['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      active: { variant: 'default', label: 'Active', className: 'bg-green-500' },
      pending_arrival: { variant: 'secondary', label: 'En attente' },
      arrived: { variant: 'outline', label: 'Arrivée', className: 'bg-blue-500' },
      fulfilled: { variant: 'default', label: 'Remplie', className: 'bg-purple-500' },
      cancelled: { variant: 'destructive', label: 'Annulée' },
    };

    const config = variants[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const handleConvertToOrders = async () => {
    if (!selectedPreOrder) return;
    await convertToOrders.mutateAsync(selectedPreOrder.id);
    setShowConvertDialog(false);
    setSelectedPreOrder(null);
  };

  const handleNotifyCustomers = async () => {
    if (!selectedPreOrder) return;
    await notifyCustomers.mutateAsync(selectedPreOrder.id);
    setShowNotifyDialog(false);
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
      {/* Stats Cards - Responsive */}
      {preOrders && preOrders.length > 0 && (
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {[
            { label: 'Total Précommandes', value: stats.total, icon: Package, color: 'from-purple-600 to-pink-600' },
            { label: 'Actives', value: stats.active, icon: CheckCircle2, color: 'from-green-600 to-emerald-600' },
            { label: 'Arrivées', value: stats.arrived, icon: TrendingUp, color: 'from-blue-600 to-cyan-600' },
            { label: 'Total Clients', value: stats.totalCustomers, icon: Users, color: 'from-orange-600 to-yellow-600' },
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

      {/* Search - Responsive */}
      {preOrders && preOrders.length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par produit ou variante..."
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
          </CardContent>
        </Card>
      )}

      {/* PreOrders List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                Gestion des Précommandes
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gérez les précommandes de vos produits physiques
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm w-fit">
              {preOrders?.length || 0} précommande{(preOrders?.length || 0) > 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!preOrders || preOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucune précommande pour le moment</p>
            </div>
          ) : filteredPreOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center py-8 sm:py-12">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
              <p className="text-sm sm:text-base text-muted-foreground">Aucune précommande trouvée</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="block md:hidden space-y-3 sm:space-y-4">
                {filteredPreOrders.map((preOrder, index) => (
                  <PreOrderCard
                    key={preOrder.id}
                    preOrder={preOrder}
                    getStatusBadge={getStatusBadge}
                    onViewCustomers={() => {
                      setSelectedPreOrder(preOrder);
                      setShowCustomers(true);
                    }}
                    onNotify={() => {
                      setSelectedPreOrder(preOrder);
                      setShowNotifyDialog(true);
                    }}
                    onConvert={() => {
                      setSelectedPreOrder(preOrder);
                      setShowConvertDialog(true);
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
                      <TableHead className="min-w-[120px]">Statut</TableHead>
                      <TableHead className="min-w-[150px]">Date prévue</TableHead>
                      <TableHead className="min-w-[120px]">Commandes</TableHead>
                      <TableHead className="min-w-[120px]">Limite</TableHead>
                      <TableHead className="text-right min-w-[200px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreOrders.map((preOrder) => (
                      <TableRow key={preOrder.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-sm truncate">
                              {preOrder.product?.name || 'N/A'}
                            </p>
                            {preOrder.variant && (
                              <p className="text-xs text-muted-foreground truncate">
                                {preOrder.variant.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(preOrder.status)}</TableCell>
                        <TableCell>
                          {preOrder.expected_availability_date ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {format(new Date(preOrder.expected_availability_date), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Non définie</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            {preOrder.current_pre_orders}
                          </div>
                        </TableCell>
                        <TableCell>
                          {preOrder.pre_order_limit ? (
                            <span className="text-sm">{preOrder.pre_order_limit}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Illimité</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPreOrder(preOrder);
                                setShowCustomers(true);
                              }}
                              className="h-8 text-xs"
                            >
                              Clients
                            </Button>
                            {preOrder.status === 'arrived' && !preOrder.notification_sent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPreOrder(preOrder);
                                  setShowNotifyDialog(true);
                                }}
                                className="h-8 text-xs"
                              >
                                <Bell className="h-3.5 w-3.5 mr-1.5" />
                                Notifier
                              </Button>
                            )}
                            {preOrder.status === 'arrived' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedPreOrder(preOrder);
                                  setShowConvertDialog(true);
                                }}
                                className="h-8 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                Convertir
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Clients - {selectedPreOrder?.product?.name}
            </DialogTitle>
            <DialogDescription>
              Liste des clients ayant effectué une précommande
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {customers && customers.length > 0 ? (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Client</TableHead>
                      <TableHead className="min-w-[100px]">Quantité</TableHead>
                      <TableHead className="min-w-[120px]">Dépôt</TableHead>
                      <TableHead className="min-w-[100px]">Notifié</TableHead>
                      <TableHead className="min-w-[120px]">Date</TableHead>
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
                        <TableCell className="text-sm">{customer.quantity}</TableCell>
                        <TableCell>
                          {customer.deposit_paid ? (
                            <Badge variant="default" className="bg-green-500">Payé</Badge>
                          ) : (
                            <Badge variant="outline">Non payé</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {customer.notified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: fr })}
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
                  Aucun client pour cette précommande
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Conversion */}
      <AlertDialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en commandes</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir cette précommande en commandes réelles ?
              Les clients seront automatiquement notifiés et les commandes seront créées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToOrders}
              disabled={convertToOrders.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {convertToOrders.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conversion...
                </>
              ) : (
                'Convertir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Notification */}
      <AlertDialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notifier les clients</AlertDialogTitle>
            <AlertDialogDescription>
              Envoyer une notification à tous les clients de cette précommande pour les informer de l'arrivée du produit.
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

// PreOrder Card Component for Mobile View
interface PreOrderCardProps {
  preOrder: PreOrder;
  getStatusBadge: (status: PreOrder['status']) => JSX.Element;
  onViewCustomers: () => void;
  onNotify: () => void;
  onConvert: () => void;
  animationDelay?: number;
}

function PreOrderCard({ preOrder, getStatusBadge, onViewCustomers, onNotify, onConvert, animationDelay = 0 }: PreOrderCardProps) {
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
                {preOrder.product?.name || 'N/A'}
              </CardTitle>
              {preOrder.variant && (
                <CardDescription className="text-xs sm:text-sm line-clamp-1">
                  {preOrder.variant.name}
                </CardDescription>
              )}
            </div>
          </div>
          {getStatusBadge(preOrder.status)}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
        <div className="space-y-2 text-xs sm:text-sm">
          {preOrder.expected_availability_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Date prévue: {format(new Date(preOrder.expected_availability_date), 'dd/MM/yyyy', { locale: fr })}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Commandes: {preOrder.current_pre_orders}</span>
            {preOrder.pre_order_limit && (
              <span className="text-muted-foreground">/ {preOrder.pre_order_limit}</span>
            )}
          </div>
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
          {preOrder.status === 'arrived' && !preOrder.notification_sent && (
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
          {preOrder.status === 'arrived' && (
            <Button
              onClick={onConvert}
              size="sm"
              variant="default"
              className="flex-1 min-w-[100px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <span className="text-xs sm:text-sm">Convertir</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
