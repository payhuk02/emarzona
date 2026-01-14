/**
 * Composant principal pour la gestion des campagnes email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Play, Pause, Copy, Calendar, Send } from '@/components/icons';
import { useEmailCampaigns } from '@/hooks/email/useEmailCampaigns';
import {
  useDeleteEmailCampaign,
  usePauseEmailCampaign,
  useResumeEmailCampaign,
  useDuplicateEmailCampaign,
  useSendEmailCampaign,
} from '@/hooks/email/useEmailCampaigns';
import { CampaignMetrics } from './CampaignMetrics';
import type { EmailCampaign, CampaignStatus } from '@/lib/email/email-campaign-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EmailCampaignManagerProps {
  storeId: string;
  onCreateCampaign?: () => void;
  onEditCampaign?: (campaign: EmailCampaign) => void;
}

const  STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  sending: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  paused: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const  STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmée',
  sending: 'Envoi en cours',
  paused: 'En pause',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const  TYPE_LABELS: Record<string, string> = {
  newsletter: 'Newsletter',
  promotional: 'Promotionnelle',
  transactional: 'Transactionnelle',
  abandon_cart: 'Panier abandonné',
  nurture: 'Nurture',
};

export const EmailCampaignManager = ({
  storeId,
  onCreateCampaign,
  onEditCampaign,
}: EmailCampaignManagerProps) => {
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { data: campaigns, isLoading, refetch } = useEmailCampaigns(storeId);
  const deleteCampaign = useDeleteEmailCampaign();
  const pauseCampaign = usePauseEmailCampaign();
  const resumeCampaign = useResumeEmailCampaign();
  const duplicateCampaign = useDuplicateEmailCampaign();
  const sendCampaign = useSendEmailCampaign();

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    await deleteCampaign.mutateAsync({
      campaignId: campaignToDelete,
      storeId,
    });
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
    refetch();
  };

  const handlePause = async (campaignId: string) => {
    await pauseCampaign.mutateAsync(campaignId);
    refetch();
  };

  const handleResume = async (campaignId: string) => {
    await resumeCampaign.mutateAsync(campaignId);
    refetch();
  };

  const handleDuplicate = async (campaignId: string) => {
    await duplicateCampaign.mutateAsync(campaignId);
    refetch();
  };

  const handleSend = async (campaignId: string) => {
    await sendCampaign.mutateAsync(campaignId);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement des campagnes...</p>
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
              <CardTitle>Campagnes Email</CardTitle>
              <CardDescription>
                Gérez vos campagnes email marketing ({campaigns?.length || 0})
              </CardDescription>
            </div>
            <Button onClick={onCreateCampaign}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle campagne
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucune campagne pour le moment</p>
              <Button onClick={onCreateCampaign}>
                <Plus className="h-4 w-4 mr-2" />
                Créer votre première campagne
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Programmée</TableHead>
                    <TableHead>Destinataires</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {campaign.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TYPE_LABELS[campaign.type] || campaign.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', STATUS_COLORS[campaign.status])}
                        >
                          {STATUS_LABELS[campaign.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {campaign.scheduled_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(campaign.scheduled_at), 'dd MMM yyyy HH:mm', {
                              locale: fr,
                            })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Non programmée</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {campaign.estimated_recipients?.toLocaleString() || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Ouvert: {campaign.metrics.opened} ({campaign.metrics.delivered > 0 
                              ? ((campaign.metrics.opened / campaign.metrics.delivered) * 100).toFixed(1)
                              : 0}%)
                          </div>
                          <div className="text-muted-foreground">
                            Clics: {campaign.metrics.clicked}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select>
                          <SelectTrigger
                            <Button variant="ghost" size="icon" aria-label={`Actions pour la campagne ${campaign.name}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="edit" onSelect
                              onSelect={() => {
                                setSelectedCampaign(campaign);
                                setShowMetrics(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir métriques
                            </SelectItem>
                            <SelectItem value="delete" onSelect
                              onSelect={() => onEditCampaign?.(campaign)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </SelectItem>
                            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                              <SelectItem value="copy" onSelect
                                onSelect={() => handleSend(campaign.id)}
                                disabled={sendCampaign.isPending || !campaign.template_id}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Envoyer
                              </SelectItem>
                            )}
                            <SelectItem value="view" onSelect
                              onSelect={() => handleDuplicate(campaign.id)}
                              disabled={duplicateCampaign.isPending}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </SelectItem>
                            {campaign.status === 'paused' && (
                              <SelectItem value="export" onSelect
                                onSelect={() => handleResume(campaign.id)}
                                disabled={resumeCampaign.isPending}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Reprendre
                              </SelectItem>
                            )}
                            {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
                              <SelectItem value="duplicate" onSelect
                                onSelect={() => handlePause(campaign.id)}
                                disabled={pauseCampaign.isPending}
                              >
                                <Pause className="h-4 w-4 mr-2" />
                                Mettre en pause
                              </SelectItem>
                            )}
                            <SelectItem value="toggle" onSelect
                              onSelect={() => {
                                setCampaignToDelete(campaign.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour afficher les métriques */}
      {showMetrics && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Métriques: {selectedCampaign.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowMetrics(false);
                    setSelectedCampaign(null);
                  }}
                  aria-label="Fermer les métriques"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CampaignMetrics campaign={selectedCampaign} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la campagne ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La campagne sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onSelect={handleDelete}
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







