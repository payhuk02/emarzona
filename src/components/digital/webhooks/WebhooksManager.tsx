/**
 * WebhooksManager - Gestionnaire de webhooks pour produits digitaux
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
  TrendingUp,
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  useStoreWebhooks,
  useDeleteWebhook,
  useTestWebhook,
  useWebhookStats,
} from '@/hooks/digital/useWebhooks';
import { WebhookForm } from './WebhookForm';
import { WebhookLogs } from './WebhookLogs';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const WebhooksManager = () => {
  const { data: webhooks, isLoading, error } = useStoreWebhooks();
  const { data: stats } = useWebhookStats();
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
    await testWebhook.mutateAsync(webhookId);
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
              Webhooks Produits Digitaux
            </span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Configurez les webhooks pour intégrer avec Zapier, Make ou vos scripts
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
          <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Créer un nouveau webhook</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Configurez un webhook pour recevoir des notifications d'événements
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              onSuccess={() => setIsCreateDialogOpen(false)}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques - Responsive */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Webhooks</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.total}
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Actifs</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.active}
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Envoyés</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {stats.total_sent}
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
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Taux de succès</p>
                  <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {stats.success_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des webhooks */}
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
                Créez votre premier webhook pour intégrer avec des services externes
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
                      <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                      <TableHead className="text-xs sm:text-sm">URL</TableHead>
                      <TableHead className="text-xs sm:text-sm">Événements</TableHead>
                      <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                      <TableHead className="text-xs sm:text-sm">Statistiques</TableHead>
                      <TableHead className="text-xs sm:text-sm">Dernière utilisation</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-xs sm:text-sm">{webhook.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {webhook.url.length > 40
                              ? `${webhook.url.substring(0, 40)}...`
                              : webhook.url}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 3).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.is_active ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs sm:text-sm">
                            <div className="font-medium">
                              {webhook.total_succeeded} / {webhook.total_sent}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {webhook.total_sent > 0
                                ? ((webhook.total_succeeded / webhook.total_sent) * 100).toFixed(1)
                                : 0}
                              % succès
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {webhook.last_sent_at ? (
                            <div className="text-xs sm:text-sm">
                              {format(new Date(webhook.last_sent_at), 'dd/MM/yyyy HH:mm', {
                                locale: fr,
                              })}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs sm:text-sm">Jamais</span>
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
                              <DropdownMenuItem
                                onClick={() => setEditingWebhook(webhook.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTest(webhook.id)}
                                disabled={testWebhook.isPending}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Tester
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setViewingLogs(webhook.id)}
                              >
                                <Activity className="h-4 w-4 mr-2" />
                                Voir les logs
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingWebhook(webhook.id)}
                                className="text-red-600"
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
                          <h3 className="font-semibold text-sm sm:text-base mb-1">{webhook.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            {webhook.is_active ? (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
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
                            <DropdownMenuItem
                              onClick={() => setEditingWebhook(webhook.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTest(webhook.id)}
                              disabled={testWebhook.isPending}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Tester
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setViewingLogs(webhook.id)}
                            >
                              <Activity className="h-4 w-4 mr-2" />
                              Voir les logs
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingWebhook(webhook.id)}
                              className="text-red-600"
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
                            {webhook.url}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Événements:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {webhook.events.slice(0, 3).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.events.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-muted-foreground">Statistiques:</span>
                            <div className="text-xs sm:text-sm font-medium mt-1">
                              {webhook.total_succeeded} / {webhook.total_sent} réussis
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {webhook.total_sent > 0
                                ? ((webhook.total_succeeded / webhook.total_sent) * 100).toFixed(1)
                                : 0}
                              % succès
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground text-xs">Dernière utilisation:</span>
                            <div className="text-xs sm:text-sm mt-1">
                              {webhook.last_sent_at ? (
                                format(new Date(webhook.last_sent_at), 'dd/MM/yyyy HH:mm', {
                                  locale: fr,
                                })
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

      {/* Dialog d'édition */}
      {editingWebhook && (
        <Dialog open={!!editingWebhook} onOpenChange={(open) => !open && setEditingWebhook(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Modifier le webhook</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Mettez à jour la configuration du webhook
              </DialogDescription>
            </DialogHeader>
            <WebhookForm
              webhookId={editingWebhook}
              onSuccess={() => setEditingWebhook(null)}
              onCancel={() => setEditingWebhook(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog des logs */}
      {viewingLogs && (
        <Dialog open={!!viewingLogs} onOpenChange={(open) => !open && setViewingLogs(null)}>
          <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Logs du webhook</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Historique des webhooks envoyés
              </DialogDescription>
            </DialogHeader>
            <WebhookLogs webhookId={viewingLogs} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deletingWebhook} onOpenChange={(open) => !open && setDeletingWebhook(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Supprimer le webhook</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Êtes-vous sûr de vouloir supprimer ce webhook ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingWebhook && handleDelete(deletingWebhook)}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};







