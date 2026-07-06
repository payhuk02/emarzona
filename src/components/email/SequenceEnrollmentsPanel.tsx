/**
 * Gestion des inscriptions à une séquence email
 */
import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, UserPlus, Pause, XCircle } from 'lucide-react';
import {
  useEmailSequenceEnrollments,
  useEnrollByEmailInSequence,
  usePauseSequenceEnrollment,
  useCancelSequenceEnrollment,
} from '@/hooks/email/useEmailSequences';
import type { EmailSequence, EnrollmentStatus } from '@/lib/email/email-sequence-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

interface SequenceEnrollmentsPanelProps {
  sequence: EmailSequence;
  storeId: string;
}

export const SequenceEnrollmentsPanel = ({ sequence, storeId }: SequenceEnrollmentsPanelProps) => {
  const [email, setEmail] = useState('');
  const { data: enrollments, isLoading, refetch } = useEmailSequenceEnrollments(sequence.id);
  const enrollByEmail = useEnrollByEmailInSequence();
  const pauseEnrollment = usePauseSequenceEnrollment();
  const cancelEnrollment = useCancelSequenceEnrollment();

  const handleEnroll = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await enrollByEmail.mutateAsync({
      sequenceId: sequence.id,
      storeId,
      email: email.trim(),
    });
    setEmail('');
    refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inscrire un contact</CardTitle>
          <CardDescription>
            L&apos;email doit correspondre à un client de la boutique ou à un compte utilisateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnroll} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="enroll-email">Adresse email</Label>
              <Input
                id="enroll-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="client@exemple.com"
                required
              />
            </div>
            <Button
              type="submit"
              className="sm:self-end min-h-[44px]"
              disabled={enrollByEmail.isPending}
            >
              {enrollByEmail.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Inscrire
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inscrits ({enrollments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Chargement...</p>
          ) : !enrollments?.length ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune inscription pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Étape</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Prochain envoi</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map(enrollment => {
                    const displayContact =
                      enrollment.recipient_email ||
                      (enrollment.context?.email as string | undefined) ||
                      (enrollment.user_id ? `${enrollment.user_id.slice(0, 8)}…` : '—');
                    const isGuest = !enrollment.user_id;

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell className="text-xs">
                          <span className="font-mono">{displayContact}</span>
                          {isGuest && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">
                              Invité
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{STATUS_LABELS[enrollment.status]}</Badge>
                        </TableCell>
                        <TableCell>{enrollment.current_step}</TableCell>
                        <TableCell>
                          {format(new Date(enrollment.enrolled_at), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {enrollment.next_email_at
                            ? format(new Date(enrollment.next_email_at), 'dd MMM yyyy HH:mm', {
                                locale: fr,
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {enrollment.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                pauseEnrollment.mutateAsync({
                                  enrollmentId: enrollment.id,
                                })
                              }
                            >
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                          )}
                          {enrollment.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() =>
                                cancelEnrollment.mutateAsync({
                                  enrollmentId: enrollment.id,
                                })
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Annuler
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
