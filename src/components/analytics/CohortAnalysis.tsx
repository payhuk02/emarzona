import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/hooks/useStore';
import { Calendar, TrendingUp } from 'lucide-react';
import { logger } from '@/lib/logger';

interface CohortData {
  cohort: string;
  totalUsers: number;
  retention: {
    week: number;
    percentage: number;
  }[];
}

function formatCohortLabel(cohortKey: string): string {
  const [year, month] = cohortKey.split('-');
  if (!year || !month) return cohortKey;

  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

export const CohortAnalysis = () => {
  const { store } = useStore();

  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['cohort-analysis', store?.id],
    queryFn: async () => {
      if (!store?.id) return [] as CohortData[];

      const { data, error } = await supabase.rpc('get_cohort_analysis', {
        p_start_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_store_id: store.id,
      });

      if (error) {
        logger.warn('Cohort analysis failed', { error, storeId: store.id });
        return [] as CohortData[];
      }

      if (!data) return [] as CohortData[];

      return (Array.isArray(data) ? data : []) as CohortData[];
    },
    enabled: !!store?.id,
    staleTime: 60 * 60 * 1000,
  });

  if (!store) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse par Cohortes</CardTitle>
          <CardDescription>
            Sélectionnez une boutique pour voir la rétention clients.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse par Cohortes</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Analyse par Cohortes
        </CardTitle>
        <CardDescription>
          Taux de réachat cumulé par mois de première commande (semaines 1, 2, 4 et 8)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!cohortData?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Pas encore assez de commandes pour calculer les cohortes sur les 6 derniers mois.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cohorte</th>
                  <th className="text-right p-2">Clients</th>
                  <th className="text-right p-2">Semaine 1</th>
                  <th className="text-right p-2">Semaine 2</th>
                  <th className="text-right p-2">Semaine 4</th>
                  <th className="text-right p-2">Semaine 8</th>
                </tr>
              </thead>
              <tbody>
                {cohortData.map(cohort => (
                  <tr key={cohort.cohort} className="border-b">
                    <td className="p-2 font-medium">{formatCohortLabel(cohort.cohort)}</td>
                    <td className="p-2 text-right">{cohort.totalUsers.toLocaleString('fr-FR')}</td>
                    {cohort.retention.slice(0, 4).map((ret, index) => (
                      <td key={index} className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span>{ret.percentage.toFixed(1)}%</span>
                          {ret.percentage > 50 && <TrendingUp className="h-3 w-3 text-green-500" />}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
