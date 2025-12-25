/**
 * Store Task Detail Dialog Component
 * Date: 2 Février 2025
 * 
 * Dialog affichant les détails d'une tâche avec commentaires
 */

import { useState } from 'react';
import { useStoreTask, useStoreTaskUpdate } from '@/hooks/useStoreTasks';
import { useStoreTaskComments, useStoreTaskCommentCreate } from '@/hooks/useStoreTaskComments';
import { useStore } from '@/hooks/useStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, Calendar, Tag, User, MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  review: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  on_hold: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  review: 'En révision',
  completed: 'Terminée',
  cancelled: 'Annulée',
  on_hold: 'En pause',
};

interface StoreTaskDetailDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
}

export const StoreTaskDetailDialog = ({ open, onClose, taskId }: StoreTaskDetailDialogProps) => {
  const { store } = useStore();
  const { user } = useAuth();
  const { data: task, isLoading } = useStoreTask(store?.id || null, taskId);
  const { data: comments, isLoading: commentsLoading } = useStoreTaskComments(
    open ? taskId : null
  );
  const createComment = useStoreTaskCommentCreate();
  const updateTask = useStoreTaskUpdate();
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddComment = async () => {
    if (!commentText.trim() || !task) return;

    setIsSubmittingComment(true);
    try {
      await createComment.mutateAsync({
        taskId: task.id,
        commentData: {
          content: commentText,
        },
      });
      setCommentText('');
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!store || !task) return;

    try {
      await updateTask.mutateAsync({
        storeId: store.id,
        taskId: task.id,
        updateData: { status: newStatus as any },
      });
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  const getInitials = (email: string): string => {
    return email
      .split('@')[0]
      .slice(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!task) {
    return null;
  }

  const isOverdue =
    task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            {task.title}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge variant="outline" className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
                {PRIORITY_LABELS[task.priority]}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[task.status])}>
                {STATUS_LABELS[task.status]}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {task.due_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date d'échéance</p>
                  <p
                    className={cn(
                      'text-sm text-muted-foreground',
                      isOverdue && 'text-red-600 dark:text-red-400 font-medium'
                    )}
                  >
                    {format(new Date(task.due_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    {isOverdue && ' (en retard)'}
                  </p>
                </div>
              </div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tags</p>
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Assignés à */}
          {task.assigned_to_users && task.assigned_to_users.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Assigné à
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {task.assigned_to_users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions rapides */}
          {task.status !== 'completed' && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('in_progress')}
                disabled={task.status === 'in_progress'}
              >
                Commencer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('completed')}
              >
                Marquer comme terminée
              </Button>
            </div>
          )}

          {/* Commentaires */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Commentaires ({comments?.length || 0})
            </h3>

            {/* Liste des commentaires */}
            {commentsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(comment.user?.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {comment.user?.user_metadata?.display_name || comment.user?.email}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun commentaire</p>
            )}

            {/* Formulaire de commentaire */}
            {user && (
              <div className="mt-4 space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  disabled={isSubmittingComment}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmittingComment ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

