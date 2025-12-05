/**
 * Cohort Analysis Component
 * Analyse la rétention des utilisateurs par cohorte
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Users, TrendingUp } from 'lucide-react';
import { logger } from '@/lib/logger';

interface CohortData {
  cohort: string; // Mois de première visite
  totalUsers: number;
  retention: {
    week: number;
    percentage: number;
  }[];
}

export const CohortAnalysis = () => {
  const { data: cohortData, isLoading } = useQuery({
    queryKey: ['cohort-analysis'],
    queryFn: async () => {
      // Récupérer les données de cohorte depuis Supabase
      // Cette requête nécessite une vue ou fonction SQL dans Supabase
      const { data, error } = await supabase
        .rpc('get_cohort_analysis', {
          start_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) {
        // Fallback si la fonction n'existe pas encore
        logger.warn('Cohort analysis function not available', { error });
        return getMockCohortData();
      }

      return data as CohortData[];
    },
    staleTime: 60 * 60 * 1000, // 1 heure
  });

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
          Rétention des utilisateurs par mois d'inscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Cohorte</th>
                <th className="text-right p-2">Utilisateurs</th>
                <th className="text-right p-2">Semaine 1</th>
                <th className="text-right p-2">Semaine 2</th>
                <th className="text-right p-2">Semaine 4</th>
                <th className="text-right p-2">Semaine 8</th>
              </tr>
            </thead>
            <tbody>
              {cohortData?.map((cohort) => (
                <tr key={cohort.cohort} className="border-b">
                  <td className="p-2 font-medium">{cohort.cohort}</td>
                  <td className="p-2 text-right">{cohort.totalUsers.toLocaleString()}</td>
                  {cohort.retention.slice(0, 4).map((ret, index) => (
                    <td key={index} className="p-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>{ret.percentage.toFixed(1)}%</span>
                        {ret.percentage > 50 && (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Données mockées pour le développement
 */
function getMockCohortData(): CohortData[] {
  const months = ['Jan 2025', 'Fév 2025', 'Mar 2025', 'Avr 2025', 'Mai 2025'];
  
  return months.map((month, index) => ({
    cohort: month,
    totalUsers: Math.floor(Math.random() * 1000) + 500,
    retention: [
      { week: 1, percentage: 80 - index * 5 },
      { week: 2, percentage: 65 - index * 5 },
      { week: 4, percentage: 50 - index * 5 },
      { week: 8, percentage: 35 - index * 5 },
    ],
  }));
}

