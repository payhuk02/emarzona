/**
 * Store Team Stats Component
 * Date: 2 Février 2025
 * 
 * Affiche les statistiques de l'équipe
 */

import { useStoreMembers } from '@/hooks/useStoreMembers';
import { useStoreTasks } from '@/hooks/useStoreTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, CheckSquare, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoreTeamStatsProps {
  storeId: string;
}

export const StoreTeamStats = ({ storeId }: StoreTeamStatsProps) => {
  const { data: members, isLoading: membersLoading } = useStoreMembers(storeId);
  const { data: tasks, isLoading: tasksLoading } = useStoreTasks(storeId);

  if (membersLoading || tasksLoading) {
    return (
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeMembers = members?.filter((m) => m.status === 'active').length || 0;
  const pendingInvitations = members?.filter((m) => m.status === 'pending').length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0;
  const pendingTasks = tasks?.filter((t) => t.status === 'pending').length || 0;
  const inProgressTasks = tasks?.filter((t) => t.status === 'in_progress').length || 0;

  const stats = [
    {
      label: 'Membres actifs',
      value: activeMembers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Invitations en attente',
      value: pendingInvitations,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
    {
      label: 'Tâches en cours',
      value: inProgressTasks,
      icon: CheckSquare,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: 'Tâches terminées',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
  ];

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={cn('hover:shadow-md transition-shadow border', stat.borderColor)}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-muted-foreground mb-1">{stat.label}</p>
                <p className={cn('text-2xl sm:text-3xl font-bold', stat.color)}>{stat.value}</p>
              </div>
              <div
                className={cn(
                  'h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center',
                  stat.bgColor,
                  stat.borderColor,
                  'border'
                )}
              >
                <stat.icon className={cn('h-5 w-5 sm:h-6 sm:w-6', stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

