/**
 * Page d'administration pour les statistiques Moneroo
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMonerooStats, usePaymentStats, useRevenueStats, useTimeStats, usePaymentMethodStats, useStatsByDate } from '@/hooks/useMonerooStats';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/currency-converter';
import { format } from 'date-fns';

export default function MonerooAnalytics() {
  const [dateRange, setDateRange] = useState<{
    startDate?: Date;
    endDate?: Date;
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
    endDate: new Date(),
  });

  const { data: stats, isLoading, error } = useMonerooStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: paymentStats } = usePaymentStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: revenueStats } = useRevenueStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: timeStats } = useTimeStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: methodStats } = usePaymentMethodStats({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: statsByDate } = useStatsByDate({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Erreur lors du chargement des statistiques: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Statistiques Moneroo</h1>
            <p className="text-muted-foreground">
              Analyse détaillée des paiements Moneroo
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({
                  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  endDate: new Date(),
                });
              }}
              className="min-h-[44px]"
            >
              7 derniers jours
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({
                  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                  endDate: new Date(),
                });
              }}
              className="min-h-[44px]"
            >
              30 derniers jours
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDateRange({
                  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                  endDate: new Date(),
                });
              }}
              className="min-h-[44px]"
            >
              90 derniers jours
            </Button>
          </div>
        </div>

        {/* Statistiques de paiement */}
        {paymentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentStats.total}</div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réussies</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{paymentStats.successful}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={paymentStats.successRate} className="flex-1" />
                  <span className="text-xs text-muted-foreground">{paymentStats.successRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Échouées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{paymentStats.failed}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={paymentStats.failureRate} className="flex-1" />
                  <span className="text-xs text-muted-foreground">{paymentStats.failureRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</div>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistiques de revenus */}
        {revenueStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus bruts</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenueStats.successful, revenueStats.currency)}
                </div>
                <p className="text-xs text-muted-foreground">Paiements réussis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remboursements</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(revenueStats.refunded, revenueStats.currency)}
                </div>
                <p className="text-xs text-muted-foreground">Montants remboursés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus nets</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(revenueStats.net, revenueStats.currency)}
                </div>
                <p className="text-xs text-muted-foreground">Après remboursements</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Statistiques de temps */}
        {timeStats && (
          <Card>
            <CardHeader>
              <CardTitle>Temps de traitement</CardTitle>
              <CardDescription>Statistiques sur la durée de traitement des paiements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne</p>
                  <p className="text-2xl font-bold">{timeStats.averageProcessingTime} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Médiane</p>
                  <p className="text-2xl font-bold">{timeStats.medianProcessingTime} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plus rapide</p>
                  <p className="text-2xl font-bold text-green-600">{timeStats.fastestPayment} min</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plus lent</p>
                  <p className="text-2xl font-bold text-red-600">{timeStats.slowestPayment} min</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques par méthode de paiement */}
        {methodStats && methodStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Par méthode de paiement</CardTitle>
              <CardDescription>Répartition des paiements par méthode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {methodStats.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{method.method}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {method.count} transactions
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(method.totalAmount, 'XOF')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {method.successRate.toFixed(1)}% de succès
                        </p>
                      </div>
                      <Progress value={method.successRate} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques par date */}
        {statsByDate && statsByDate.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Évolution quotidienne</CardTitle>
              <CardDescription>Paiements et revenus par jour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statsByDate.slice(-10).reverse().map((stat) => (
                  <div key={stat.date} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(stat.date), 'PPP')}
                      </p>
                      <p className="text-xs text-muted-foreground">{stat.count} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(stat.amount, 'XOF')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

