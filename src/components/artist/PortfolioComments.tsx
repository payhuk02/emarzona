/**
 * Composant Commentaires pour Portfolio
 * Date: 28 Janvier 2025
 *
 * Affiche et gère les commentaires d'un portfolio
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  usePortfolioComments,
  useCreateComment,
  useToggleCommentLike,
  useReportComment,
  useUpdateComment,
  useDeleteComment,
  type PortfolioComment,
} from '@/hooks/artist/usePortfolioComments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, Reply, Flag, Edit, Trash2, MoreVertical, Send, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type PortfolioReportReason =
  | ''
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'hate_speech'
  | 'false_information'
  | 'other';

interface PortfolioCommentsProps {
  portfolioId: string;
  className?: string;
}

export function PortfolioComments({ portfolioId, className }: PortfolioCommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const [reportingComment, setReportingComment] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<PortfolioReportReason>('');
  const [reportDetails, setReportDetails] = useState('');

  const { data: comments = [], isLoading } = usePortfolioComments(portfolioId, {
    includeReplies: true,
    sortBy: 'newest',
  });

  const createComment = useCreateComment();
  const toggleLike = useToggleCommentLike();
  const reportComment = useReportComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        portfolio_id: portfolioId,
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await createComment.mutateAsync({
        portfolio_id: portfolioId,
        content: replyContent.trim(),
        parent_comment_id: parentId,
      });
      setReplyingTo(null);
      setReplyContent('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleLike = async (commentId: string, isLiked: boolean) => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour liker un commentaire.',
        variant: 'destructive',
      });
      return;
    }

    await toggleLike.mutateAsync({ commentId, isLiked });
  };

  const handleEdit = (comment: PortfolioComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !editContent.trim()) return;

    try {
      await updateComment.mutateAsync({
        commentId: editingComment,
        content: editContent.trim(),
      });
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!deletingComment) return;

    try {
      await deleteComment.mutateAsync(deletingComment);
      setDeletingComment(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleReport = async () => {
    if (!reportingComment || !reportReason) return;

    try {
      await reportComment.mutateAsync({
        comment_id: reportingComment,
        reason: reportReason === '' ? 'spam' : reportReason,
        details: reportDetails || undefined,
      });
      setReportingComment(null);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      // Error handled in hook
    }
  };

  const getAuthorName = (comment: PortfolioComment) => {
    if (comment.user) {
      return (
        comment.user.user_metadata?.full_name || comment.user.email?.split('@')[0] || 'Utilisateur'
      );
    }
    return comment.author_name || 'Anonyme';
  };

  const getAuthorAvatar = (comment: PortfolioComment) => {
    if (comment.user?.user_metadata?.avatar_url) {
      return comment.user.user_metadata.avatar_url;
    }
    return undefined;
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Commentaires ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulaire de commentaire */}
          {user ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Ajouter un commentaire..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || createComment.isPending}
                >
                  {createComment.isPending ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-pulse" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Publier
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Connectez-vous pour laisser un commentaire</p>
            </div>
          )}

          <Separator />

          {/* Liste des commentaires */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id} className="space-y-4">
                  {/* Commentaire principal */}
                  <div
                    className={cn(
                      'flex gap-4',
                      comment.is_pinned &&
                        'bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800'
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={getAuthorAvatar(comment)} />
                      <AvatarFallback>
                        {getAuthorName(comment).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{getAuthorName(comment)}</p>
                            {comment.is_pinned && (
                              <Badge variant="outline" className="bg-purple-100 text-purple-700">
                                <Pin className="h-3 w-3 mr-1" />
                                Épinglé
                              </Badge>
                            )}
                            {comment.is_edited && (
                              <span className="text-xs text-muted-foreground">(modifié)</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'dd MMMM yyyy à HH:mm', {
                              locale: fr,
                            })}
                          </p>
                        </div>

                        <Select>
                          <SelectTrigger className="h-8 w-8">

                              <MoreVertical className="h-4 w-4" />
                            
</SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            {user?.id === comment.user_id && (
                              <>
                                <SelectItem value="edit" onSelect={() => handleEdit(comment)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </SelectItem>
                                <SelectItem value="delete" onSelect={() => setDeletingComment(comment.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </SelectItem>
                              </>
                            )}
                            {user?.id !== comment.user_id && (
                              <SelectItem value="copy" onSelect={() => setReportingComment(comment.id)}>
                                <Flag className="h-4 w-4 mr-2" />
                                Signaler
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleUpdateComment}
                              disabled={updateComment.isPending}
                            >
                              Enregistrer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingComment(null);
                                setEditContent('');
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      )}

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(comment.id, comment.is_liked || false)}
                          className={cn(comment.is_liked && 'text-red-600 hover:text-red-700')}
                        >
                          <Heart
                            className={cn('h-4 w-4 mr-1', comment.is_liked && 'fill-current')}
                          />
                          {comment.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setReplyingTo(replyingTo === comment.id ? null : comment.id)
                          }
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Répondre
                        </Button>
                      </div>

                      {/* Formulaire de réponse */}
                      {replyingTo === comment.id && (
                        <div className="ml-8 space-y-2 border-l-2 border-muted pl-4">
                          <Textarea
                            placeholder="Écrire une réponse..."
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id)}
                              disabled={!replyContent.trim() || createComment.isPending}
                            >
                              Répondre
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Réponses */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-8 space-y-4 border-l-2 border-muted pl-4 mt-4">
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={getAuthorAvatar(reply)} />
                                <AvatarFallback className="text-xs">
                                  {getAuthorName(reply).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold">{getAuthorName(reply)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(reply.created_at), 'dd MMM yyyy à HH:mm', {
                                      locale: fr,
                                    })}
                                  </p>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleLike(reply.id, reply.is_liked || false)}
                                >
                                  <Heart
                                    className={cn(
                                      'h-3 w-3 mr-1',
                                      reply.is_liked && 'fill-current text-red-600'
                                    )}
                                  />
                                  {reply.likes_count}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {comment !== comments[comments.length - 1] && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun commentaire pour le moment.</p>
              <p className="text-sm mt-2">Soyez le premier à commenter !</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de signalement */}
      <Dialog open={!!reportingComment} onOpenChange={open => !open && setReportingComment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler un commentaire</DialogTitle>
            <DialogDescription>Pourquoi souhaitez-vous signaler ce commentaire ?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Raison *</label>
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full p-2 min-h-[44px] border rounded-md text-base sm:text-sm touch-manipulation cursor-pointer"
                required
              >
                <option value="">Sélectionner une raison</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Contenu inapproprié</option>
                <option value="harassment">Harcèlement</option>
                <option value="hate_speech">Discours de haine</option>
                <option value="false_information">Fausse information</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Détails (optionnel)</label>
              <Textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                rows={3}
                placeholder="Ajoutez des détails si nécessaire..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportingComment(null)}>
                Annuler
              </Button>
              <Button onClick={handleReport} disabled={!reportReason || reportComment.isPending}>
                Signaler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        open={!!deletingComment}
        onOpenChange={open => !open && setDeletingComment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le commentaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le commentaire et toutes ses réponses seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}






