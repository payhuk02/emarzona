import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CalendarClock, Loader2, XCircle } from 'lucide-react';
import {
  cancelScheduledBroadcast,
  fetchScheduledBroadcasts,
} from '@/lib/admin/admin-broadcast-service';

export function ScheduledBroadcastsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduled = [], isLoading } = useQuery({
    queryKey: ['admin-scheduled-broadcasts'],
    queryFn: fetchScheduledBroadcasts,
  });

  const handleCancel = async (id: string) => {
    const ok = await cancelScheduledBroadcast(id);
    if (ok) {
      toast({ title: 'Envoi annulé' });
      await queryClient.invalidateQueries({ queryKey: ['admin-scheduled-broadcasts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-broadcast-stats'] });
    } else {
      toast({
        title: 'Erreur',
        description: "Impossible d'annuler cet envoi.",
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Envois programmés
        </CardTitle>
        <CardDescription>Messages planifiés en attente d&apos;envoi automatique</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : scheduled.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Aucun envoi programmé</p>
        ) : (
          <div className="space-y-3">
            {scheduled.map(item => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{item.title}</h3>
                    <Badge variant="outline">Programmé</Badge>
                    {item.channels.map(ch => (
                      <Badge key={ch} variant="secondary">
                        {ch}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Envoi prévu le{' '}
                    <strong>
                      {item.scheduled_at
                        ? new Date(item.scheduled_at).toLocaleString('fr-FR')
                        : '—'}
                    </strong>
                    {' · '}Audience : {item.audience_type}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="min-h-[44px] shrink-0 gap-2">
                      <XCircle className="h-4 w-4" />
                      Annuler
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Annuler l&apos;envoi programmé ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Le message &laquo; {item.title} &raquo; ne sera pas envoyé. Cette action est
                        irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Retour</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handleCancel(item.id)}>
                        Confirmer l&apos;annulation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
