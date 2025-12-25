/**
 * Store Team Analytics Component
 * Date: 2 Février 2025
 * 
 * Analytics avancés pour l'équipe (performance par membre, temps de traitement)
 */

import { useStoreMembers } from '@/hooks/useStoreMembers';
import { useStoreTasks } from '@/hooks/useStoreTasks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Clock, CheckCircle2, TrendingUp, User } from 'lucide-react';
import { useMemo } from 'react';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StoreTeamAnalyticsProps {
  storeId: string;
}

interface MemberPerformance {
  memberId: string;
  memberEmail: string;
  memberName?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  averageCompletionTime: number; // en heures
  completionRate: number; // pourcentage
  overdueTasks: number;
}

export const StoreTeamAnalytics = ({ storeId }: StoreTeamAnalyticsProps) => {
  const { data: members, isLoading: membersLoading } = useStoreMembers(storeId);
  const { data: tasks, isLoading: tasksLoading } = useStoreTasks(storeId);

  const memberPerformance = useMemo(() => {
    if (!members || !tasks) return [];

    const activeMembers = members.filter((m) => m.status === 'active');
    const performance: MemberPerformance[] = [];

    activeMembers.forEach((member) => {
      const memberTasks = tasks.filter((task) => task.assigned_to.includes(member.user_id));
      const completedTasks = memberTasks.filter((t) => t.status === 'completed');
      const inProgressTasks = memberTasks.filter((t) => t.status === 'in_progress');
      const pendingTasks = memberTasks.filter((t) => t.status === 'pending');
      
      // Calculer le temps moyen de traitement
      const completedWithTimes = completedTasks.filter(
        (t) => t.started_at && t.completed_at
      );
      const totalHours = completedWithTimes.reduce((acc, task) => {
        if (task.started_at && task.completed_at) {
          return acc + differenceInHours(new Date(task.completed_at), new Date(task.started_at));
        }
        return acc;
      }, 0);
      const averageCompletionTime = completedWithTimes.length > 0 
        ? totalHours / completedWithTimes.length 
        : 0;

      // Tâches en retard
      const overdueTasks = memberTasks.filter(
        (t) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()
      ).length;

      // Taux de complétion
      const completionRate = memberTasks.length > 0 
        ? (completedTasks.length / memberTasks.length) * 100 
        : 0;

      performance.push({
        memberId: member.user_id,
        memberEmail: member.user?.email || '',
        memberName: member.user?.user_metadata?.display_name,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        pendingTasks: pendingTasks.length,
        averageCompletionTime,
        completionRate,
        overdueTasks,
      });
    });

    return performance.sort((a, b) => b.totalTasks - a.totalTasks);
  }, [members, tasks]);

  const overallStats = useMemo(() => {
    if (!tasks) return null;

    const completed = tasks.filter((t) => t.status === 'completed');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const pending = tasks.filter((t) => t.status === 'pending');
    const overdue = tasks.filter(
      (t) => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()
    );

    const completedWithTimes = completed.filter((t) => t.started_at && t.completed_at);
    const totalHours = completedWithTimes.reduce((acc, task) => {
      if (task.started_at && task.completed_at) {
        return acc + differenceInHours(new Date(task.completed_at), new Date(task.started_at));
      }
      return acc;
    }, 0);
    const averageTime = completedWithTimes.length > 0 ? totalHours / completedWithTimes.length : 0;

    return {
      total: tasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      pending: pending.length,
      overdue: overdue.length,
      averageCompletionTime: averageTime,
      completionRate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
    };
  }, [tasks]);

  if (membersLoading || tasksLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      {overallStats && (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taux de complétion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.completionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overallStats.completed} / {overallStats.total} tâches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Temps moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallStats.averageCompletionTime > 0
                  ? `${overallStats.averageCompletionTime.toFixed(1)}h`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Par tâche terminée</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tâches en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallStats.inProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">En traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tâches en retard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {overallStats.overdue}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Échéance dépassée</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance par membre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance par membre
          </CardTitle>
          <CardDescription>
            Statistiques détaillées pour chaque membre de l'équipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {memberPerformance.length > 0 ? (
            <div className="space-y-4">
              {memberPerformance.map((member) => (
                <div
                  key={member.memberId}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {member.memberName || member.memberEmail}
                      </h3>
                      <p className="text-sm text-muted-foreground">{member.memberEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{member.totalTasks}</div>
                      <p className="text-xs text-muted-foreground">Tâches totales</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        {member.completedTasks}
                      </div>
                      <p className="text-xs text-muted-foreground">Terminées</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {member.inProgressTasks}
                      </div>
                      <p className="text-xs text-muted-foreground">En cours</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        {member.pendingTasks}
                      </div>
                      <p className="text-xs text-muted-foreground">En attente</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        {member.overdueTasks}
                      </div>
                      <p className="text-xs text-muted-foreground">En retard</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">
                        {member.completionRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Taux de complétion</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {member.averageCompletionTime > 0
                          ? `${member.averageCompletionTime.toFixed(1)}h`
                          : 'N/A'}
                      </div>
                      <p className="text-xs text-muted-foreground">Temps moyen</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun membre actif</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

