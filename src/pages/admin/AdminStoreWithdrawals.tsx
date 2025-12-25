/**
 * Page: AdminStoreWithdrawals
 * Description: Gestion des retraits des vendeurs par l'admin
 * Date: 2025-01-31
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
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
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Search,
  X,
  History,
  Download,
} from 'lucide-react';
import { useStoreWithdrawals } from '@/hooks/useStoreWithdrawals';
import type { StoreWithdrawal } from '@/types/store-withdrawals';
import {
  StoreWithdrawal,
  StoreWithdrawalStatus,
  StorePaymentMethod,
} from '@/types/store-withdrawals';
import { WithdrawalsFilters } from '@/components/store/WithdrawalsFilters';
import { downloadWithdrawalsCSV, downloadWithdrawalsJSON } from '@/lib/withdrawal-export';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useAdmin } from '@/hooks/useAdmin';
import { WithdrawalHistoryDialog } from '@/components/store/WithdrawalHistoryDialog';
import { WithdrawalStatsCard } from '@/components/store/WithdrawalStatsCard';

const AdminStoreWithdrawals = () => {
  const isMobile = useIsMobile();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<StoreWithdrawalStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  const { withdrawals, loading, refetch } = useStoreWithdrawals({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Synchronisation en temps réel pour les admins
  useEffect(() => {
    if (!isAdmin) return;

    // Nettoyer le channel précédent
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Créer un channel pour écouter tous les retraits (admin voit tout)
    channelRef.current = supabase
      .channel('admin-store-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_withdrawals',
        },
        payload => {
          logger.info('🔔 Admin: Store withdrawal updated in real-time', {
            eventType: payload.eventType,
          });

          // Rafraîchir la liste
          refetch();

          // Notifier l'admin d'un nouveau retrait
          if (payload.eventType === 'INSERT') {
            const newWithdrawal = payload.new as StoreWithdrawal;
            toast({
              title: 'Nouveau retrait 📤',
              description: `Nouvelle demande de retrait de ${formatCurrency(newWithdrawal.amount)} de ${newWithdrawal.store?.name || 'N/A'}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAdmin, refetch, toast]);

  // Dialog states
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<StoreWithdrawal | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [historyWithdrawalId, setHistoryWithdrawalId] = useState<string | null>(null);

  const handleApprove = useCallback(
    async (withdrawal: StoreWithdrawal) => {
      try {
        // Vérifier le solde disponible avant d'approuver
        const { data: earnings, error: earningsError } = await supabase
          .from('store_earnings')
          .select('available_balance')
          .eq('store_id', withdrawal.store_id)
          .single();

        if (earningsError) {
          logger.error('Error fetching earnings', { error: earningsError });
          toast({
            title: 'Erreur',
            description: 'Impossible de vérifier le solde disponible',
            variant: 'destructive',
          });
          return;
        }

        // Vérifier que le solde disponible est suffisant
        if (earnings && withdrawal.amount > (earnings.available_balance || 0)) {
          toast({
            title: 'Solde insuffisant',
            description: `Le solde disponible (${earnings.available_balance || 0} XOF) est inférieur au montant du retrait (${withdrawal.amount} XOF)`,
            variant: 'destructive',
          });
          return;
        }

        const { error } = await supabase
          .from('store_withdrawals')
          .update({
            status: 'processing',
            approved_at: new Date().toISOString(),
            approved_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .eq('id', withdrawal.id);

        if (error) throw error;

        toast({
          title: 'Retrait approuvé',
          description: 'Le retrait a été approuvé et est en cours de traitement',
        });

        await refetch();
        setShowApproveDialog(false);
        setSelectedWithdrawal(null);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error approving withdrawal', { error });
        toast({
          title: 'Erreur',
          description: "Impossible d'approuver le retrait",
          variant: 'destructive',
        });
      }
    },
    [toast, refetch]
  );

  const handleReject = useCallback(async () => {
    if (!selectedWithdrawal || !rejectReason) return;

    try {
      const { error } = await supabase
        .from('store_withdrawals')
        .update({
          status: 'failed',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectReason,
        })
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      toast({
        title: 'Retrait rejeté',
        description: 'Le retrait a été rejeté',
      });

      await refetch();
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedWithdrawal(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error rejecting withdrawal', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter le retrait',
        variant: 'destructive',
      });
    }
  }, [selectedWithdrawal, rejectReason, toast, refetch]);

  const handleComplete = useCallback(async () => {
    if (!selectedWithdrawal || !transactionReference) return;

    try {
      const { error } = await supabase
        .from('store_withdrawals')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          transaction_reference: transactionReference,
          proof_url: proofUrl || null,
        })
        .eq('id', selectedWithdrawal.id);

      if (error) throw error;

      toast({
        title: 'Retrait complété',
        description: 'Le retrait a été marqué comme complété',
      });

      await refetch();
      setShowCompleteDialog(false);
      setTransactionReference('');
      setProofUrl('');
      setSelectedWithdrawal(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error completing withdrawal', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de compléter le retrait',
        variant: 'destructive',
      });
    }
  }, [selectedWithdrawal, transactionReference, proofUrl, toast, refetch]);

  const getStatusBadge = (status: StoreWithdrawalStatus) => {
    type IconComponent = React.ComponentType<{ className?: string }>;
    const variants: Record<
      StoreWithdrawalStatus,
      {
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: IconComponent;
        label: string;
      }
    > = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      processing: { variant: 'default', icon: Loader2, label: 'En cours' },
      completed: { variant: 'default', icon: CheckCircle2, label: 'Complété' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Échoué' },
      cancelled: { variant: 'outline', icon: XCircle, label: 'Annulé' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      mobile_money: 'Mobile Money',
      bank_card: 'Carte bancaire',
      bank_transfer: 'Virement bancaire',
    };
    return labels[method] || method;
  };

  const [advancedFilters, setAdvancedFilters] = useState<{
    paymentMethod?: StorePaymentMethod;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
  }>({});

  const filteredWithdrawals = useMemo(() => {
    let filtered = [...withdrawals];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        w =>
          w.store?.name?.toLowerCase().includes(query) ||
          w.transaction_reference?.toLowerCase().includes(query) ||
          w.id.toLowerCase().includes(query)
      );
    }

    if (advancedFilters.paymentMethod) {
      filtered = filtered.filter(w => w.payment_method === advancedFilters.paymentMethod);
    }

    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(w => new Date(w.created_at) >= advancedFilters.dateFrom!);
    }

    if (advancedFilters.dateTo) {
      filtered = filtered.filter(w => new Date(w.created_at) <= advancedFilters.dateTo!);
    }

    if (advancedFilters.minAmount !== undefined) {
      filtered = filtered.filter(w => w.amount >= advancedFilters.minAmount!);
    }

    if (advancedFilters.maxAmount !== undefined) {
      filtered = filtered.filter(w => w.amount <= advancedFilters.maxAmount!);
    }

    return filtered;
  }, [withdrawals, searchQuery, advancedFilters]);

  const handleQuickFilter = useCallback((period: 'week' | 'month' | 'year' | 'all') => {
    const now = new Date();
    let dateFrom: Date | undefined;

    switch (period) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        dateFrom = undefined;
        break;
    }

    setAdvancedFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo: period === 'all' ? undefined : now,
    }));
  }, []);

  if (!isAdmin) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 pb-16 md:pb-0">
            <Card>
              <CardContent className="pt-6">
                <p>Accès refusé. Cette page est réservée aux administrateurs.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-16 md:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gestion des retraits vendeurs</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Gérez les demandes de retrait des vendeurs
              </p>
            </div>
          </div>

          {/* Filtres avancés */}
          <WithdrawalsFilters
            onFiltersChange={filters => {
              setAdvancedFilters({
                paymentMethod: filters.paymentMethod,
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                minAmount: filters.minAmount,
                maxAmount: filters.maxAmount,
              });
              if (filters.search) {
                setSearchQuery(filters.search);
              }
            }}
            onQuickFilter={handleQuickFilter}
            showQuickFilters={true}
          />

          {/* Filtres rapides (statut et recherche) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Filtres rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par boutique, référence..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-8 sm:pl-10 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: string) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[1060]">
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="processing">En cours</SelectItem>
                    <SelectItem value="completed">Complétés</SelectItem>
                    <SelectItem value="failed">Échoués</SelectItem>
                    <SelectItem value="cancelled">Annulés</SelectItem>
                  </SelectContent>
                </Select>
                {filteredWithdrawals.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadWithdrawalsCSV(filteredWithdrawals)}
                      className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                    >
                      <Download className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">CSV</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadWithdrawalsJSON(filteredWithdrawals)}
                      className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                    >
                      <Download className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">JSON</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Liste des retraits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Retraits ({filteredWithdrawals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 sm:py-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto" />
                </div>
              ) : filteredWithdrawals.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                  <p className="text-sm sm:text-base">Aucun retrait trouvé</p>
                </div>
              ) : isMobile ? (
                <MobileTableCard
                  data={filteredWithdrawals.map(w => ({ ...w, id: w.id }))}
                  columns={[
                    {
                      key: 'date',
                      label: 'Date',
                      priority: 'high',
                      render: (row: StoreWithdrawal) => (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(row.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </span>
                      ),
                    },
                    {
                      key: 'store',
                      label: 'Boutique',
                      priority: 'high',
                      render: (row: StoreWithdrawal) => (
                        <span className="font-semibold text-sm">{row.store?.name || 'N/A'}</span>
                      ),
                    },
                    {
                      key: 'amount',
                      label: 'Montant',
                      priority: 'high',
                      render: (row: StoreWithdrawal) => (
                        <span className="font-semibold text-sm">
                          {formatCurrency(row.amount)} {row.currency}
                        </span>
                      ),
                    },
                    {
                      key: 'method',
                      label: 'Méthode',
                      priority: 'medium',
                      render: (row: StoreWithdrawal) => (
                        <span className="text-xs">{getPaymentMethodLabel(row.payment_method)}</span>
                      ),
                    },
                    {
                      key: 'status',
                      label: 'Statut',
                      priority: 'high',
                      render: (row: StoreWithdrawal) => getStatusBadge(row.status),
                    },
                    {
                      key: 'reference',
                      label: 'Référence',
                      priority: 'low',
                      render: (row: StoreWithdrawal) => (
                        <span className="text-xs text-muted-foreground">
                          {row.transaction_reference || '-'}
                        </span>
                      ),
                    },
                  ]}
                  actions={(row: StoreWithdrawal) => (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWithdrawal(row);
                          setShowViewDialog(true);
                        }}
                        className="min-h-[44px] w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setHistoryWithdrawalId(row.id)}
                        className="min-h-[44px] w-full"
                      >
                        <History className="h-4 w-4 mr-2" />
                        Historique
                      </Button>
                      {row.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedWithdrawal(row);
                              setShowApproveDialog(true);
                            }}
                            className="min-h-[44px] w-full"
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedWithdrawal(row);
                              setShowRejectDialog(true);
                            }}
                            className="min-h-[44px] w-full"
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                      {row.status === 'processing' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedWithdrawal(row);
                            setShowCompleteDialog(true);
                          }}
                          className="min-h-[44px] w-full"
                        >
                          Compléter
                        </Button>
                      )}
                    </div>
                  )}
                />
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        <TableHead className="text-xs sm:text-sm">Boutique</TableHead>
                        <TableHead className="text-xs sm:text-sm">Montant</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">
                          Méthode
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden lg:table-cell">
                          Référence
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWithdrawals.map(withdrawal => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                            <span className="sm:hidden">
                              {format(new Date(withdrawal.created_at), 'dd/MM/yy', { locale: fr })}
                            </span>
                            <span className="hidden sm:inline">
                              {format(new Date(withdrawal.created_at), 'dd MMM yyyy HH:mm', {
                                locale: fr,
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-xs sm:text-sm">
                            <span className="truncate max-w-[100px] sm:max-w-none block">
                              {withdrawal.store?.name || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-xs sm:text-sm">
                            {formatCurrency(withdrawal.amount)} {withdrawal.currency}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                            {getPaymentMethodLabel(withdrawal.payment_method)}
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                            {withdrawal.transaction_reference || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowViewDialog(true);
                                }}
                                className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                              >
                                <Eye className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Voir</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setHistoryWithdrawalId(withdrawal.id)}
                                className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                                title="Voir l'historique"
                              >
                                <History className="h-3 w-3" />
                              </Button>
                              {withdrawal.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setShowApproveDialog(true);
                                    }}
                                    className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                                  >
                                    <span className="hidden sm:inline">Approuver</span>
                                    <span className="sm:hidden">✓</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedWithdrawal(withdrawal);
                                      setShowRejectDialog(true);
                                    }}
                                    className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                                  >
                                    <span className="hidden sm:inline">Rejeter</span>
                                    <span className="sm:hidden">✕</span>
                                  </Button>
                                </>
                              )}
                              {withdrawal.status === 'processing' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => {
                                    setSelectedWithdrawal(withdrawal);
                                    setShowCompleteDialog(true);
                                  }}
                                  className="text-xs sm:text-sm min-h-[44px] h-11 sm:h-12 px-2 sm:px-3"
                                >
                                  <span className="hidden sm:inline">Compléter</span>
                                  <span className="sm:hidden">✓</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog: Voir les détails */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Détails du retrait</DialogTitle>
              </DialogHeader>
              {selectedWithdrawal && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs sm:text-sm">Boutique</Label>
                      <p className="font-semibold text-sm sm:text-base">
                        {selectedWithdrawal.store?.name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Montant</Label>
                      <p className="font-semibold text-sm sm:text-base">
                        {formatCurrency(selectedWithdrawal.amount)} {selectedWithdrawal.currency}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Méthode</Label>
                      <p className="text-sm sm:text-base">
                        {getPaymentMethodLabel(selectedWithdrawal.payment_method)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs sm:text-sm">Statut</Label>
                      <div>{getStatusBadge(selectedWithdrawal.status)}</div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">Détails de paiement</Label>
                    <pre className="bg-muted p-2 sm:p-3 rounded text-xs sm:text-sm overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedWithdrawal.payment_details, null, 2)}
                    </pre>
                  </div>
                  {selectedWithdrawal.notes && (
                    <div>
                      <Label className="text-xs sm:text-sm">Notes</Label>
                      <p className="text-xs sm:text-sm">{selectedWithdrawal.notes}</p>
                    </div>
                  )}
                  {selectedWithdrawal.rejection_reason && (
                    <div>
                      <Label className="text-xs sm:text-sm">Raison du rejet</Label>
                      <p className="text-xs sm:text-sm text-destructive">
                        {selectedWithdrawal.rejection_reason}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Dialog: Approuver */}
          <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
            <AlertDialogContent className="w-[95vw] sm:max-w-[500px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg sm:text-xl">
                  Approuver le retrait
                </AlertDialogTitle>
                <AlertDialogDescription className="text-xs sm:text-sm">
                  Êtes-vous sûr de vouloir approuver ce retrait de{' '}
                  {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)} ? Le statut
                  passera à "En cours de traitement".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selectedWithdrawal && handleApprove(selectedWithdrawal)}
                  className="w-full sm:w-auto"
                >
                  Approuver
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Dialog: Rejeter */}
          <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
            <DialogContent className="w-[95vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Rejeter le retrait</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Veuillez indiquer la raison du rejet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                <div className="space-y-2">
                  <Label htmlFor="reject_reason" className="text-xs sm:text-sm">
                    Raison du rejet *
                  </Label>
                  <Textarea
                    id="reject_reason"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Expliquez pourquoi ce retrait est rejeté..."
                    rows={4}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(false)}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectReason}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Rejeter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog: Compléter */}
          <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
            <DialogContent className="w-[95vw] sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Compléter le retrait</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Indiquez la référence de transaction et la preuve de paiement
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_reference" className="text-xs sm:text-sm">
                    Référence de transaction *
                  </Label>
                  <Input
                    id="transaction_reference"
                    value={transactionReference}
                    onChange={e => setTransactionReference(e.target.value)}
                    placeholder="Référence de la transaction"
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proof_url" className="text-xs sm:text-sm">
                    URL de la preuve (optionnel)
                  </Label>
                  <Input
                    id="proof_url"
                    type="url"
                    value={proofUrl}
                    onChange={e => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteDialog(false)}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!transactionReference}
                  className="w-full sm:w-auto"
                  size="sm"
                >
                  Compléter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Statistiques avancées */}
          <WithdrawalStatsCard />

          {/* Dialog d'historique */}
          <WithdrawalHistoryDialog
            withdrawalId={historyWithdrawalId}
            open={!!historyWithdrawalId}
            onOpenChange={open => !open && setHistoryWithdrawalId(null)}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminStoreWithdrawals;
