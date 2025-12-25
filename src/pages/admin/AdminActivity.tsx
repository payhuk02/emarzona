import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActivity } from '@/hooks/useAdminActivity';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, User, Store, Package, ShoppingCart, Ban, CheckCircle, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getActionIcon = (actionType: string | undefined | null) => {
  if (!actionType) {
    return <History className="h-4 w-4" />;
  }
  switch (actionType) {
    case 'SUSPEND_USER':
      return <Ban className="h-4 w-4" />;
    case 'UNSUSPEND_USER':
      return <CheckCircle className="h-4 w-4" />;
    case 'DELETE_USER':
      return <Trash2 className="h-4 w-4" />;
    case 'DELETE_STORE':
      return <Store className="h-4 w-4" />;
    case 'DELETE_PRODUCT':
      return <Package className="h-4 w-4" />;
    case 'ACTIVATE_PRODUCT':
      return <CheckCircle className="h-4 w-4" />;
    case 'DEACTIVATE_PRODUCT':
      return <Ban className="h-4 w-4" />;
    case 'CANCEL_ORDER':
      return <ShoppingCart className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getActionLabel = (actionType: string | undefined | null) => {
  if (!actionType) {
    return 'Action inconnue';
  }
  const labels: Record<string, string> = {
    SUSPEND_USER: 'Suspension utilisateur',
    UNSUSPEND_USER: 'Réactivation utilisateur',
    DELETE_USER: 'Suppression utilisateur',
    DELETE_STORE: 'Suppression boutique',
    DELETE_PRODUCT: 'Suppression produit',
    ACTIVATE_PRODUCT: 'Activation produit',
    DEACTIVATE_PRODUCT: 'Désactivation produit',
    CANCEL_ORDER: 'Annulation commande',
  };
  return labels[actionType] || actionType;
};

const getActionVariant = (actionType: string | undefined | null): "default" | "destructive" | "secondary" => {
  if (!actionType || typeof actionType !== 'string') {
    return 'secondary';
  }
  if (actionType.includes('DELETE') || actionType.includes('SUSPEND') || actionType.includes('CANCEL')) {
    return 'destructive';
  }
  if (actionType.includes('ACTIVATE') || actionType.includes('UNSUSPEND')) {
    return 'default';
  }
  return 'secondary';
};

const AdminActivity = () => {
  const { actions, loading, refetch } = useAdminActivity();
  const { toast } = useToast();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const listRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    if (!loading && actions) {
      logger.info(`Admin Activity: ${actions.length} actions chargées`);
    }
  }, [loading, actions]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    logger.info('Admin Activity refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'L\'historique des actions a été actualisé.',
    });
  }, [refetch, toast]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Chargement de l'historique...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header avec animation - Style Inventory */}
        <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                <History className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Historique des actions
              </span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Toutes les interventions administrateurs
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            size="sm"
            className="min-h-[44px] h-11 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            )}
            <span className="hidden sm:inline text-xs sm:text-sm">Rafraîchir</span>
          </Button>
        </div>

        <div ref={listRef} role="region" aria-label="Liste des actions récentes" className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Actions récentes</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Les 100 dernières actions effectuées par les administrateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {actions && actions.length > 0 ? (
                  actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                        <div className="p-2 rounded-lg bg-background flex-shrink-0">
                          {getActionIcon(action.action_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1 sm:mb-2">
                            <Badge variant={getActionVariant(action.action_type)} className="text-xs w-fit">
                              {getActionLabel(action.action_type)}
                            </Badge>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              par {action.admin_name || 'Inconnu'}
                            </span>
                          </div>
                          {action.target_type && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Type: {action.target_type}
                            </p>
                          )}
                          {action.details?.reason && (
                            <p className="text-xs sm:text-sm mt-1 text-foreground break-words">
                              Raison: {action.details.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0 w-full sm:w-auto text-left sm:text-right">
                        {new Date(action.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <History className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-sm sm:text-base">Aucune action enregistrée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminActivity;
