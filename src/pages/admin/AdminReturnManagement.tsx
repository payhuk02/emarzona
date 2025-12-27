/**
 * Page AdminReturnManagement - Gestion des retours (Admin/Vendor)
 * Date: 26 Janvier 2025
 */

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { LazyImage } from '@/components/ui/lazy-image';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/hooks/useStore';
import {
  useStoreReturns,
  useReturn,
  useUpdateReturnStatus,
  useProcessRefund,
  type ProductReturn,
} from '@/hooks/returns/useReturns';

// Type pour les retours avec relations depuis Supabase
type ReturnWithRelations = ProductReturn & {
  products?: {
    id: string;
    name: string;
    image_url?: string;
  } | null;
  orders?: {
    id: string;
    order_number: string;
    customer_id: string;
  } | null;
};
import {
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function AdminReturnManagement() {
  const { store } = useStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { data: returns, isLoading } = useStoreReturns(store?.id);
  const updateStatus = useUpdateReturnStatus();
  const processRefund = useProcessRefund();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');

  const filteredReturns = (returns || []).filter(r => {
    const returnTyped = r as ReturnWithRelations;
    const matchesSearch =
      returnTyped.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnTyped.products?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || returnTyped.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (returnId: string) => {
    try {
      await updateStatus.mutateAsync({
        returnId,
        status: 'approved',
        notes: 'Retour approuvé',
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleReject = async (returnId: string, reason: string) => {
    try {
      await updateStatus.mutateAsync({
        returnId,
        status: 'rejected',
        notes: reason,
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleRefund = async () => {
    if (!selectedReturnId || !refundAmount) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un montant',
        variant: 'destructive',
      });
      return;
    }

    try {
      await processRefund.mutateAsync({
        returnId: selectedReturnId,
        refundAmount: parseFloat(refundAmount),
        refundMethod: refundMethod as
          | 'original_payment'
          | 'store_credit'
          | 'bank_transfer'
          | 'check',
      });
      setRefundDialogOpen(false);
      setSelectedReturnId(null);
      setRefundAmount('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const getStatusBadge = (status: string) => {
    type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
    type IconComponent = React.ComponentType<{ className?: string }>;
    const  statusConfig: Record<
      string,
      { label: string; variant: BadgeVariant; icon: IconComponent }
    > = {
      requested: { label: 'En attente', variant: 'secondary', icon: Clock },
      approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle2 },
      rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
      pending_pickup: { label: 'Récupération', variant: 'secondary', icon: Clock },
      in_transit: { label: 'En transit', variant: 'default', icon: Package },
      received: { label: 'Reçu', variant: 'default', icon: CheckCircle2 },
      inspecting: { label: 'Inspection', variant: 'secondary', icon: AlertCircle },
      refunded: { label: 'Remboursé', variant: 'default', icon: CheckCircle2 },
      exchanged: { label: 'Échangé', variant: 'default', icon: RefreshCw },
      replaced: { label: 'Remplacé', variant: 'default', icon: Package },
      cancelled: { label: 'Annulé', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6 pb-16 md:pb-0">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-16 md:pb-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <RefreshCw className="h-8 w-8" />
                Gestion des Retours
              </h1>
              <p className="text-muted-foreground mt-1">
                Gérez les demandes de retour et remboursement de vos produits
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{returns?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Total retours</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {returns?.filter(r => (r as ReturnWithRelations).status === 'requested')
                      .length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">En attente</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {returns?.filter(r => (r as ReturnWithRelations).status === 'refunded')
                      .length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Remboursés</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {returns
                      ?.reduce((sum: number, r) => {
                        const returnTyped = r as ReturnWithRelations;
                        return sum + (returnTyped.refund_amount || 0);
                      }, 0)
                      .toLocaleString('fr-FR') || 0}{' '}
                    XOF
                  </div>
                  <div className="text-sm text-muted-foreground">Total remboursé</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par numéro ou produit..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 min-h-[44px]"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="requested">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                      <SelectItem value="received">Reçu</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Retours</CardTitle>
                <CardDescription>
                  Gérez toutes les demandes de retour de vos produits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReturns && filteredReturns.length > 0 ? (
                  isMobile ? (
                    <MobileTableCard
                      data={filteredReturns.map(r => {
                        const returnTyped = r as ReturnWithRelations;
                        return { ...returnTyped, id: returnTyped.id };
                      })}
                      columns={[
                        {
                          key: 'return_number',
                          header: 'Numéro',
                          priority: 'high',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return (
                              <span className="font-mono text-sm font-medium">
                                {returnTyped.return_number}
                              </span>
                            );
                          },
                        },
                        {
                          key: 'product',
                          header: 'Produit',
                          priority: 'high',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return (
                              <div className="flex items-center gap-2">
                                {returnTyped.products?.image_url && (
                                  <LazyImage
                                    src={returnTyped.products.image_url}
                                    alt={returnTyped.products.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <span className="font-medium">
                                  {returnTyped.products?.name || 'Produit'}
                                </span>
                              </div>
                            );
                          },
                        },
                        {
                          key: 'customer',
                          header: 'Client',
                          priority: 'medium',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return (
                              <span className="text-sm">
                                {returnTyped.orders?.customer_id || 'N/A'}
                              </span>
                            );
                          },
                        },
                        {
                          key: 'reason',
                          header: 'Raison',
                          priority: 'low',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return (
                              <span className="text-xs text-muted-foreground">
                                {returnTyped.return_reason}
                              </span>
                            );
                          },
                        },
                        {
                          key: 'amount',
                          header: 'Montant',
                          priority: 'high',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold">
                                  {returnTyped.total_amount.toLocaleString('fr-FR')} XOF
                                </span>
                              </div>
                            );
                          },
                        },
                        {
                          key: 'status',
                          header: 'Statut',
                          priority: 'high',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return getStatusBadge(returnTyped.status);
                          },
                        },
                        {
                          key: 'date',
                          header: 'Date',
                          priority: 'low',
                          render: row => {
                            const returnTyped = row as ReturnWithRelations;
                            return (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(returnTyped.requested_at), 'PPP', { locale: fr })}
                              </span>
                            );
                          },
                        },
                      ]}
                      actions={(row: ReturnWithRelations) => {
                        return (
                          <div className="flex flex-col gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="min-h-[44px] w-full">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du Retour</DialogTitle>
                                  <DialogDescription>{row.return_number}</DialogDescription>
                                </DialogHeader>
                                <ReturnDetailView
                                  returnId={row.id}
                                  onApprove={handleApprove}
                                  onReject={handleReject}
                                  onRefund={() => {
                                    setSelectedReturnId(row.id);
                                    setRefundAmount(row.total_amount.toString());
                                    setRefundDialogOpen(true);
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                            {row.status === 'requested' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(row.id)}
                                  className="min-h-[44px] w-full"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt('Raison du rejet:');
                                    if (reason) {
                                      handleReject(row.id, reason);
                                    }
                                  }}
                                  className="min-h-[44px] w-full"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Rejeter
                                </Button>
                              </>
                            )}
                            {row.status === 'received' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedReturnId(row.id);
                                  setRefundAmount(row.total_amount.toString());
                                  setRefundDialogOpen(true);
                                }}
                                className="min-h-[44px] w-full"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Traiter remboursement
                              </Button>
                            )}
                          </div>
                        );
                      }}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Produit</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Raison</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReturns.map(returnItem => {
                            const returnTyped = returnItem as ReturnWithRelations;
                            return (
                              <TableRow key={returnTyped.id}>
                                <TableCell className="font-mono text-sm">
                                  {returnTyped.return_number}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {returnTyped.products?.image_url && (
                                      <LazyImage
                                        src={returnTyped.products.image_url}
                                        alt={returnTyped.products.name}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    )}
                                    <span className="font-medium">
                                      {returnTyped.products?.name || 'Produit'}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">
                                    {returnTyped.orders?.customer_id || 'N/A'}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {returnTyped.return_reason}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {returnTyped.total_amount.toLocaleString('fr-FR')} XOF
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(returnTyped.status)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(returnTyped.requested_at), 'PPP', {
                                      locale: fr,
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="min-h-[44px] min-w-[44px]"
                                        aria-label={`Actions pour le retour ${returnRequest.id}`}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem asChild>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <span className="cursor-pointer">Voir détails</span>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                              <DialogTitle>Détails du Retour</DialogTitle>
                                              <DialogDescription>
                                                {returnTyped.return_number}
                                              </DialogDescription>
                                            </DialogHeader>
                                            <ReturnDetailView
                                              returnId={returnTyped.id}
                                              onApprove={handleApprove}
                                              onReject={handleReject}
                                              onRefund={() => {
                                                setSelectedReturnId(returnTyped.id);
                                                setRefundAmount(
                                                  returnTyped.total_amount.toString()
                                                );
                                                setRefundDialogOpen(true);
                                              }}
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      </DropdownMenuItem>
                                      {returnTyped.status === 'requested' && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => handleApprove(returnTyped.id)}
                                          >
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Approuver
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              const reason = prompt('Raison du rejet:');
                                              if (reason) {
                                                handleReject(returnTyped.id, reason);
                                              }
                                            }}
                                            className="text-red-600"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Rejeter
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      {returnTyped.status === 'received' && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedReturnId(returnTyped.id);
                                            setRefundAmount(returnTyped.total_amount.toString());
                                            setRefundDialogOpen(true);
                                          }}
                                        >
                                          <DollarSign className="h-4 w-4 mr-2" />
                                          Traiter remboursement
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Aucun retour trouvé'
                        : 'Aucun retour pour le moment'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Refund Dialog */}
            <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Traiter le Remboursement</DialogTitle>
                  <DialogDescription>Configurez les détails du remboursement</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Montant à rembourser *</Label>
                    <Input
                      type="number"
                      value={refundAmount}
                      onChange={e => setRefundAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Méthode de remboursement *</Label>
                    <Select value={refundMethod} onValueChange={setRefundMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original_payment">Moyen de paiement original</SelectItem>
                        <SelectItem value="store_credit">Crédit boutique</SelectItem>
                        <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRefundDialogOpen(false);
                        setSelectedReturnId(null);
                        setRefundAmount('');
                      }}
                    >
                      Annuler
                    </Button>
                    <Button onClick={handleRefund}>Traiter le remboursement</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

// Composant pour afficher les détails d'un retour (version admin)
function ReturnDetailView({
  returnId,
  onApprove,
  onReject,
  onRefund,
}: {
  returnId: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onRefund?: () => void;
}) {
  const { data: returnItem } = useReturn(returnId);

  if (!returnItem) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Statut et actions */}
      <div className="flex items-center justify-between">
        <Badge>{returnItem.status}</Badge>
        <div className="flex gap-2">
          {returnItem.status === 'requested' && (
            <>
              <Button size="sm" onClick={() => onApprove?.(returnItem.id)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approuver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  const reason = prompt('Raison du rejet:');
                  if (reason) {
                    onReject?.(returnItem.id, reason);
                  }
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </>
          )}
          {returnItem.status === 'received' && (
            <Button size="sm" onClick={onRefund}>
              <DollarSign className="h-4 w-4 mr-2" />
              Rembourser
            </Button>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Montant total</div>
          <div className="font-semibold">{returnItem.total_amount.toLocaleString('fr-FR')} XOF</div>
        </div>
        {returnItem.refund_amount && (
          <div>
            <div className="text-sm text-muted-foreground">Montant remboursé</div>
            <div className="font-semibold">
              {returnItem.refund_amount.toLocaleString('fr-FR')} XOF
            </div>
          </div>
        )}
      </div>

      {/* Raison */}
      <div>
        <div className="text-sm text-muted-foreground mb-1">Raison</div>
        <p className="text-sm font-medium">{returnItem.return_reason}</p>
        {returnItem.return_reason_details && (
          <p className="text-sm text-muted-foreground mt-1">{returnItem.return_reason_details}</p>
        )}
      </div>

      {/* Notes client */}
      {returnItem.customer_notes && (
        <div>
          <div className="text-sm text-muted-foreground mb-1">Notes du client</div>
          <p className="text-sm">{returnItem.customer_notes}</p>
        </div>
      )}

      {/* Photos */}
      {returnItem.customer_photos && returnItem.customer_photos.length > 0 && (
        <div>
          <div className="text-sm text-muted-foreground mb-2">Photos du client</div>
          <div className="grid grid-cols-3 gap-2">
            {returnItem.customer_photos.map((url: string, index: number) => (
              <img
                key={index}
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover rounded"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Dates */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Demandé le:</span>
          <span>{format(new Date(returnItem.requested_at), 'PPP p', { locale: fr })}</span>
        </div>
        {returnItem.approved_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Approuvé le:</span>
            <span>{format(new Date(returnItem.approved_at), 'PPP p', { locale: fr })}</span>
          </div>
        )}
        {returnItem.received_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reçu le:</span>
            <span>{format(new Date(returnItem.received_at), 'PPP p', { locale: fr })}</span>
          </div>
        )}
        {returnItem.refunded_at && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remboursé le:</span>
            <span>{format(new Date(returnItem.refunded_at), 'PPP p', { locale: fr })}</span>
          </div>
        )}
      </div>
    </div>
  );
}






