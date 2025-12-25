/**
 * Page d'administration pour le monitoring des transactions
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency-converter';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface TransactionStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  cancelled: number;
  refunded: number;
  total_amount: number;
  completed_amount: number;
}

interface ConsistencyIssue {
  issue_type: string;
  transaction_id: string | null;
  order_id: string | null;
  payment_id: string | null;
  description: string;
  severity: string;
}

export default function TransactionMonitoring() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [consistencyIssues, setConsistencyIssues] = useState<ConsistencyIssue[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Charger les statistiques
  useEffect(() => {
    loadStats();
    checkConsistency();
  }, []);

  const loadStats = async () => {
    try {
      // Statistiques globales
      const { data: transactions } = await supabase
        .from('transactions')
        .select('status, amount');

      if (transactions) {
        const statsData: TransactionStats = {
          total: transactions.length,
          completed: transactions.filter(t => t.status === 'completed').length,
          failed: transactions.filter(t => t.status === 'failed').length,
          pending: transactions.filter(t => ['pending', 'processing'].includes(t.status)).length,
          cancelled: transactions.filter(t => t.status === 'cancelled').length,
          refunded: transactions.filter(t => t.status === 'refunded').length,
          total_amount: transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
          completed_amount: transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
        };
        setStats(statsData);
      }
    } catch (error) {
      logger.error('Error loading stats:', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkConsistency = async () => {
    try {
      const { data, error } = await supabase.rpc('check_transaction_consistency');

      if (error) {
        logger.error('Error checking consistency:', { error });
        return;
      }

      if (data) {
        setConsistencyIssues(data as ConsistencyIssue[]);
      }
    } catch (error) {
      logger.error('Error in consistency check:', { error });
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const { data, error } = await supabase.rpc('generate_consistency_report');

      if (error) {
        throw error;
      }

      setReport(data);
      toast({
        title: 'Rapport généré',
        description: 'Rapport de cohérence généré avec succès',
      });
    } catch (error) {
      logger.error('Error generating report:', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le rapport',
        variant: 'destructive',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const highSeverityIssues = consistencyIssues.filter(i => i.severity === 'high').length;
  const mediumSeverityIssues = consistencyIssues.filter(i => i.severity === 'medium').length;
  const lowSeverityIssues = consistencyIssues.filter(i => i.severity === 'low').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitoring des Transactions</h1>
            <p className="text-muted-foreground">
              Surveillance et vérification de la cohérence des transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadStats}
              className="min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              onClick={generateReport}
              disabled={generatingReport}
              className="min-h-[44px]"
            >
              {generatingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer Rapport
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Réussies</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.completed_amount, 'XOF')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Échouées</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vérification de cohérence */}
        <Card>
          <CardHeader>
            <CardTitle>Vérification de Cohérence</CardTitle>
            <CardDescription>
              Détection automatique des incohérences dans les transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consistencyIssues.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Aucune incohérence détectée. Toutes les transactions sont cohérentes.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={highSeverityIssues > 0 ? 'destructive' : 'default'}>
                    {highSeverityIssues} Critique{highSeverityIssues > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant={mediumSeverityIssues > 0 ? 'default' : 'secondary'}>
                    {mediumSeverityIssues} Moyen{mediumSeverityIssues > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline">
                    {lowSeverityIssues} Mineur{lowSeverityIssues > 1 ? 's' : ''}
                  </Badge>
                </div>

                <Tabs defaultValue="high">
                  <TabsList>
                    <TabsTrigger value="high" className="min-h-[44px]">
                      Critique ({highSeverityIssues})
                    </TabsTrigger>
                    <TabsTrigger value="medium" className="min-h-[44px]">
                      Moyen ({mediumSeverityIssues})
                    </TabsTrigger>
                    <TabsTrigger value="low" className="min-h-[44px]">
                      Mineur ({lowSeverityIssues})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="high" className="space-y-2">
                    {consistencyIssues
                      .filter(i => i.severity === 'high')
                      .map((issue, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{issue.issue_type}</p>
                                <p className="text-sm">{issue.description}</p>
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                {issue.transaction_id && (
                                  <p>TX: {issue.transaction_id.substring(0, 8)}...</p>
                                )}
                                {issue.order_id && (
                                  <p>Order: {issue.order_id.substring(0, 8)}...</p>
                                )}
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                  </TabsContent>

                  <TabsContent value="medium" className="space-y-2">
                    {consistencyIssues
                      .filter(i => i.severity === 'medium')
                      .map((issue, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{issue.issue_type}</p>
                                <p className="text-sm">{issue.description}</p>
                              </div>
                              <div className="text-right text-xs text-muted-foreground">
                                {issue.transaction_id && (
                                  <p>TX: {issue.transaction_id.substring(0, 8)}...</p>
                                )}
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                  </TabsContent>

                  <TabsContent value="low" className="space-y-2">
                    {consistencyIssues
                      .filter(i => i.severity === 'low')
                      .map((issue, index) => (
                        <Alert key={index}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <p className="text-sm">{issue.description}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rapport de cohérence */}
        {report && (
          <Card>
            <CardHeader>
              <CardTitle>Rapport de Cohérence</CardTitle>
              <CardDescription>
                Rapport généré le {format(new Date(report.generated_at), 'PPP')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total d'incohérences</p>
                    <p className="text-2xl font-bold">{report.total_issues}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Critiques</p>
                    <p className="text-2xl font-bold text-red-600">
                      {report.issues_by_severity?.high || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moyennes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {report.issues_by_severity?.medium || 0}
                    </p>
                  </div>
                </div>

                {report.issues && report.issues.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Détails des incohérences</h4>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {report.issues.map((issue: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{issue.issue_type}</p>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                            <Badge
                              variant={
                                issue.severity === 'high'
                                  ? 'destructive'
                                  : issue.severity === 'medium'
                                  ? 'default'
                                  : 'outline'
                              }
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

