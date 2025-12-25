/**
 * Composant: WithdrawalHistoryDialog
 * Description: Dialog pour afficher l'historique des changements de statut d'un retrait
 * Date: 2025-02-03
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWithdrawalHistory } from '@/hooks/useWithdrawalHistory';
import { StoreWithdrawalStatus } from '@/types/store-withdrawals';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

interface WithdrawalHistoryDialogProps {
  withdrawalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusLabel = (status: StoreWithdrawalStatus | null): string => {
  const labels: Record<StoreWithdrawalStatus, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Complété',
    failed: 'Échoué',
    cancelled: 'Annulé',
  };
  return status ? labels[status] : 'Création';
};

const getStatusIcon = (status: StoreWithdrawalStatus | null) => {
  if (!status) return Clock;
  const icons: Record<StoreWithdrawalStatus, any> = {
    pending: Clock,
    processing: AlertCircle,
    completed: CheckCircle2,
    failed: XCircle,
    cancelled: X,
  };
  return icons[status];
};

const getStatusVariant = (status: StoreWithdrawalStatus | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!status) return 'outline';
  const variants: Record<StoreWithdrawalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    processing: 'default',
    completed: 'default',
    failed: 'destructive',
    cancelled: 'outline',
  };
  return variants[status];
};

export const WithdrawalHistoryDialog = ({
  withdrawalId,
  open,
  onOpenChange,
}: WithdrawalHistoryDialogProps) => {
  const { history, loading } = useWithdrawalHistory({
    withdrawalId: withdrawalId || undefined,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Historique des changements</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Traçabilité complète des changements de statut de ce retrait
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">Aucun historique disponible</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {history.map((item, index) => {
                const OldIcon = getStatusIcon(item.old_status);
                const NewIcon = getStatusIcon(item.new_status);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <NewIcon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.old_status && (
                          <>
                            <Badge variant={getStatusVariant(item.old_status)} className="text-xs">
                              <OldIcon className="h-3 w-3 mr-1" />
                              {getStatusLabel(item.old_status)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">→</span>
                          </>
                        )}
                        <Badge variant={getStatusVariant(item.new_status)} className="text-xs">
                          <NewIcon className="h-3 w-3 mr-1" />
                          {getStatusLabel(item.new_status)}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {format(new Date(item.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                      {item.change_reason && (
                        <p className="text-xs sm:text-sm text-foreground mt-1">
                          <span className="font-medium">Raison:</span> {item.change_reason}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

