/**
 * Store Task Card Component
 * Date: 2 Février 2025
 * 
 * Carte affichant une tâche
 */

import { useState, memo } from 'react';
import { useStoreTaskUpdate, useStoreTaskDelete, type StoreTask } from '@/hooks/useStoreTasks';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreVertical, Edit, Trash2, Calendar, Tag, User, CheckCircle2, Clock } from 'lucide-react';
import { StoreTaskDetailDialog } from './StoreTaskDetailDialog';
import { StoreTaskCalendarExport } from './StoreTaskCalendarExport';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const  PRIORITY_COLORS: Record<StoreTask['priority'], string> = {
  low: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const  PRIORITY_LABELS: Record<StoreTask['priority'], string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const  STATUS_COLORS: Record<StoreTask['status'], string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  review: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  on_hold: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

const  STATUS_LABELS: Record<StoreTask['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  review: 'En révision',
  completed: 'Terminée',
  cancelled: 'Annulée',
  on_hold: 'En pause',
};

const  CATEGORY_LABELS: Record<StoreTask['category'], string> = {
  product: 'Produit',
  order: 'Commande',
  customer: 'Client',
  marketing: 'Marketing',
  inventory: 'Inventaire',
  other: 'Autre',
};

interface StoreTaskCardProps {
  task: StoreTask;
}

export const StoreTaskCard = memo(({ task }: StoreTaskCardProps) => {
  const { store } = useStore();
  const updateTask = useStoreTaskUpdate();
  const deleteTask = useStoreTaskDelete();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStatusChange = async (newStatus: StoreTask['status']) => {
    if (!store) return;

    try {
      await updateTask.mutateAsync({
        storeId: store.id,
        taskId: task.id,
        updateData: { status: newStatus },
      });
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const handleDelete = async () => {
    if (!store) return;

    try {
      await deleteTask.mutateAsync({
        storeId: store.id,
        taskId: task.id,
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const isOverdue =
    task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();

  const getInitials = (email: string): string => {
    return email
      .split('@')[0]
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <Card
        className={cn(
          'hover:shadow-md transition-all cursor-pointer',
          isOverdue && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
        )}
        onClick={() => setDetailDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              {/* Titre et badges */}
              <div className="flex items-start gap-2 flex-wrap">
                <h3 className="font-semibold text-base flex-1 min-w-0">{task.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', PRIORITY_COLORS[task.priority])}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', STATUS_COLORS[task.status])}
                  >
                    {STATUS_LABELS[task.status]}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
              )}

              {/* Métadonnées */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                {task.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span>{CATEGORY_LABELS[task.category]}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span
                      className={cn(
                        isOverdue && 'text-red-600 dark:text-red-400 font-medium'
                      )}
                    >
                      {format(new Date(task.due_date), 'dd MMM yyyy', { locale: fr })}
                      {isOverdue && ' (en retard)'}
                    </span>
                  </div>
                )}
                {task.comments_count !== undefined && task.comments_count > 0 && (
                  <div className="flex items-center gap-1">
                    <span>{task.comments_count} commentaire{task.comments_count > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Assignés à */}
              {task.assigned_to_users && task.assigned_to_users.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <div className="flex items-center -space-x-2">
                    {task.assigned_to_users.slice(0, 3).map((user, index) => (
                      <Avatar key={user.id || index} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.email || '')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {task.assigned_to_users.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                        +{task.assigned_to_users.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.assigned_to_users.length} membre{task.assigned_to_users.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour la tâche ${task.title || task.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  setDetailDialogOpen(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Voir les détails
                </DropdownMenuItem>
                <div onClick={(e) => e.stopPropagation()} className="p-1">
                  <StoreTaskCalendarExport storeId={task.store_id} task={task} />
                </div>
                {task.status !== 'completed' && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('completed');
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer comme terminée
                  </DropdownMenuItem>
                )}
                {task.status === 'pending' && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange('in_progress');
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Commencer
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <StoreTaskDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        taskId={task.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la tâche</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la tâche "{task.title}" ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTask.isPending ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}, (prevProps, nextProps) => {
  // Re-render seulement si l'ID, le statut ou la date de mise à jour changent
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.updated_at === nextProps.task.updated_at &&
    prevProps.task.comments_count === nextProps.task.comments_count
  );
});







