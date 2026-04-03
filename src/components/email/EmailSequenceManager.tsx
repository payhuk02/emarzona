/**
 * Composant principal pour la gestion des séquences email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/stable-dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Play, Pause, Copy, Mail } from 'lucide-react';
import { useEmailSequences } from '@/hooks/email/useEmailSequences';
import { useDeleteEmailSequence } from '@/hooks/email/useEmailSequences';
import type {
  EmailSequence,
  SequenceStatus,
  SequenceTriggerType,
} from '@/lib/email/email-sequence-service';
import { cn } from '@/lib/utils';

interface EmailSequenceManagerProps {
  storeId: string;
  onCreateSequence?: () => void;
  onEditSequence?: (sequence: EmailSequence) => void;
  onViewSteps?: (sequence: EmailSequence) => void;
}

const STATUS_COLORS: Record<SequenceStatus, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  paused: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  archived: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const STATUS_LABELS: Record<SequenceStatus, string> = {
  active: 'Active',
  paused: 'En pause',
  archived: 'Archivée',
};

const TRIGGER_LABELS: Record<SequenceTriggerType, string> = {
  event: 'Événement',
  time: 'Temps',
  behavior: 'Comportement',
};

export const EmailSequenceManager = ({
  storeId,
  onCreateSequence,
  onEditSequence,
  onViewSteps,
}: EmailSequenceManagerProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sequenceToDelete, setSequenceToDelete] = useState<string | null>(null);

  const { data: sequences, isLoading, refetch } = useEmailSequences(storeId);
  const deleteSequence = useDeleteEmailSequence();

  const handleDelete = async () => {
    if (!sequenceToDelete) return;
    await deleteSequence.mutateAsync({
      sequenceId: sequenceToDelete,
      storeId,
    });
    setDeleteDialogOpen(false);
    setSequenceToDelete(null);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement des séquences...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Séquences Email</CardTitle>
              <CardDescription>
                Gérez vos séquences d'emails automatiques ({sequences?.length || 0})
              </CardDescription>
            </div>
            <Button onClick={onCreateSequence}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle séquence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!sequences || sequences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucune séquence pour le moment</p>
              <Button onClick={onCreateSequence}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première séquence
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type de déclencheur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscrits</TableHead>
                    <TableHead>Terminés</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sequences.map(sequence => (
                    <TableRow key={sequence.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sequence.name}</p>
                          {sequence.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {sequence.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TRIGGER_LABELS[sequence.trigger_type]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', STATUS_COLORS[sequence.status])}
                        >
                          {STATUS_LABELS[sequence.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{sequence.enrolled_count || 0}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{sequence.completed_count || 0}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Actions pour la séquence ${sequence.name || sequence.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onViewSteps && (
                              <DropdownMenuItem onClick={() => onViewSteps(sequence)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir les étapes
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onEditSequence?.(sequence)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSequenceToDelete(sequence.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la séquence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La séquence et toutes ses étapes seront définitivement
              supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
