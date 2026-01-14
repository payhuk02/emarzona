/**
 * Updates List Component
 * Date: 28 Janvier 2025
 * 
 * Liste des mises à jour d'un produit digital
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MoreVertical,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Shield,
  Zap,
  Package,
  FileText,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DigitalProductUpdate } from '@/hooks/digital/useProductUpdates';
import { cn } from '@/lib/utils';

interface UpdatesListProps {
  digitalProductId: string;
  currentVersion: string;
}

export function UpdatesList({ digitalProductId, currentVersion }: UpdatesListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les mises à jour
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['productUpdates', digitalProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_updates')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .order('release_date', { ascending: false });

      if (error) throw error;
      return (data || []) as DigitalProductUpdate[];
    },
  });

  // Toggle publication
  const togglePublish = useMutation({
    mutationFn: async ({ updateId, isPublished }: { updateId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from('digital_product_updates')
        .update({ is_published: !isPublished })
        .eq('id', updateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productUpdates', digitalProductId] });
      toast({
        title: '✅ Statut mis à jour',
        description: 'Le statut de publication a été modifié',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    },
  });

  // Supprimer une mise à jour
  const deleteUpdate = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from('digital_product_updates')
        .delete()
        .eq('id', updateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productUpdates', digitalProductId] });
      toast({
        title: '✅ Mise à jour supprimée',
        description: 'La mise à jour a été supprimée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de supprimer la mise à jour',
        variant: 'destructive',
      });
    },
  });

  const getReleaseTypeIcon = (type: string) => {
    switch (type) {
      case 'major':
        return <Sparkles className="h-4 w-4" />;
      case 'minor':
        return <Package className="h-4 w-4" />;
      case 'patch':
        return <Zap className="h-4 w-4" />;
      case 'hotfix':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type) {
      case 'major':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'minor':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'patch':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'hotfix':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (updates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des mises à jour</CardTitle>
          <CardDescription>
            Aucune mise à jour pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Créez votre première mise à jour pour commencer
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des mises à jour</CardTitle>
        <CardDescription>
          {updates.length} mise{updates.length > 1 ? 's' : ''} à jour
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Téléchargements</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => (
              <TableRow key={update.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{update.version}</span>
                    {update.version === currentVersion && (
                      <Badge variant="outline" className="text-xs">Actuelle</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn('gap-1', getReleaseTypeColor(update.release_type))}>
                    {getReleaseTypeIcon(update.release_type)}
                    {update.release_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{update.title}</p>
                    {update.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {update.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(update.release_date), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </TableCell>
                <TableCell>
                  {update.is_published ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Publiée
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Brouillon
                    </Badge>
                  )}
                  {update.is_forced && (
                    <Badge variant="destructive" className="ml-2 gap-1">
                      <Shield className="h-3 w-3" />
                      Forcée
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{update.download_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Select>
                    <SelectTrigger>

                        <MoreVertical className="h-4 w-4" />
                      
</SelectTrigger>
                    <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                      <SelectItem value="edit" onSelect>
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </SelectItem>
                      <SelectItem value="delete" onSelect>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </SelectItem>
                      <SelectItem value="copy" onSelect={() =>
                          togglePublish.mutate({
                            updateId: update.id,
                            isPublished: update.is_published,
                          })
                        }
                      >
                        {update.is_published ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Dépublier
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Publier
                          </>
                        )}
                      </SelectItem>
                      <SelectItem value="view" onSelect
                        className="text-destructive"
                        onSelect={() => {
                          if (confirm('Êtes-vous sûr de vouloir supprimer cette mise à jour ?')) {
                            deleteUpdate.mutate(update.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}







