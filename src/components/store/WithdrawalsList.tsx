/**
 * Composant: WithdrawalsList
 * Description: Liste des retraits avec filtres et statuts
 */

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  X,
  Loader2,
  History,
  Download
} from 'lucide-react';
import { StoreWithdrawal, StoreWithdrawalStatus } from '@/types/store-withdrawals';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { WithdrawalHistoryDialog } from './WithdrawalHistoryDialog';
import { downloadWithdrawalsCSV, downloadWithdrawalsJSON } from '@/lib/withdrawal-export';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface WithdrawalsListProps {
  withdrawals: StoreWithdrawal[];
  loading: boolean;
  onCancel?: (id: string) => Promise<void>;
  showExport?: boolean;
}

export const WithdrawalsList = ({ withdrawals, loading, onCancel, showExport = true }: WithdrawalsListProps) => {
  const [statusFilter, setStatusFilter] = useState<StoreWithdrawalStatus | 'all'>('all');
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  // Type pour les icônes de statut
  type StatusIcon = typeof Clock | typeof Loader2 | typeof CheckCircle2 | typeof XCircle | typeof X;

  const getStatusBadge = (status: StoreWithdrawalStatus) => {
    const variants: Record<StoreWithdrawalStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: StatusIcon, label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'En attente' },
      processing: { variant: 'default', icon: Loader2, label: 'En cours' },
      completed: { variant: 'default', icon: CheckCircle2, label: 'Complété' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Échoué' },
      cancelled: { variant: 'outline', icon: X, label: 'Annulé' },
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

  const filteredWithdrawals = useMemo(() => {
    return statusFilter === 'all' 
      ? withdrawals 
      : withdrawals.filter(w => w.status === statusFilter);
  }, [withdrawals, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const paginatedWithdrawals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWithdrawals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWithdrawals, currentPage, itemsPerPage]);

  const handleExportCSV = () => {
    try {
      downloadWithdrawalsCSV(filteredWithdrawals);
      toast({
        title: 'Export réussi',
        description: `${filteredWithdrawals.length} retrait(s) exporté(s) en CSV`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error exporting withdrawals CSV', { error: errorMessage });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les retraits',
        variant: 'destructive',
      });
    }
  };

  const handleExportJSON = () => {
    try {
      downloadWithdrawalsJSON(filteredWithdrawals);
      toast({
        title: 'Export réussi',
        description: `${filteredWithdrawals.length} retrait(s) exporté(s) en JSON`,
      });
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les retraits',
        variant: 'destructive',
      });
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-2.5 sm:p-3 md:p-4">
          <CardTitle className="text-sm sm:text-base md:text-lg">Historique des retraits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Historique des retraits
              {filteredWithdrawals.length > 0 && (
                <span className="ml-2 text-[10px] sm:text-xs md:text-sm font-normal text-muted-foreground">
                  ({filteredWithdrawals.length})
                </span>
              )}
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Select value={statusFilter} onValueChange={(value: StoreWithdrawalStatus | 'all') => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-9 text-[10px] sm:text-xs md:text-sm">
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
              {showExport && filteredWithdrawals.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Download className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">CSV</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportJSON}
                    className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <Download className="h-3 w-3 sm:mr-1" />
                    <span className="hidden sm:inline">JSON</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          {/* Pagination controls */}
          {filteredWithdrawals.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 pt-2 border-t">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                <span>Lignes par page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-7 sm:h-8 text-[10px] sm:text-xs md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[1060]">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({filteredWithdrawals.length} retrait{filteredWithdrawals.length > 1 ? 's' : ''})
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-20" />
            <p className="text-xs sm:text-sm md:text-base">Aucun retrait</p>
            <p className="text-[10px] sm:text-xs md:text-sm mt-2 px-4">
              {statusFilter === 'all' 
                ? 'Vous n\'avez pas encore effectué de retrait'
                : `Aucun retrait avec le statut "${statusFilter}"`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] sm:text-xs md:text-sm">Date</TableHead>
                  <TableHead className="text-[10px] sm:text-xs md:text-sm">Montant</TableHead>
                  <TableHead className="text-[10px] sm:text-xs md:text-sm hidden sm:table-cell">Méthode</TableHead>
                  <TableHead className="text-[10px] sm:text-xs md:text-sm">Statut</TableHead>
                  <TableHead className="text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Référence</TableHead>
                  <TableHead className="text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                      <span className="sm:hidden">
                        {format(new Date(withdrawal.created_at), 'dd/MM/yy', { locale: fr })}
                      </span>
                      <span className="hidden sm:inline">
                        {format(new Date(withdrawal.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-[10px] sm:text-xs md:text-sm">
                      {formatCurrency(withdrawal.amount)} {withdrawal.currency}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-xs md:text-sm hidden sm:table-cell">
                      {getPaymentMethodLabel(withdrawal.payment_method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(withdrawal.status)}
                    </TableCell>
                    <TableCell className="text-[10px] sm:text-xs text-muted-foreground hidden md:table-cell">
                      {withdrawal.transaction_reference || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedWithdrawalId(withdrawal.id)}
                          className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 px-2 sm:px-3"
                          title="Voir l'historique"
                        >
                          <History className="h-3 w-3 sm:mr-1" />
                          <span className="hidden sm:inline">Historique</span>
                        </Button>
                        {withdrawal.status === 'pending' && onCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onCancel(withdrawal.id)}
                            className="text-[10px] sm:text-xs md:text-sm h-7 sm:h-8 px-2 sm:px-3"
                          >
                            <span className="hidden sm:inline">Annuler</span>
                            <span className="sm:hidden">✕</span>
                          </Button>
                        )}
                      </div>
                      {withdrawal.rejection_reason && (
                        <div className="text-[10px] sm:text-xs text-destructive mt-1 max-w-[150px] sm:max-w-none truncate sm:whitespace-normal">
                          {withdrawal.rejection_reason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center pt-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                        className="text-xs sm:text-sm"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

