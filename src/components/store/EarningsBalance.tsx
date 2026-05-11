/**
 * Composant: EarningsBalance
 * Description: Affiche le solde disponible et les statistiques de revenus
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wallet, DollarSign, TrendingUp, CheckCircle2 } from '@/components/icons';
import { StoreEarnings } from '@/types/store-withdrawals';
import { formatCurrency } from '@/lib/utils';

interface EarningsBalanceProps {
  earnings: StoreEarnings | null;
  loading: boolean;
  onWithdrawClick: () => void;
}

export const EarningsBalance = ({ earnings, loading, onWithdrawClick }: EarningsBalanceProps) => {
  const MIN_WITHDRAWAL = 10000;
  const availableBalance = earnings?.available_balance || 0;
  const canWithdraw = availableBalance >= MIN_WITHDRAWAL;
  const progressPercentage = Math.min((availableBalance / MIN_WITHDRAWAL) * 100, 100);

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
      {/* Solde disponible */}
      <Card className="sm:col-span-2 border-2 border-primary">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground">
            Solde disponible
          </CardTitle>
          <Wallet  className ="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-primary mb-2 sm:mb-3 md:mb-4">
            {loading ? '...' : formatCurrency(availableBalance)}
          </div>
          <Button 
            size="sm" 
            className="w-full h-8 sm:h-9 text-[10px] sm:text-xs md:text-sm" 
            onClick={onWithdrawClick}
            disabled={!canWithdraw || loading}
          >
            <Wallet  className ="h-3 w-3 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Demander un retrait</span>
            <span className="sm:hidden">Retirer</span>
          </Button>
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

      {/* Progression vers le retrait minimum */}
      <Card className="sm:col-span-2 md:col-span-4">
        <CardHeader className="p-2.5 sm:p-3 md:p-4">
          <CardTitle className="text-[9px] sm:text-[10px] md:text-xs">Progression vers le retrait minimum</CardTitle>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 md:p-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-[9px] sm:text-[10px] md:text-xs">
              <span className="text-muted-foreground">Minimum : {formatCurrency(MIN_WITHDRAWAL)}</span>
              <span className="font-semibold">
                {loading ? '...' : `${formatCurrency(availableBalance)} / ${formatCurrency(MIN_WITHDRAWAL)}`}
              </span>
            </div>
            <Progress value={loading ? 0 : progressPercentage} className="h-2" />
            {!loading && canWithdraw && (
              <Alert className="text-xs sm:text-sm">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <AlertTitle className="text-xs sm:text-sm">Vous pouvez retirer !</AlertTitle>
                <AlertDescription className="text-xs sm:text-sm">
                  Vous avez atteint le montant minimum de retrait ({formatCurrency(MIN_WITHDRAWAL)})
                </AlertDescription>
              </Alert>
            )}
            {!loading && !canWithdraw && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                Il vous reste {formatCurrency(MIN_WITHDRAWAL - availableBalance)} pour atteindre le minimum de retrait
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};







