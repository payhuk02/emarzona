/**
 * Dashboard de monitoring pour les workflows
 * Date: 2 Février 2025
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmailWorkflows } from '@/hooks/email/useEmailWorkflows';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowDashboardProps {
  storeId: string;
}

export const WorkflowDashboard = ({ storeId }: WorkflowDashboardProps) => {
  const { data: workflows, isLoading } = useEmailWorkflows(storeId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement des statistiques...</p>
        </CardContent>
      </Card>
    );
  }

  if (!workflows || workflows.length === 0) {
    return null;
  }

  const totalWorkflows = workflows.length;
  const activeWorkflows = workflows.filter(w => w.status === 'active').length;
  const pausedWorkflows = workflows.filter(w => w.status === 'paused').length;
  const archivedWorkflows = workflows.filter(w => w.status === 'archived').length;

  const totalExecutions = workflows.reduce((sum, w) => sum + w.execution_count, 0);
  const totalSuccess = workflows.reduce((sum, w) => sum + w.success_count, 0);
  const totalErrors = workflows.reduce((sum, w) => sum + w.error_count, 0);
  const successRate = totalExecutions > 0 ? (totalSuccess / totalExecutions) * 100 : 0;

  const recentWorkflows = workflows
    .filter(w => w.last_executed_at)
    .sort((a, b) => {
      const dateA = new Date(a.last_executed_at || 0).getTime();
      const dateB = new Date(b.last_executed_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkflows}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {activeWorkflows} actifs
              </Badge>
              {pausedWorkflows > 0 && (
                <Badge variant="outline" className="text-xs">
                  {pausedWorkflows} en pause
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Exécutions Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Toutes les exécutions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-2">
              {successRate >= 90 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : successRate >= 70 ? (
                <Activity className="h-3 w-3 text-yellow-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "text-xs",
                successRate >= 90 && "text-green-600",
                successRate >= 70 && successRate < 90 && "text-yellow-600",
                successRate < 70 && "text-red-600"
              )}>
                {totalSuccess} réussies / {totalExecutions} totales
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErrors}</div>
            <div className="flex items-center gap-1 mt-2">
              {totalErrors === 0 ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : (
                <AlertCircle className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "text-xs",
                totalErrors === 0 ? "text-green-600" : "text-red-600"
              )}>
                {totalErrors === 0 ? 'Aucune erreur' : `${totalErrors} erreur${totalErrors > 1 ? 's' : ''}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {recentWorkflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Les 5 workflows les plus récemment exécutés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentWorkflows.map((workflow) => {
                const successRate = workflow.execution_count > 0
                  ? (workflow.success_count / workflow.execution_count) * 100
                  : 0;

                return (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{workflow.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {workflow.execution_count} exécution{workflow.execution_count !== 1 ? 's' : ''} • 
                        Dernière exécution: {new Date(workflow.last_executed_at!).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {successRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          réussite
                        </div>
                      </div>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        successRate >= 90 && "bg-green-500",
                        successRate >= 70 && successRate < 90 && "bg-yellow-500",
                        successRate < 70 && "bg-red-500"
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};







