/**
 * Page d'administration pour la réconciliation Moneroo
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReconcileTransaction, useReconcileTransactions, useGenerateReconciliationReport } from '@/hooks/useMonerooReconciliation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MonerooReconciliation() {
  const { toast } = useToast();
  const [transactionId, setTransactionId] = useState('');
  const [reconciliationResult, setReconciliationResult] = useState<any>(null);

  const reconcileTransactionMutation = useReconcileTransaction();
  const reconcileTransactionsMutation = useReconcileTransactions();
  const generateReportMutation = useGenerateReconciliationReport();

  const handleReconcileTransaction = async () => {
    if (!transactionId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un ID de transaction',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await reconcileTransactionMutation.mutateAsync(transactionId);
      setReconciliationResult(result);
      
      if (result.status === 'matched') {
        toast({
          title: '✅ Réconciliation réussie',
          description: 'La transaction correspond parfaitement avec Moneroo',
        });
      } else if (result.status === 'mismatched') {
        toast({
          title: '⚠️ Divergences détectées',
          description: 'La transaction a été mise à jour avec les données Moneroo',
          variant: 'default',
        });
      } else {
        toast({
          title: '❌ Erreur',
          description: result.error || 'Erreur lors de la réconciliation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const handleReconcileAll = async () => {
    try {
      const report = await reconcileTransactionsMutation.mutateAsync({
        limit: 100,
      });
      
      toast({
        title: '✅ Réconciliation terminée',
        description: `${report.matched} transactions correspondantes, ${report.mismatched} divergences corrigées`,
      });
      
      setReconciliationResult(report);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      const report = await generateReportMutation.mutateAsync({});
      
      toast({
        title: '✅ Rapport généré',
        description: `Rapport de réconciliation généré avec succès`,
      });
      
      setReconciliationResult(report);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Réconciliation Moneroo</h1>
          <p className="text-muted-foreground">
            Compare les transactions avec Moneroo pour détecter les divergences
          </p>
        </div>

        {/* Réconciliation d'une transaction */}
        <Card>
          <CardHeader>
            <CardTitle>Réconcilier une transaction</CardTitle>
            <CardDescription>
              Vérifier et corriger une transaction spécifique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="ID de transaction"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="flex-1 min-h-[44px]"
              />
              <Button
                onClick={handleReconcileTransaction}
                disabled={reconcileTransactionMutation.isPending}
                className="min-h-[44px]"
              >
                {reconcileTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Réconciliation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réconcilier
                  </>
                )}
              </Button>
            </div>

            {reconciliationResult && typeof reconciliationResult === 'object' && 'status' in reconciliationResult && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-center gap-2">
                    {reconciliationResult.status === 'matched' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : reconciliationResult.status === 'mismatched' ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Statut: {reconciliationResult.status}</p>
                      {reconciliationResult.discrepancies && (
                        <div className="mt-2 text-sm">
                          <p>Divergences détectées:</p>
                          <ul className="list-disc list-inside">
                            {reconciliationResult.discrepancies.amount && (
                              <li>
                                Montant: DB={reconciliationResult.discrepancies.amount.db}, 
                                Moneroo={reconciliationResult.discrepancies.amount.moneroo}
                              </li>
                            )}
                            {reconciliationResult.discrepancies.status && (
                              <li>
                                Statut: DB={reconciliationResult.discrepancies.status.db}, 
                                Moneroo={reconciliationResult.discrepancies.status.moneroo}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      {reconciliationResult.error && (
                        <p className="text-red-600 mt-2">{reconciliationResult.error}</p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Réconciliation en masse */}
        <Card>
          <CardHeader>
            <CardTitle>Réconciliation en masse</CardTitle>
            <CardDescription>
              Réconcilier toutes les transactions récentes (limite: 100)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleReconcileAll}
              disabled={reconcileTransactionsMutation.isPending}
              variant="outline"
              className="min-h-[44px]"
            >
              {reconcileTransactionsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Réconciliation en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réconcilier toutes les transactions
                </>
              )}
            </Button>

            {reconciliationResult && typeof reconciliationResult === 'object' && 'totalTransactions' in reconciliationResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Total de transactions:</span>
                  <Badge>{reconciliationResult.totalTransactions}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Correspondantes:</span>
                  <Badge variant="default" className="bg-green-600">
                    {reconciliationResult.matched}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Divergences corrigées:</span>
                  <Badge variant="default" className="bg-yellow-600">
                    {reconciliationResult.mismatched}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Erreurs:</span>
                  <Badge variant="destructive">
                    {reconciliationResult.errors}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Génération de rapport */}
        <Card>
          <CardHeader>
            <CardTitle>Générer un rapport</CardTitle>
            <CardDescription>
              Générer un rapport de réconciliation complet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              variant="outline"
              className="min-h-[44px]"
            >
              {generateReportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Génération...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Générer le rapport
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

