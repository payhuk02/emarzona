/**
 * Composant: WithdrawalStatsCard
 * Description: Carte affichant les statistiques avancées des retraits
 * Date: 2025-02-03
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useWithdrawalStats } from '@/hooks/useWithdrawalStats';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Wallet,
  BarChart3,
  Timer
} from 'lucide-react';

interface WithdrawalStatsCardProps {
  storeId?: string;
  startDate?: string;
  endDate?: string;
}

export const WithdrawalStatsCard = ({ storeId, startDate, endDate }: WithdrawalStatsCardProps) => {
  const { stats, loading } = useWithdrawalStats({ storeId, startDate, endDate });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_withdrawals === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            Statistiques avancées
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm">
            Aucune statistique disponible
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatHours = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} h`;
    return `${(hours / 24).toFixed(1)} jours`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
          Statistiques avancées
        </CardTitle>
        <CardDescription className="text-[10px] sm:text-xs md:text-sm">
          Analyse détaillée de vos retraits
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2.5 sm:p-3 md:p-4 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Statistiques générales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="space-y-1">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Total retraits</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">{stats.total_withdrawals}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Montant total</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">{formatCurrency(stats.total_amount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">Taux de réussite</p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">{stats.success_rate.toFixed(1)}%</p>
              <TrendingUp className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${stats.success_rate >= 80 ? 'text-green-500' : stats.success_rate >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-muted-foreground">Montant moyen</p>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.average_amount)}</p>
          </div>
        </div>

        {/* Statistiques de temps */}
        <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg">
          <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Temps de traitement
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Moyen (traitement)</p>
              <p className="text-sm sm:text-base font-semibold">
                {formatHours(stats.time_stats.average_processing_time_hours)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Moyen (complet)</p>
              <p className="text-sm sm:text-base font-semibold">
                {formatHours(stats.time_stats.average_completion_time_hours)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Plus rapide</p>
              <p className="text-sm sm:text-base font-semibold">
                {formatHours(stats.time_stats.fastest_processing_hours)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Plus lent</p>
              <p className="text-sm sm:text-base font-semibold">
                {formatHours(stats.time_stats.slowest_processing_hours)}
              </p>
            </div>
          </div>
        </div>

        {/* Par méthode de paiement */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <Wallet  className ="h-4 w-4" />
            Par méthode de paiement
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(stats.by_payment_method).map(([method, data]) => (
              <div key={method} className="p-3 sm:p-4 border rounded-lg space-y-2">
                <p className="text-xs sm:text-sm font-medium capitalize">
                  {method === 'mobile_money' ? 'Mobile Money' : method === 'bank_card' ? 'Carte bancaire' : 'Virement'}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {data.count} retrait{data.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm sm:text-base font-semibold">
                    {formatCurrency(data.amount)}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={data.success_rate} className="flex-1 h-2" />
                    <span className="text-xs font-medium">{data.success_rate.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistiques par période */}
        {stats.period_stats.length > 0 && (
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-sm sm:text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Évolution mensuelle
            </h4>
            <div className="space-y-2">
              {stats.period_stats.slice(-6).reverse().map((period) => (
                <div key={period.period} className="p-3 sm:p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-medium">
                      {format(new Date(period.period + '-01'), 'MMMM yyyy', { locale: fr })}
                    </p>
                    <Badge variant={period.success_rate >= 80 ? 'default' : period.success_rate >= 50 ? 'secondary' : 'destructive'}>
                      {period.success_rate.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">{period.total_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Complétés</p>
                      <p className="font-semibold text-green-600">{period.completed_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Échoués</p>
                      <p className="font-semibold text-red-600">{period.failed_count}</p>
                    </div>
                  </div>
                  <Progress value={period.success_rate} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};







