/**
 * Composant principal pour la gestion des campagnes email
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
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from '@/components/ui/select';
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
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  Calendar,
  Send,
  BarChart3,
  Sparkles,
} from '@/components/icons';
import { useEmailCampaigns } from '@/hooks/email/useEmailCampaigns';
import {
  useDeleteEmailCampaign,
  usePauseEmailCampaign,
  useResumeEmailCampaign,
  useDuplicateEmailCampaign,
  useSendEmailCampaign,
} from '@/hooks/email/useEmailCampaigns';
import { CampaignDetailDialog } from './CampaignDetailDialog';
import type { EmailCampaign, CampaignStatus } from '@/lib/email/email-campaign-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EmailCampaignManagerProps {
  storeId: string;
  onCreateCampaign?: () => void;
  onEditCampaign?: (campaign: EmailCampaign) => void;
}

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  sending: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  paused: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Brouillon',
  scheduled: 'Programmée',
  sending: 'Envoi en cours',
  paused: 'En pause',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const TYPE_LABELS: Record<string, string> = {
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'report' | 'metrics' | 'abtest'>('report');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  const { data: campaigns, isLoading, refetch } = useEmailCampaigns(storeId);
  const deleteCampaign = useDeleteEmailCampaign();
  const pauseCampaign = usePauseEmailCampaign();
  const resumeCampaign = useResumeEmailCampaign();
  const duplicateCampaign = useDuplicateEmailCampaign();
  const sendCampaign = useSendEmailCampaign();

  const openDetail = (campaign: EmailCampaign, tab: 'report' | 'metrics' | 'abtest' = 'report') => {
    setSelectedCampaign(campaign);
    setDetailTab(tab);
    setDetailOpen(true);
  };

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

  const handleMenuAction = (action: string, campaign: EmailCampaign) => {
    switch (action) {
      case 'report':
        openDetail(campaign, 'report');
        break;
      case 'metrics':
        openDetail(campaign, 'metrics');
        break;
      case 'abtest':
        openDetail(campaign, 'abtest');
        break;
      case 'edit':
        onEditCampaign?.(campaign);
        break;
      case 'send':
        void handleSend(campaign.id);
        break;
      case 'duplicate':
        void handleDuplicate(campaign.id);
        break;
      case 'resume':
        void handleResume(campaign.id);
        break;
      case 'pause':
        void handlePause(campaign.id);
        break;
      case 'delete':
        setCampaignToDelete(campaign.id);
        setDeleteDialogOpen(true);
        break;
    }
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
                  {campaigns.map(campaign => (
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
                        <Badge variant="outline">
                          {TYPE_LABELS[campaign.type] || campaign.type}
                        </Badge>
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
                            Ouvert: {campaign.metrics.opened} (
                            {campaign.metrics.delivered > 0
                              ? (
                                  (campaign.metrics.opened / campaign.metrics.delivered) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %)
                          </div>
                          <div className="text-muted-foreground">
                            Clics: {campaign.metrics.clicked}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select onValueChange={action => handleMenuAction(action, campaign)}>
                          <SelectTrigger
                            className="h-8 w-8 min-h-[44px] min-w-[44px] border-0 bg-transparent p-0 shadow-none hover:bg-accent [&_svg.opacity-50]:hidden"
                            aria-label="Actions campagne"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                            <SelectItem value="report">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Rapport & analytics
                            </SelectItem>
                            <SelectItem value="metrics">
                              <Eye className="h-4 w-4 mr-2" />
                              Voir métriques
                            </SelectItem>
                            <SelectItem value="abtest">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Test A/B
                            </SelectItem>
                            <SelectSeparator />
                            <SelectItem value="edit">
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </SelectItem>
                            {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                              <SelectItem
                                value="send"
                                disabled={sendCampaign.isPending || !campaign.template_id}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Envoyer
                              </SelectItem>
                            )}
                            <SelectItem value="duplicate" disabled={duplicateCampaign.isPending}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </SelectItem>
                            {campaign.status === 'paused' && (
                              <SelectItem value="resume" disabled={resumeCampaign.isPending}>
                                <Play className="h-4 w-4 mr-2" />
                                Reprendre
                              </SelectItem>
                            )}
                            {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
                              <SelectItem value="pause" disabled={pauseCampaign.isPending}>
                                <Pause className="h-4 w-4 mr-2" />
                                Mettre en pause
                              </SelectItem>
                            )}
                            <SelectSeparator />
                            <SelectItem
                              value="delete"
                              className="text-destructive focus:text-destructive"
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

      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={detailOpen}
        onOpenChange={open => {
          setDetailOpen(open);
          if (!open) setSelectedCampaign(null);
        }}
        defaultTab={detailTab}
      />

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
