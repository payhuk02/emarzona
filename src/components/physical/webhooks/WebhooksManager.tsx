/**
 * WebhooksManager - Gestionnaire de webhooks pour produits physiques
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  Play,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import {
  useStoreWebhooks,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookStats,
} from '@/hooks/physical/usePhysicalWebhooks';
import { WebhookForm } from './WebhookForm';
import { WebhookLogs } from './WebhookLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const WebhooksManager = () => {
  // Récupérer le store de l'utilisateur
  const { data: stores } = useQuery({
    queryKey: ['userStores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('user_id', user.id)
        .limit(1);

      return data || [];
    },
  });
  const storeId = stores?.[0]?.id;
  const { data: webhooks, isLoading, error } = useStoreWebhooks(storeId);
  const { data: stats } = useWebhookStats(storeId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<string | null>(null);
  const [viewingLogs, setViewingLogs] = useState<string | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<string | null>(null);

  const deleteWebhook = useDeleteWebhook();
  const testWebhook = useTestWebhook();

  const handleDelete = async (webhookId: string) => {
    await deleteWebhook.mutateAsync(webhookId);
    setDeletingWebhook(null);
  };

  const handleTest = async (webhookId: string) => {
    if (!storeId) return;
    await testWebhook.mutateAsync({ webhookId, storeId });
  };

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 sm:h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des webhooks. Veuillez réessayer plus tard.
        </AlertDescription>
      </Alert>
    );
  }

  if (!storeId) {
    return (
      <Alert>
        <AlertDescription>
          Aucun store trouvé. Veuillez créer un store d'abord.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive & Animated */}
      <div 
        ref={headerRef}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <Webhook className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Webhooks Produits Physiques
            </span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Configurez les webhooks pour recevoir des notifications sur les événements de vos produits physiques
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau webhook</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats - Responsive */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Webhooks</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.total_webhooks}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.active_webhooks} actifs
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                  <Webhook className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Déclenchés</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {stats.total_triggered}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total_success} réussis
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Taux de Réussite</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.success_rate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.total_failures} échecs
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Temps Moyen</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {stats.avg_response_time_ms ? `${stats.avg_response_time_ms.toFixed(0)}ms` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Temps de réponse
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Vos Webhooks</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Gérez vos webhooks et consultez leurs statistiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!webhooks || webhooks.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500">
                <Webhook className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun webhook</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                Créez votre premier webhook pour recevoir des notifications automatiques
              </p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un webhook
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Événement</TableHead>
                      <TableHead className="text-xs sm:text-sm">URL</TableHead>
                      <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                      <TableHead className="text-xs sm:text-sm">Déclenchements</TableHead>
                      <TableHead className="text-xs sm:text-sm">Dernier</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <Badge variant="outline">{webhook.event_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate text-xs sm:text-sm text-muted-foreground">
                            {webhook.target_url}
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.is_active ? (
                            <Badge variant="default" className="gap-1 bg-green-500">
                              <CheckCircle2 className="h-3 w-3" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs sm:text-sm">
                            <div className="font-medium">{webhook.trigger_count || 0}</div>
                            <div className="text-xs text-muted-foreground">
                              {webhook.success_count || 0} réussis, {webhook.failure_count || 0} échecs
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.last_triggered_at ? (
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {format(new Date(webhook.last_triggered_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm text-muted-foreground">Jamais</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour le webhook ${webhook.name || webhook.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setEditingWebhook(webhook.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setViewingLogs(webhook.id)}>
                                <Activity className="h-4 w-4 mr-2" />
                                Voir les logs
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTest(webhook.id)}
                                disabled={testWebhook.isPending}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Tester
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingWebhook(webhook.id)}
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

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 sm:space-y-4">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">{webhook.event_type}</Badge>
                            {webhook.is_active ? (
                              <Badge variant="default" className="gap-1 bg-green-500 text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <XCircle className="h-3 w-3" />
                                Inactif
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour le webhook ${webhook.name || webhook.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditingWebhook(webhook.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewingLogs(webhook.id)}>
                              <Activity className="h-4 w-4 mr-2" />
                              Voir les logs
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTest(webhook.id)}
                              disabled={testWebhook.isPending}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Tester
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingWebhook(webhook.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div>
                          <span className="text-muted-foreground">URL:</span>
                          <code className="block mt-1 text-xs bg-muted px-2 py-1 rounded break-all">
                            {webhook.target_url}
                          </code>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-muted-foreground">Déclenchements:</span>
                            <div className="text-xs sm:text-sm font-medium mt-1">
                              {webhook.trigger_count || 0} total
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {webhook.success_count || 0} réussis, {webhook.failure_count || 0} échecs
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground text-xs">Dernier:</span>
                            <div className="text-xs sm:text-sm mt-1">
                              {webhook.last_triggered_at ? (
                                format(new Date(webhook.last_triggered_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                              ) : (
                                <span className="text-muted-foreground">Jamais</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Créer un nouveau webhook</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Configurez un webhook pour recevoir des notifications automatiques
            </DialogDescription>
          </DialogHeader>
          <WebhookForm
            storeId={storeId}
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingWebhook && (
        <Dialog open={!!editingWebhook} onOpenChange={() => setEditingWebhook(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Modifier le webhook</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Modifiez la configuration de votre webhook
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              webhookId={editingWebhook}
              storeId={storeId!}
              onSuccess={() => setEditingWebhook(null)}
              onCancel={() => setEditingWebhook(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Logs Dialog */}
      {viewingLogs && (
        <Dialog open={!!viewingLogs} onOpenChange={() => setViewingLogs(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Logs du webhook</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Historique des envois de webhooks
              </DialogDescription>
            </DialogHeader>
            <WebhookLogs webhookId={viewingLogs} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deletingWebhook && (
        <AlertDialog open={!!deletingWebhook} onOpenChange={() => setDeletingWebhook(null)}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">Êtes-vous absolument sûr ?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Cette action ne peut pas être annulée. Cela supprimera définitivement le webhook.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deletingWebhook)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
              >
                {deleteWebhook.isPending ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};






