/**
 * Live Sessions List Component
 * Liste des sessions en direct à venir et passées
 */

import { Video, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUpcomingSessions, useRegisterForSession, type LiveSession } from '@/hooks/courses/useLiveSessions';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveSessionsListProps {
  courseId: string;
  enrollmentId: string;
  userId: string;
}

export const LiveSessionsList = ({ courseId, enrollmentId, userId }: LiveSessionsListProps) => {
  const { data: sessions = [], isLoading } = useUpcomingSessions(courseId);
  const registerForSession = useRegisterForSession();

  const handleRegister = (sessionId: string) => {
    registerForSession.mutate({
      sessionId,
      enrollmentId,
      userId,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Aucune session en direct programmée</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session: any) => {
        const isUpcoming = new Date(session.scheduled_start) > new Date();
        const isLive = session.status === 'live';
        const isPast = new Date(session.scheduled_end) < new Date();

        return (
          <Card key={session.id} className={cn(
            'hover:shadow-md transition-shadow',
            isLive && 'border-green-500'
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{session.title}</CardTitle>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {isLive && (
                    <Badge variant="default" className="bg-green-600 animate-pulse">
                      En direct
                    </Badge>
                  )}
                  {isUpcoming && !isLive && (
                    <Badge variant="secondary">Programmée</Badge>
                  )}
                  {isPast && (
                    <Badge variant="outline">Terminée</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(session.scheduled_start), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(new Date(session.scheduled_start), 'HH:mm', { locale: fr })}
                    </span>
                  </div>
                  {session.registered_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{session.registered_count} inscrits</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  {isLive && session.meeting_url && (
                    <Button
                      size="sm"
                      onClick={() => window.open(session.meeting_url, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Rejoindre
                    </Button>
                  )}
                  {isUpcoming && !isLive && (
                    <Button
                      size="sm"
                      onClick={() => handleRegister(session.id)}
                      disabled={registerForSession.isPending}
                      className="flex-1"
                    >
                      S'inscrire
                    </Button>
                  )}
                  {isPast && session.recording_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(session.recording_url, '_blank')}
                      className="flex-1"
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Voir l'enregistrement
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

