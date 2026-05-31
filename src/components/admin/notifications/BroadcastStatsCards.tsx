import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBroadcastStatsSummary } from '@/lib/admin/admin-broadcast-service';
import { CalendarClock, CheckCircle2, Megaphone, Send, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function BroadcastStatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-broadcast-stats'],
    queryFn: fetchBroadcastStatsSummary,
  });

  const cards = [
    {
      title: 'Envois totaux',
      value: data?.totalBroadcasts ?? 0,
      icon: Send,
      description: `${data?.completedCount ?? 0} terminé(s)`,
    },
    {
      title: 'Messages envoyés',
      value: data?.totalSent ?? 0,
      icon: CheckCircle2,
      description: 'Destinataires traités',
    },
    {
      title: 'Programmés',
      value: data?.scheduledCount ?? 0,
      icon: CalendarClock,
      description: "En attente d'envoi",
    },
    {
      title: 'Popups actives',
      value: data?.activePopups ?? 0,
      icon: Megaphone,
      description:
        (data?.totalFailed ?? 0) > 0
          ? `${data?.totalFailed} échec(s) récents`
          : 'Visibles sur le site',
      iconClass: (data?.totalFailed ?? 0) > 0 ? 'text-destructive' : undefined,
      extraIcon: (data?.totalFailed ?? 0) > 0 ? XCircle : undefined,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, description, iconClass }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`h-4 w-4 text-muted-foreground ${iconClass ?? ''}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{value.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
