/**
 * Composant: EarningsBalance
 * Description: Affiche le solde disponible et les statistiques de revenus
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, DollarSign, TrendingUp } from '@/components/icons';
import { StoreEarnings } from '@/types/store-withdrawals';
import { formatCurrency } from '@/lib/utils';

interface EarningsBalanceProps {
  earnings: StoreEarnings | null;
  loading: boolean;
  onWithdrawClick: () => void;
  /** Sum of pending withdrawal amounts reserved from available_balance */
  pendingAmount?: number;
}

export const EarningsBalance = ({
  earnings,
  loading,
  onWithdrawClick,
  pendingAmount = 0,
}: EarningsBalanceProps) => {
  const availableBalance = earnings?.available_balance || 0;
  const reservedPending = Math.max(0, pendingAmount);
  const withdrawable = Math.max(0, availableBalance - reservedPending);
  const canWithdraw = withdrawable > 0;

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
      {/* Solde disponible */}
      <Card className="sm:col-span-2 border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground">
            Solde disponible
          </CardTitle>
          <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-primary mb-1">
            {loading ? '...' : formatCurrency(availableBalance)}
          </div>
          {!loading && reservedPending > 0 && (
            <p className="text-[9px] sm:text-[10px] md:text-xs text-amber-700 dark:text-amber-400 mb-2">
              Retraits en attente : {formatCurrency(reservedPending)} — retirable :{' '}
              <strong>{formatCurrency(withdrawable)}</strong>
            </p>
          )}
          <Button
            size="sm"
            className="w-full h-8 sm:h-9 text-[10px] sm:text-xs md:text-sm"
            onClick={onWithdrawClick}
            disabled={!canWithdraw || loading}
          >
            <Wallet className="h-3 w-3 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Demander un retrait</span>
            <span className="sm:hidden">Retirer</span>
          </Button>
          {!loading && canWithdraw && (
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-2">
              Mobile Money : minimum 200 XOF, jusqu&apos;au solde retirable
              {reservedPending > 0 ? ' (hors retraits en attente)' : ''}.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Revenus totaux */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground">
            Revenus totaux
          </CardTitle>
          <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4">
          <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-emerald-600">
            {loading ? '...' : formatCurrency(earnings?.total_revenue || 0)}
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
            Depuis le début
          </p>
        </CardContent>
      </Card>

      {/* Total retiré */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground">
            Total retiré
          </CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4">
          <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-600">
            {loading ? '...' : formatCurrency(earnings?.total_withdrawn || 0)}
          </div>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-1">
            Montant retiré
          </p>
        </CardContent>
      </Card>

      {!loading && !canWithdraw && (
        <Card className="sm:col-span-2 md:col-span-4">
          <CardContent className="p-2.5 sm:p-3 md:p-4">
            <Alert className="text-xs sm:text-sm">
              <AlertTitle className="text-xs sm:text-sm">Solde insuffisant</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Aucun solde disponible pour un retrait pour le moment.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
