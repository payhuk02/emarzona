/**
 * Composant principal pour la gestion des segments email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Users, RefreshCw } from 'lucide-react';
import { useEmailSegments, useUpdateSegmentMemberCount } from '@/hooks/email/useEmailSegments';
import { useDeleteEmailSegment } from '@/hooks/email/useEmailSegments';
import type { EmailSegment, SegmentType } from '@/lib/email/email-segment-service';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EmailSegmentManagerProps {
  storeId: string;
  onCreateSegment?: () => void;
  onEditSegment?: (segment: EmailSegment) => void;
  onPreviewSegment?: (segment: EmailSegment) => void;
}

const  TYPE_COLORS: Record<SegmentType, string> = {
  static: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  dynamic: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
};

const  TYPE_LABELS: Record<SegmentType, string> = {
  static: 'Statique',
  dynamic: 'Dynamique',
};

export const EmailSegmentManager = ({
  storeId,
  onCreateSegment,
  onEditSegment,
  onPreviewSegment,
}: EmailSegmentManagerProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);

  const { data: segments, isLoading, refetch } = useEmailSegments(storeId);
  const deleteSegment = useDeleteEmailSegment();
  const updateMemberCount = useUpdateSegmentMemberCount();

  const handleDelete = async () => {
    if (!segmentToDelete) return;
    await deleteSegment.mutateAsync({
      segmentId: segmentToDelete,
      storeId,
    });
    setDeleteDialogOpen(false);
    setSegmentToDelete(null);
    refetch();
  };

  const handleRefreshCount = async (segmentId: string) => {
    await updateMemberCount.mutateAsync(segmentId);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement des segments...</p>
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
              <CardTitle>Segments d'audience</CardTitle>
              <CardDescription>
                Gérez vos segments d'audience pour vos campagnes email ({segments?.length || 0})
              </CardDescription>
            </div>
            <Button onClick={onCreateSegment}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau segment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!segments || segments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucun segment pour le moment</p>
              <Button onClick={onCreateSegment}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier segment
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Membres</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          {segment.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {segment.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', TYPE_COLORS[segment.type])}
                        >
                          {TYPE_LABELS[segment.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {segment.member_count || 0}
                          </span>
                          {segment.type === 'dynamic' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRefreshCount(segment.id)}
                              title="Recalculer le nombre de membres"
                              aria-label="Recalculer le nombre de membres du segment"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {segment.last_calculated_at ? (
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(segment.last_calculated_at), 'PPp', { locale: fr })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions pour le segment ${segment.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onPreviewSegment && (
                              <DropdownMenuItem
                                onClick={() => onPreviewSegment(segment)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Prévisualiser
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => onEditSegment?.(segment)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSegmentToDelete(segment.id);
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
            <AlertDialogTitle>Supprimer le segment ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le segment sera définitivement supprimé.
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







